const translate = require('./translate_modules/translate');
const preTranslated = require('./translate_modules/translated-terms');
var cors = require('cors')
const express = require('express'); // Adding Express
const app = express(); // Initializing Express
const puppeteer = require('puppeteer'); // Adding Puppeteer

// const puppeteer = require('puppeteer-extra'); // Adding Puppeteer
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// puppeteer.use(StealthPlugin());

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
    res.status(400).send({error: 'No src lang specified, bad request.', code: 400});
    return false;
  }

  if (req.query.word == undefined || req.query.word == null || req.query.word == '') {
    res.status(400).send({error: 'No word specified, bad request.', code: 400});
    return false;
  }

    // Launching the Puppeteer controlled headless browser and navigate to jisho
    puppeteer.launch({headless: false}).then(async function(browser) {
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
            let lowerCaseJP = req.query.src.toLocaleLowerCase();
            await page.goto(`https://jisho.org/search/${lowerCaseJP}`).catch(err => err);
            break;
          
          case 'es':
            let tempTrans = await translate.esToEn(req.query.word);
            let lowerCaseES = tempTrans.toLocaleLowerCase();
            console.log(tempTrans);
            await page.goto(`https://jisho.org/search/"${lowerCaseES}"`).catch(err => err);
            break;

          default:
            console.log(`Unsupported lang, ${req.query.src}`);
        }
        

        // console.log('Goto Jisho -- ', Date.now() - start, 'ms');

        const resCount = await page.$eval('.result_count', (response) => {
          let format = response.innerText.split(' ');
          return {entriesFound: `${format[2]}`};
        }).catch(e => {
          res.status(500).send({error: 'No results found.', code: 500});
          return false;
        });
        response.data.push(resCount);

        const mainResult = await page.$$eval('#primary > div.exact_block > div', (divResponses) => {
          
          let words = divResponses.map(
            (divResponse) => {
              let query = {
                kana: '',
                furigana: [],
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
          res.status(500).send({error: `Error found in main result evaluation: ${e}, server error.`, code: 500});
          return false;
        });

        // if the query is in spanish, just show 5 results
        if(req.query.src == 'es'){
          mainResult.length = 5;
        }

        

        for (let query = 0; query < mainResult.length; query++) {
          console.log(mainResult.length)
          console.log(mainResult)
          console.log(`${query} english def ${mainResult[query].englishDefs}`)
          console.log(`${query} spanish def ${mainResult[query].spanishDefs}`)
          for (let meaning = 0; meaning < mainResult[query].spanishDefs.length; meaning++) {
            // translate meanings except other forms and notes
            if(mainResult[query].spanishDefs[meaning].type != 'Notas' && mainResult[query].spanishDefs[meaning].type != 'Other forms'){
              // Do not translate to avoid quota abuse
              let translationNotFormatted = await translate.enToEs(mainResult[query].englishDefs[meaning].meaning);
              
              // check for errors
              if(translationNotFormatted.includes('error 500:')){
                console.log(`Error: ${translationNotFormatted}`);
                res.status(500).send({error: `Translation error, server error.\n${translationNotFormatted}`, code: 500});
                return false;
              }else{
                mainResult[query].spanishDefs[meaning].meaning = await removeDuplicates(translationNotFormatted);
              }
            }else{
              console.log(mainResult[query].spanishDefs[meaning].meaning);
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
      res.status(500).send({error: `Error found: ${e}, server error.`, code: 500});
      return false;
    });
});

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





