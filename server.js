const express = require('express'); // Adding Express
const app = express(); // Initializing Express
const puppeteer = require('puppeteer'); // Adding Puppeteer

// Wrapping the Puppeteer browser logic in a GET request
app.get('/', function(req, res) {
  let response = [];

    // Launching the Puppeteer controlled headless browser and navigate to the Digimon website
    puppeteer.launch().then(async function(browser) {
        const page = await browser.newPage();
        await page.goto(`https://jisho.org/search/${req.query.word}`);
        
        const resCount = await page.$eval('.result_count', e => e.innerHTML).catch(e => {
          console.log(e);
          return null
        });
        response.push(resCount);

        const mainMeaning = await page.$eval('.meaning-meaning', e => e.innerHTML).catch(e => {
          console.log(e);
          return null
        });

        response.push(await formatMeaning(mainMeaning));

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
          const element = await page.$eval('.trans.dtrans.dtrans-se', e => e.innerText).catch(e => {
            console.log(e, page.url());
            return null
          });
          translation.push(element);
        }
        response.push(translation);
        await browser.close();
        // Sending the Digimon names to Postman

        res.send(response);
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
  let format = phrase;

  if(phrase.includes('to ')){
    format = phrase.replace(/to /g, ' ');
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


