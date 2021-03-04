const translate = require('./translate_modules/translate');
const preTranslated = require('./translate_modules/translated-terms');
const express = require('express'); // Adding Express
const app = express(); // Initializing Express
const puppeteer = require('puppeteer'); // Adding Puppeteer

// const puppeteer = require('puppeteer-extra'); // Adding Puppeteer
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// puppeteer.use(StealthPlugin());

// Wrapping the Puppeteer browser logic in a GET request
app.get('/', function(req, res) {
  const start = Date.now();
  let time;
  let response = [];

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

        await page.goto(`https://jisho.org/search/${req.query.word}`).catch(err => err);

        // console.log('Goto Jisho -- ', Date.now() - start, 'ms');

        const resCount = await page.$eval('.result_count', (response) => {
          let format = response.innerText.split(' ');
          return {entriesFound: `${format[2]}`};
        }).catch(e => {
          console.log(`Error found: ${e}`);
          return `Error found: ${e}`
        });
        response.push(resCount);

        const mainResult = await page.$$eval('#primary > div.exact_block > div', (divResponses) => {
          
          let words = divResponses.map(
            (divResponse) => {
              let query = {
                kana: '',
                furigana: [],
                meanings: []
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
                query.meanings.push({meaning: '', type: ''});
                query.meanings[meaning].meaning = meanings[meaning].innerText;
              }

              // get type of word

              
              for (let type = 0; type < types.length; type++) {
                // if note is present, then add the note text as a meaning object
                if(types[type].innerText === 'Notes'){
                  let notes = divResponse.querySelectorAll('.meaning-definition.meaning-representation_notes');
                  for (let note = 0; note < notes.length; note++) {
                    query.meanings.push({meaning: notes[note].innerText, type: types[type].innerText});
                  }
                }else{
                  if(meanings.length != types.length){
                    for (let meaning = 0; meaning < meanings.length; meaning++) {
                      // even counting the note, there are still meanings without type, giving all the meanings a default type
                      query.meanings[meaning].type = 'General expression';
                    }
                  }else{
                    // all the meanings have a type, proceed to give each its type.
                    query.meanings[type].type = types[type].innerText;
                  }
                }
              }
              

              
              return query

            }
          );

          return words;

        }).catch(e => {
          console.log(`Error found: ${e}`);
          return `Error found: ${e}`
        });

        let translatedResult = mainResult;

        for (let query = 0; query < mainResult.length; query++) {
          for (let meaning = 0; meaning < mainResult[query].meanings.length; meaning++) {
            let possibleTypes = mainResult[query].meanings[meaning].type.replace(/, /g, ',').split(',');
            for (let type = 0; type < possibleTypes.length; type++) {
              preTranslated.terms.forEach(term => {
                if(possibleTypes[type] == term[0]){
                  console.log(type, possibleTypes[type], term[0], term[1]);
                  if(type == 0){
                    translatedResult[query].meanings[meaning].type = '';
                    translatedResult[query].meanings[meaning].type += term[1];
                  }else{
                    translatedResult[query].meanings[meaning].type += `, ${term[1]}`;
                  }
                }
                // TODO : else send the type to translate and warn about it 
              });
            }
          }
        }

        // Do not translate to avoid quota abuse
        
        // for (let array = 0; array < mainResult.length; array++) {
        //   for (let element = 0; element < mainResult[array].length; element++) {
        //     const temp = await translate.enToEs(mainResult[array][element]);
        //     translation.push(temp);
        //   }
        // }

        // console.log('Get all meaning translations -- ', Date.now() - start, 'ms');

        response.push(mainResult);
        //response.push(translatedResult);
        res.send(response);

        // console.log('Send response -- ', Date.now() - start, 'ms');

        await browser.close();
    });
});


// Making Express listen on port 7000
app.listen(7000, function() {
  console.log('Running on port 7000.');
});





