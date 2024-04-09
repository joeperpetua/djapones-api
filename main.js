// const translate = require('./translate_modules/translate');
const translateV2 = require('./translate_modules/translateV2');
const preTranslated = require('./translate_modules/translated-terms');
const libs = require('./libs');
const utils = require('./translate_modules/utils');
const cors = require('cors')
const express = require('express'); // Adding Express
const app = express(); // Initializing Express
const fetch = require('node-fetch');
const fs = require('fs');

var whitelist = ['http://localhost:3000', 'https://djapones.web.app', 'https://djapones.firebaseapp.com'] 
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.get('/', cors(corsOptions), async (req, res) => {

    if (req.query.word == undefined || req.query.word == null || req.query.word == '') {
        res.status(400).send({error: 'Término no especificado, petición incorrecta.', status: 400});
        return false;
    }

    if (req.query.lang == undefined || req.query.lang == null || req.query.lang == '') {
        res.status(400).send({error: 'Lenguaje no especificado, petición incorrecta.', status: 400});
        return false;
    }



    const response = await fetchJisho(req.query.word, req.query.lang)
    .catch(e => {
        res.status(500).send({error: `Error de busqueda en el servidor. ${e.message}`, status: 500});
        return false
    });

    let query = {};

   if(response.data){
       console.log()
        query = {
            status: response.meta.status,
            data: []
        };
        const conjugation = await utils.isConjugation(req.query.word);

        for (let result = 0; result < response.data.length; result++) {
            query.data.push(await formatResult(response.data[result], conjugation)); 
        }

        query.data = await translateBulk(query.data).catch(e => e);
    }else{
        query = response;
    }
    
    
    
    if(!res.writableFinished){
        console.log(res.writableFinished)
        res.status(200).send(query);
    }
    
});

const fetchJisho = async (keyword, lang) => {
    let lowerCaseKeyword = keyword.toLocaleLowerCase();
    let translatedKeyword;
    
    switch (lang) {
        case "auto":
            translatedKeyword = await libs.manageLangDetection(lowerCaseKeyword);
            console.log('-----', translatedKeyword, lang);
            break;

        case "jp":
            translatedKeyword = lowerCaseKeyword;
            console.log('-----', translatedKeyword, lang);
            break;
        
        case "es":
            let tempTrans = await translateV2.esToEn(lowerCaseKeyword).catch(e => {
                throw new Error(`Error en el manejo de la búsqueda para: ${keyword} - ${e}`);
            });
            translatedKeyword = tempTrans.toLocaleLowerCase();
            console.log('-----', translatedKeyword, lang);
            break;
        default:
            throw new Error(`Lenguaje no válido:  ${lang}.`);
            break;
    }

    

    let url = `https://jisho.org/api/v1/search/words?keyword=${translatedKeyword}`;
    const options = {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' }
    }
    // fetch jisho
    const res = await fetch(encodeURI(url), options).catch(err => {
        throw new Error(`Error al procesar API call:  ${err}`)
    });
    const response = await res.json();
    
    if(response.data.length === 0){
        throw new Error(`No se ha encontrado ningún resultado para la busqueda de:  ${keyword}`);
    }

   // console.log(res)
   return response;
}

const formatResult = async (result, conjugation) => {
    let formattedResult = {
        japanese: [
            // {
            // word: '', // if word does not contain kanji, this
            // reading: '',
            // romaji: ''
            // }
        ],

        englishDefs: [
            // {
            // type: '',
            // note: '',
            // related: '',
            // field: '',
            // dialect: '',
            // info: '',
            // text: ''
            // }
        ],
        spanishDefs: [
            // idem as in englishDefs
        ],
        isCommon: result.is_common ? true : false,
        possibleConjugation: conjugation
    };

    // get japanese data
    for (let word = 0; word < result.japanese.length; word++) {
        formattedResult.japanese.push(await getJapanese(result.japanese[word]));
    }

    // get spanish defs 
    for (let sense = 0; sense < result.senses.length; sense++) {
            
        // ignore wikipedia definitions
        if (result.senses[sense].parts_of_speech[0] != 'Wikipedia definition' && result.senses[sense].parts_of_speech[0] != 'links') {
            formattedResult.spanishDefs.push(await getDefinitions(result.senses[sense]));
        }
    }

    return formattedResult;
}

const getJapanese = async (word) => {
    let tempWord = {
        word: word.word ? word.word : word.reading,
        reading: word.reading,
        romaji: utils.wanakana.toRomaji(word.reading)
    }

    return tempWord;
}

