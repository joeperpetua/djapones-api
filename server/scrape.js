const translate = require('./translate_modules/translate');
const preTranslated = require('./translate_modules/translated-terms');
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


// Wrapping the Puppeteer browser logic in a GET request
app.get('/', cors(corsOptions), function(req, res) {
  const start = Date.now();
  let time;
  let response = {
    code: '',
    data: []
  };

  if (req.query.src == undefined || req.query.src == null || req.query.src == '') {
    res.status(400).send({error: 'Idioma de origen no especificado, petición incorrecta.', code: 400});
    return false;
  }

  if (req.query.word == undefined || req.query.word == null || req.query.word == '') {
    res.status(400).send({error: 'Termino no especificado, petición incorrecta.', code: 400});
    return false;
  }

  // conjugator.unconjugate(req.query.word)

  (async () => {
    res.status(200).send(await fetchJisho(req.query.word, req.query.src).catch(e => {
        console.log(`Error found: ${e}\n${e.stack}`);
        return {error: `Error de busqueda en el servidor, por favor contacte con los administradores: ${e}, HTTP 500.`, code: 500};
    }));
  })();

});

const fetchJisho = async (keyword, src) => {
    let url = '';

    // check src lang
    switch (src) {
    case 'jp':
        let lowerCaseJP = keyword.toLocaleLowerCase();
        console.log(lowerCaseJP);
        url = `https://jisho.org/api/v1/search/words?keyword=${lowerCaseJP}`;
        break;
    
    case 'es':
        let tempTrans = await translate.esToEn(keyword);
        let lowerCaseES = tempTrans.toLocaleLowerCase();
        console.log(lowerCaseES);
        url = `https://jisho.org/api/v1/search/words?keyword=${lowerCaseES}`;
        break;

    default:
        console.log(`Unsupported lang, ${src}`);
        return {error: `Idioma de origen no soportado: ${src}. Los idiomas soportados son español (es) y japonés (jp). Petición incorrecta.`, code: 400};
    }

    // fetch jisho
   const res = await fetch(encodeURI(url))
   .then(response => response.json())
   .then(res => res.data.length != 0 ? res : {error: `No se ha encontrado ningún resultado para la busqueda de:  ${keyword}`});
  
   let query = {
        status: res.meta.status,
        data: []
    };

   if(res.data){
        const conjugation = await utils.isConjugation(keyword, src);
        for (let result = 0; result < res.data.length; result++) {
            query.data.push(await formatResult(res.data[result], conjugation)); 
        }
        query.data = await translateBulk(query.data).catch(e => e);
        //let t = `house; residence; dwelling - family; household - lineage; family name - no; nay -well; er; why - you're welcome; not at all; don't mention it - running away from home; elopement - outing; going out - becoming a Buddhist monk; entering the priesthood - landlord; landlady - house owner; home owner; head of the household - Jesus (Christ) - social standing of a family; lineage; parentage; pedigree - good family - the road home - row of houses - each house; every house; every door - to be possible to say; to be able to say - said; have said - each house; every house; many houses`;
        //query.data[0].spanishDefs[0].text = await translate.enToEs(t);
    }else{
        query = res;
    }

   return query;
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
        isCommon: result.is_common,
        possibleConjugation: conjugation
    };

    // get japanese data
    for (let word = 0; word < result.japanese.length; word++) {
        formattedResult.japanese.push(await getJapanese(result.japanese[word]));
    }

    // get spanish defs 
    for (let sense = 0; sense < result.senses.length; sense++) {
        formattedResult.spanishDefs.push(await getDefinitions(result.senses[sense]));
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


    
    // ignore wikipedia definitions
    if (sense.parts_of_speech[0] != 'Wikipedia definition') {
        tempDefinition.type = await getDefinitionData(sense.parts_of_speech, ',', 'partOfSpeech');
        tempDefinition.tags = await getDefinitionData(sense.tags, ',', 'tag');
        tempDefinition.related = await getDefinitionData(sense.see_also, ',', 'related');
        tempDefinition.restrictions = await getDefinitionData(sense.restrictions, ',', 'restrictions');
        tempDefinition.antonyms = await getDefinitionData(sense.antonyms, ',', 'antonyms');
        tempDefinition.info = await getDefinitionData(sense.info, ',', 'info');
        tempDefinition.text = await getDefinitionData(sense.english_definitions, ';', 'text');
    }


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
                    if (term && item.toLowerCase().includes(term[0].toLowerCase())) {
                        // console.log(`found tag ----- ${item} -------- ${term[0]}`);
                        if(term[2]){ // has to concatenate, use replace
                            var regEx = new RegExp(term[0], "i");
                            item = item.replace(regEx, term[1]); 
                        }else if(item === term[0]){ // does not have to concat, assign total value
                            item = term[1];
                        }

                        found = true;
                    }
                });

                if (!found) {
                    console.log(`missing tag ----- ${item} -----`);
                    // register missing tag
                    fs.appendFileSync('translate_modules/not-found-tags.txt', `${item} [not added];\n`, function (err) {
                        if (err) return console.log(err);
                    });
                    // then translate it
                    item = await translate.enToEs(item);
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

            if (itemType === 'text') {
                //item = await translate.enToEs(item).catch(e => e);
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
    let bulkText = '';
    let translationBulk = '';
    
    // form bulk text from all text fields of the results
    for (let dataObj = 0; dataObj < data.length; dataObj++) {
        for (let def = 0; def < data[dataObj].spanishDefs.length; def++) {
            if(data[dataObj].spanishDefs[def].text != ''){
                bulkText += `${data[dataObj].spanishDefs[def].text} || `;
            }
        }
    }

    // translate bulk text
    translationBulk = await translate.enToEs(bulkText).catch(e => e);

    //translationBulk = bulkText;

    // separate bulk text into arrays
    let translatedArray = translationBulk.split(' || ');

    let counter = 0;
    //reassign translated values
    for (let dataObj = 0; dataObj < data.length; dataObj++) {
        for (let def = 0; def < data[dataObj].spanishDefs.length; def++) {
            if(data[dataObj].spanishDefs[def].text != ''){

                data[dataObj].spanishDefs[def].text = await utils.removeDuplicates(translatedArray[counter]);
                
                // remove || from last item if matches
                if (data[dataObj].spanishDefs[def].text.includes(' ||')) {
                    data[dataObj].spanishDefs[def].text = data[dataObj].spanishDefs[def].text.replace(' ||', '');
                }
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





