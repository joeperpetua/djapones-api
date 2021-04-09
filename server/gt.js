const translate = require('./translate_modules/translate');
const preTranslated = require('./translate_modules/translated-terms');
const wanakana = require('wanakana');
const jmdict = require('./jmdict-eng-3.1.0.json');
const fs = require('fs');
const cors = require('cors')
const express = require('express'); // Adding Express
const app = express(); // Initializing Express
const puppeteer = require('puppeteer'); // Adding Puppeteer
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

    // Launching the Puppeteer controlled headless browser and navigate to jisho
  puppeteer.launch({headless: true}).then(async function(browser) {
      // console.log('-------------------------------------')
      // console.log('Launch browser -- ', Date.now() - start, 'ms');

      const page = await browser.newPage();
      await page.setRequestInterception(true);

      // only allows the document to be fetched, aborts all the other requests
      page.on('request', request => {
        if (request.resourceType() != 'document')
          request.abort();
        else
          request.continue();
      });

      // check src lang
      switch (req.query.src) {
        case 'jp':
          let lowerCaseJP = req.query.word.toLocaleLowerCase();
          console.log(lowerCaseJP);
          await page.goto(`https://jisho.org/search/${lowerCaseJP}`).catch(err => err);
          break;
        
        case 'es':
          let tempTrans = await translate.esToEn(req.query.word);
          let lowerCaseES = tempTrans.toLocaleLowerCase();
          console.log(lowerCaseES);
          await page.goto(`https://jisho.org/search/"${lowerCaseES}"`).catch(err => err);
          break;

        default:
          console.log(`Unsupported lang, ${req.query.src}`);
          res.status(400).send({error: `Idioma de origen no soportado: "${req.query.src}" Los idiomas soportados son español (es) y japonés (jp). Petición incorrecta.`, code: 400});
          return false;
      }
      

      // console.log('Goto Jisho -- ', Date.now() - start, 'ms');

      const resCount = await page.$eval('.result_count', (response) => {
        let format = response.innerText.split(' ');
        return {entriesFound: `${format[2]}`};
      }).catch(e => {
        res.status(500).send({error: `No se ha encontrado ningún resultado para la busqueda de "${req.query.word}"`, code: 500});
        return false;
      });
      response.data.push(resCount);

      const mainResult = await page.$$eval('#primary > div.exact_block > div', (divResponses) => {
        
        let words = divResponses.map(
          (divResponse) => {
            let query = {
              kana: '',
              furigana: [],
              reading: '',
              romaji: '',
              englishDefs: [],
              spanishDefs: []
            };
  
            let furiganas = divResponse.querySelectorAll('.kanji');
            let meanings = divResponse.querySelectorAll('.meaning-meaning');
            let types = divResponse.querySelectorAll('.meaning-tags');
  
            // get kanji-kana
            query.kana = divResponse.querySelector('.text').innerText;
  
            // get furigana
            for (let furigana = 0; furigana < furiganas.length; furigana++) {
              query.furigana.push(furiganas[furigana].innerText);
            }
  
            // initialize meanings and get
            for (let meaning = 0; meaning < meanings.length; meaning++) {
              query.englishDefs.push({meaning: '', type: ''});
              query.englishDefs[meaning].meaning = meanings[meaning].innerText;

              query.spanishDefs.push({meaning: '', type: ''});
              query.spanishDefs[meaning].meaning = 'Translated meaning';
            }

            // get type of word
            
            for (let type = 0; type < types.length; type++) {
              // if note is present, then add the note text as a meaning object
              if(types[type].innerText === 'Notes'){
                let notes = divResponse.querySelectorAll('.meaning-definition.meaning-representation_notes');
                for (let note = 0; note < notes.length; note++) {
                  query.englishDefs.push({meaning: notes[note].innerText, type: types[type].innerText});

                  query.spanishDefs.push({meaning: 'Translated note', type: 'Notas'});
                }
              }else{
                if(meanings.length - types.length != -1 && meanings.length - types.length != 0){ // -1 is expected if a note is present, 0 if meaning and type are the same quantity
                  for (let meaning = 0; meaning < meanings.length; meaning++) {
                    // even counting the note, there are still meanings without type, giving all the meanings a default type
                    query.englishDefs[meaning].type = 'General expression';
                    query.spanishDefs[meaning].type = 'Expresión general';
                  }
                }else{
                  // all the meanings have a type, proceed to give each its type.
                  query.englishDefs[type].type = types[type].innerText;
                  // assign in english, then translate outside the evaluate
                  query.spanishDefs[type].type = types[type].innerText;
                }
              }
            }
            
            return query

          }
        );

        return words;

      }).catch(e => {
        console.log(`Error found in main result evaluation: ${e}`);
        res.status(500).send({error: `Error de busqueda en el servidor, por favor contacte con los administradores: ${e}, eval / HTTP 500.`, code: 500});
        return false;
      });

      // if the query is in spanish, just show 5 results
      if(req.query.src == 'es'){
        mainResult.length = 5;
      }

      

      for (let query = 0; query < mainResult.length; query++) {
        // initialize reading and romaji
        mainResult[query].reading = await getReading(mainResult[query].kana, mainResult[query].furigana);
        mainResult[query].romaji = wanakana.toRomaji(mainResult[query].reading);

        for (let meaning = 0; meaning < mainResult[query].spanishDefs.length; meaning++) {
          // translate meanings except other forms and notes
          if(mainResult[query].spanishDefs[meaning].type != 'Notas' && mainResult[query].spanishDefs[meaning].type != 'Other forms'){
            // Do not translate to avoid quota abuse
            let translationNotFormatted = await translate.enToEs(mainResult[query].englishDefs[meaning].meaning);
            
            // check for errors
            if(translationNotFormatted.includes('error 500:')){
              console.log(`Error: ${translationNotFormatted}`);
              res.status(500).send({error: `Error de busqueda en el servidor, por favor contacte con los administradores:\n${translationNotFormatted}, trans API / HTTP 500.`, code: 500});
              return false;
            }else{
              mainResult[query].spanishDefs[meaning].meaning = await removeDuplicates(translationNotFormatted);
            }
          }else{
            mainResult[query].spanishDefs[meaning].meaning = mainResult[query].englishDefs[meaning].meaning;
          }

          // use pre translated terms
          let possibleTypes = mainResult[query].spanishDefs[meaning].type.replace(/, /g, ',').split(',');
          for (let type = 0; type < possibleTypes.length; type++) {
            preTranslated.terms.forEach(term => {
              if(possibleTypes[type] == term[0]){
                if(type == 0){
                  mainResult[query].spanishDefs[meaning].type = '';
                  mainResult[query].spanishDefs[meaning].type += term[1];
                }else{
                  mainResult[query].spanishDefs[meaning].type += `, ${term[1]}`;
                }
              }
              // TODO : else send the type to translate and warn about it 
            });
          }
        }
      }


      // console.log('Get all meaning translations -- ', Date.now() - start, 'ms');

      response.data.push(mainResult);
      response.code = 200;
      //response.data.push(translatedResult);
      res.status(200).send(response);

      // console.log('Send response -- ', Date.now() - start, 'ms');
    
      await browser.close();
  }).catch(e => {
    console.log(`Error found: ${e}`);
    res.status(500).send({error: `Error de busqueda en el servidor, por favor contacte con los administradores: ${e}, HTTP 500.`, code: 500});
    return false;
  });
});