const getDefinitions = async (sense) => {
    // initialize temp defintion
    let tempDefinition = {
        type: '',
        tags: '',
        related: '',
        restrictions: '', // 'only applies to...'
        antonyms: '',
        info: '',
        text: ''
    };

    tempDefinition.type = await getDefinitionData(sense.parts_of_speech, ',', 'partOfSpeech');
    tempDefinition.tags = await getDefinitionData(sense.tags, ',', 'tag');
    tempDefinition.related = await getDefinitionData(sense.see_also, ',', 'related');
    tempDefinition.restrictions = await getDefinitionData(sense.restrictions, ',', 'restrictions');
    tempDefinition.antonyms = await getDefinitionData(sense.antonyms, ',', 'antonyms');
    tempDefinition.info = await getDefinitionData(sense.info, ',', 'info');
    tempDefinition.text = await getDefinitionData(sense.english_definitions, ';', 'text');

    return tempDefinition;
}

const getDefinitionData = async (array, separator, itemType) => {
    let dataToReturn = '';

    if (array) {
        for (let i = 0; i < array.length; i++) {
            let last = array.length - 1;
            let item = array[i];

            // translate item before formatting
            // search for pre-translated
            if (itemType === 'partOfSpeech' || itemType === 'tag' || itemType === 'info') {
                let found = false;

                preTranslated.terms.forEach(term => {

                    if(term[2]){ // has to concat -- if not match then word is not in the list
                        if (term && item.toLowerCase().includes(term[0].toLowerCase())) {
                            // console.log(`found tag for concat ----- ${item} -------- ${term[0]}}`);
                            var regEx = new RegExp(term[0], "i");
                            item = item.replace(regEx, term[1]); 
                            // console.log(`Ends up as -> ${item}`);
                            found = true;
                        }
                    }else{ //does not have to concat -- replace all -- if not match then word is not in the list
                        if (term && item.toLowerCase() === term[0].toLowerCase()) {
                            // console.log(`found tag to replace all ----- ${item} -------- ${term[0]}}`);
                            item = term[1];
                            // console.log(`Ends up as -> ${item}`);
                            found = true;
                        }
                    }
                });

                if (!found) {
                    console.log(`missing tag ----- ${item} -----`);
                    let timestamp = new Date();
                    timestamp = timestamp.toLocaleString()
                    // register missing tag
                    fs.appendFileSync('translate_modules/not-found-tags.txt', `${item} [${timestamp}][not added];\n`, function (err) {
                        if (err) return console.log(err);
                    });
                    // then translate it
                    item = await translateV2.enToEs(item, false).catch(e => console.log(e));
                    console.log(item)
                }
            }

            // add parenthesis for readings of related words
            if (itemType === 'related' && item.includes(' ')) {
                item = item + ')';
                item = item.replace(' ', ' (');
                item = 'Véase también ' + item;
            }

            if (itemType === 'restrictions') {
                item = 'Sólo aplica a: ' + item;
            }

            if (itemType === 'antonyms') {
                item = 'Antónimo: ' + item;
            }
    
            // check item position to format correctly with separators
            if(i === last){ 
                dataToReturn += `${item}`;
            }else if(i === 0 ){
                dataToReturn = `${item}${separator} `;
            }else{
                dataToReturn += `${item}${separator} `;
            }
        } 
    }

    return dataToReturn;
}

const translateBulk = async (data) => {
    let untranslatedDataString = ``;

    for (let dataObj = 0; dataObj < data.length; dataObj++) {
        for (let def = 0; def < data[dataObj].spanishDefs.length; def++) {
            if(data[dataObj].spanishDefs[def].text != ''){
                untranslatedDataString += `<span>${data[dataObj].spanishDefs[def].text}</span>`;
            }
        }
    }
    
    // translate array -- returns string
    let translatedData = await translateV2.enToEs(untranslatedDataString, true).catch(e => console.log(e));
    
    // console.log('--------------------------------');
    // console.log(untranslatedDataString);
    // console.log('--------------------------------');
    // console.log(translatedData);

    translatedData = translatedData.replaceAll('<span>', '');
    let translatedDataArray = translatedData.split('</span>');

    //remove dups
    translatedDataArray = await utils.removeDuplicates(translatedDataArray);

    console.log(data.length, translatedDataArray.length);

    //reassign translated values
    let counter = 0;
    for (let dataObj = 0; dataObj < data.length; dataObj++) {
        for (let def = 0; def < data[dataObj].spanishDefs.length; def++) {
            if(data[dataObj].spanishDefs[def].text != ''){
                // console.log(data[dataObj].spanishDefs[def].text + ' ==> ' + translatedDataArray[counter]);
                data[dataObj].spanishDefs[def].text = translatedDataArray[counter];
                counter++;
            }
        }
    }

    return data;
}

// Making Express listen on port 7000
app.listen(7000, function() {
  console.log('Running on port 7000.');
});





