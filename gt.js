const translate = require('./translate_modules/translate');
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

        await page.goto(`https://jisho.org/search/${req.query.word}`);

        // console.log('Goto Jisho -- ', Date.now() - start, 'ms');

        const resCount = await page.$eval('.result_count', e => e.innerHTML).catch(e => {
          console.log(e);
          return null
        });
        response.push(resCount);

        const mainMeaning = await page.$eval('.meaning-meaning', e => e.innerHTML).catch(e => {
          console.log(e);
          return null
        });

        response.push(mainMeaning);
        const translation = await translate.enToEs(mainMeaning)

        // console.log('Get all meaning translations -- ', Date.now() - start, 'ms');

        response.push(translation);
        res.send(response);

        // console.log('Send response -- ', Date.now() - start, 'ms');

        await browser.close();
    });
});


// Making Express listen on port 7000
app.listen(7000, function() {
  console.log('Running on port 7000.');
});





