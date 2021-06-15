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

    // Launching the Puppeteer controlled headless browser and navigate to the Digimon website
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

        // console.log('Launch page -- ', Date.now() - start, 'ms');

        await page.goto(`https://jisho.org/search/${req.query.word}`);
        // console.log('Goto Jisho -- ', Date.now() - start, 'ms');

        const resCount = await page.$eval('.result_count', e => e.innerHTML).catch(e => {
          console.log(e);
          return null
        });
        response.push(resCount);
        // console.log('Get res amount -- ', Date.now() - start, 'ms');

        const mainMeaning = await page.$eval('.meaning-meaning', e => e.innerHTML).catch(e => {
          console.log(e);
          return null
        });
        // console.log('Get main meaning -- ', Date.now() - start, 'ms');
        response.push(await formatMeaning(mainMeaning));
        // console.log('Format main meaning -- ', Date.now() - start, 'ms');

        // fetchCambridge(response);

        // await page.goto(`https://dictionary.cambridge.org/dictionary/english-spanish/${response[1][0]}`);
        // const translation = await page.$eval('.trans.dtrans.dtrans-se', e => e.innerText).catch(e => {
        //   console.log(e, page.url());
        //   return null
        // });
        
        // response.push(translation);
        const translation = [];
        for (let i = 0; i < response[1].length; i++) {
          const definition = response[1][i];

          await page.goto(`https://dictionary.cambridge.org/dictionary/english-spanish/${definition}`);
          // console.log('Goto Cambridge iteration -- ', Date.now() - start, 'ms');
          const element = await page.$eval('.trans.dtrans.dtrans-se', e => e.innerText).catch(e => {
            console.log(e, page.url());
            return null
          });
          

          // await page.goto(`https://www.deepl.com/translator#en/es/${definition}`);
          // const element = await page.$eval('.lmt__textarea.lmt__textarea_dummydiv', e => e.innerText).catch(e => {
          //   console.log(e, page.url());
          //   return null
          // });

          translation.push(element);
        }
        // console.log('Get all meaning translations -- ', Date.now() - start, 'ms');
        response.push(translation);
        
        res.send(response);
        // console.log('Send response -- ', Date.now() - start, 'ms');
        await browser.close();
        // console.log('Close browser -- ', Date.now() - start, 'ms');
    });
});

const formatMeaning = async (phrase) => {
  let format = phrase;
  let formatArray;

  format = await removeTo(format);
  format = await removeParentheses(format);

  formatArray = format.split('; ');

  return formatArray
}

const removeTo = async (phrase) => {
  // add space to beginning of string to get the "to" of first verb, this way avoiding removing "to " blindly 
  let format = ` ${phrase}`;

  if(format.includes(' to ')){
    format = format.replace(/ to /g, ' ');
    if(format.includes(' be ')){
      format = format.replace(/ be /g, ' ');
    }
  }

  return format;
} 

const removeParentheses = async (phrase) => {
  let format = phrase;

  if(format.includes('(') && format.includes(')')){
    format = format.replace(/\s*\([^()]*\)/g, "");
      if(format.includes('(') && format.includes(')')){
        format = format.replace(/\s*\([^()]*\)/g, "");
      }
  }

  return format;
}


// Making Express listen on port 7000
app.listen(7000, function() {
  console.log('Running on port 7000.');
});


