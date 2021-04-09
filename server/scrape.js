const translate = require('./translate_modules/translate');
const preTranslated = require('./translate_modules/translated-terms');
const wanakana = require('wanakana');
const cors = require('cors')
const express = require('express'); // Adding Express
const app = express(); // Initializing Express
const { default: fetch } = require('node-fetch');

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

  (async () => {
    res.status(200).send(await fetchJisho(req.query.word, req.query.src).catch(e => {
        console.log(`Error found: ${e}`);
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
        for (let result = 0; result < res.data.length; result++) {
            query.data.push(await formatResult(res.data[result])); 
        }
    }else{
        query = res;
    }

   return query;
}

const formatResult = async (result) => {
    let formattedResult = {
        japanese: [
            // {
            // word: '',
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
        isCommon: result.is_common
    };

    // get japanese data
    for (let word = 0; word < result.japanese.length; word++) {
        formattedResult.japanese.push(await getJapanese(result.japanese[word]));
    }

    // get english defs
    for (let sense = 0; sense < result.senses.length; sense++) {
        formattedResult.englishDefs.push(await getDefinitions(result.senses[sense]));
    }

    return formattedResult;
}

const getJapanese = async (word) => {
    let tempWord = {
        word: word.word,
        reading: word.reading,
        romaji: wanakana.toRomaji(word.reading)
    }

    return tempWord;
}

const getDefinitions = async (sense) => {
    // initialize temp defintion
    let tempDefinition = {
        type: '',
        tags: '',
        related: '',
        info: '',
        text: ''
    };

    tempDefinition.type = await getDefinitionData(sense.parts_of_speech, ',', false);
    tempDefinition.tags = await getDefinitionData(sense.tags, ',', false);
    tempDefinition.related = await getDefinitionData(sense.see_also, ',', true);
    tempDefinition.info = await getDefinitionData(sense.info, ',', false);
    tempDefinition.text = await getDefinitionData(sense.english_definitions, ';', false);

    return tempDefinition;
}

const getDefinitionData = async (array, separator, isRelated) => {
    let dataToReturn = '';

    if (array) {
        for (let i = 0; i < array.length; i++) {
            let last = array.length - 1;
            let item = array[i];

            // add parenthesis for readings of related words
            if (isRelated && item.includes(' ')) {
                item = item + ')';
                item = item.replace(' ', ' (');
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

const isKanji = (ch) => {
    return (ch >= "\u4e00" && ch <= "\u9faf") || (ch >= "\u3400" && ch <= "\u4dbf");
}

const removeDuplicates = async (str) => {
    let uniqueList = str.split('; ').filter(function(allItems,i,a){
      return i == a.indexOf(allItems);
    }).join('; ');
    return uniqueList;
}

// Making Express listen on port 7000
app.listen(7000, function() {
  console.log('Running on port 7000.');
});





