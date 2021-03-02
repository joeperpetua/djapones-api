const { response } = require('express');
const express = require('express'); // Adding Express
const app = express(); // Initializing Express
const fetch = require("node-fetch");

app.get('/', function(req, res) {
    const start = Date.now();
    let time;
    let response = [];

    fetchJisho(req.query.word).then(async text => {
        console.log('Get jisho -- ', Date.now() - start, 'ms');

        const resCount = await getCount(text);
        response.push(resCount);

        const mainMeaning = await getMainMeaning(text);
        response.push(await formatMeaning(mainMeaning));

        const mainKanji = await getKanji(text);
        response.push(mainKanji);

        console.log('Get data -- ', Date.now() - start, 'ms');

        const translation = [];
        for (let i = 0; i < response[1].length; i++) {
            const definition = response[1][i];
            const text = await fetchCambridge(definition);
            const iterationTranslation = await getTranslation(text);
            translation.push(iterationTranslation);
        }
        response.push(translation);

        console.log('Get all meaning translations -- ', Date.now() - start, 'ms');

    }).then(() => {
        res.send(response)
    })

    // responseArray.push();
          
    
});

const fetchJisho = async (request) => {
    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=jisho.org/search/${request}`);
    const text = await res.text();
    return text;
}

const fetchCambridge = async (request) => {
    const res = await fetch(`https://dictionary.cambridge.org/dictionary/english-spanish/${request}`);
    const text = await res.text();
    return text;
}

const getMainMeaning = async (text) => {
    let firstParam = '<span class=\"meaning-meaning\">';
    let lastParam = '</span>';
    let extract = text.split(firstParam)[1].split(lastParam)[0];
    return extract;
}

const getKanji = async (text) => {
    let firstParam = '<span class=\"text\">';
    let lastParam = '</span>';
    let extract = text.split(firstParam)[1].split(lastParam)[0];
    return extract;
}

const getCount = async (text) => {
    let firstParam = '<span class=\"result_count"\>';
    let lastParam = '</span>';
    let extract = text.split(firstParam)[1].split(lastParam)[0];
    return extract;
}

// const getMainKana = async (text) => {
//     let firstParam = '<span class=\"text"\>';
//     let lastParam = '</span>';
//     let extract = text.split(firstParam)[1].split(lastParam)[0] + text.split(firstParam)[1].split(lastParam)[1];
//     extract = extract.replace(/\<span\>/g, ' ')
//     return extract;
// }

const getTranslation = async (text) => {
    let firstParam = '<span class=\"trans dtrans dtrans-se \" lang=\"es\">';
    let lastParam = '</span>';
    let extract = text.split(firstParam)[1].split(lastParam)[0];
    return extract;
}

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