const removeDuplicates = async (str) => {
  let uniqueList = str.split('; ').filter(function(allItems,i,a){
    return i == a.indexOf(allItems);
  }).join('; ');
  return uniqueList;
}

const getReading = async (kana, furigana) => {
  console.log('------------------------')
  let kanji = [];
  let reading = kana;

  for (const char of kana) {
    if(isKanji(char)){
      console.log(`is kanji ${char}`);
      kanji.push(char);
    }
  }

  if(kanji.lenght === furigana.lenght){
    for (let i = 0; i < kanji.length; i++) {
      console.log(kanji[i], furigana[i])
      reading = reading.replace(kanji[i], furigana[i])
    }
  }

  console.log(reading);
  return reading;
}

const isKanji = (ch) => {
  return (ch >= "\u4e00" && ch <= "\u9faf") || (ch >= "\u3400" && ch <= "\u4dbf");
}

const fetchJisho = async (keyword) => {
  const res = await fetch(`https://jisho.org/api/v1/search/words?keyword=${keyword}`);
  return res;
}

const searchByKanji = (kana) => {
  let query = {
    kana: '',
    furigana: [],
    reading: '',
    romaji: '',
    englishDefs: [],
    spanishDefs: []
  };

  // iterate over all the words
  for (let word = 0; word < jmdict.words.length; word++) {
    // iterate over all the kanji of the current word
    for (let kanji = 0; kanji < jmdict.words[word].kanji.length; kanji++) {
      // check if given kanji matches the current iteration
      if(jmdict.words[word].kanji[0] && jmdict.words[word].kanji[kanji].text === kana){
        // if it matches, iterate over all the definitions
        for (let definition = 0; definition < jmdict.words[word].sense.length; definition++) {
          let tempDefinition = {
            type: '',
            note: '',
            related: '',
            field: '',
            dialect: '',
            info: '',
            text: ''
          };

          // look for the type
          for (let type = 0; type < jmdict.words[word].sense[definition].partOfSpeech.length; type++) {
            let last = jmdict.words[word].sense[definition].partOfSpeech.length - 1;
            let formattedType = '';

            // iterate through the types
            for (const tag in jmdict.tags) {
              if (tag === jmdict.words[word].sense[definition].partOfSpeech[type]){
                formattedType = jmdict.tags[tag];
              }
            }

            if(type === 0 && type != last){ // check if this type is the first and it is not unique
              tempDefinition.type = `${formattedType}, `;
            }else if(type != 0 && type != last){ // check if it is not the first nor the last
              tempDefinition.type += `${formattedType}, `;
            }else if(type === last){ 
              tempDefinition.type += `${formattedType}`;
            }
          }

          // look for misc
          for (let note = 0; note < jmdict.words[word].sense[definition].misc.length; note++) {
            let last = jmdict.words[word].sense[definition].misc.length - 1;
            let formattedNote = '';

            // iterate through the types
            for (const tag in jmdict.tags) {
              if (tag === jmdict.words[word].sense[definition].misc[note]){
                formattedNote = jmdict.tags[tag];
              }
            }

            if(note === 0 && note != last){ // check if this type is the first and it is not unique
              tempDefinition.note = `${formattedNote}, `;
            }else if(note != 0 && note != last){ // check if it is not the first nor the last
              tempDefinition.note += `${formattedNote}, `;
            }else if(note === last){ 
              tempDefinition.note += `${formattedNote}`;
            }
          }

          // look for related
          for (let related = 0; related < jmdict.words[word].sense[definition].related.length; related++) {
            let last = jmdict.words[word].sense[definition].related.length - 1;
            let formattedRelated = jmdict.words[word].sense[definition].related[related];

            // remove index for related words, don't know what they are for, might regret this later
            if(typeof(formattedRelated[formattedRelated.length-1]) === 'number'){
              formattedRelated.pop();
            }

            if(related === 0 && related != last){ // check if this type is the first and it is not unique
              tempDefinition.related = `${formattedRelated}, `;
            }else if(related != 0 && related != last){ // check if it is not the first nor the last
              tempDefinition.related += `${formattedRelated}, `;
            }else if(related === last){ 
              tempDefinition.related += `${formattedRelated}`;
            }

          }

          // look for field

          // look for dialect

          // look for info

          // look for the terms
          for (let term = 0; term < jmdict.words[word].sense[definition].gloss.length; term++) {
            let last = jmdict.words[word].sense[definition].gloss.length - 1;
            
            if(term === 0 && term != last){ // check if this term is the first and it is not unique
              tempDefinition.text = `${jmdict.words[word].sense[definition].gloss[term].text}; `;
            }else if(term != 0 && term != last){ // check if it is not the first nor the last
              tempDefinition.text += `${jmdict.words[word].sense[definition].gloss[term].text}; `;
            }else if(term === last){ 
              tempDefinition.text += `${jmdict.words[word].sense[definition].gloss[term].text}`;
            }
            
          }

          query.englishDefs.push(tempDefinition);
        }
      }
    }

  }

  return query;
}

const searchByReading = (kana) => {

}

// Making Express listen on port 7000
app.listen(7000, function() {
  console.log('Running on port 7000.');
});





