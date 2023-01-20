const fetch = require('node-fetch');
const request = require('request');
const url = `https://apiml.joeper.myds.me/djapones?`;
const urlDev = `http://127.0.0.1:8662/translate?`;
const urlDev2 = `http://127.0.0.1:8662/translate`;

// Make a request es-en
const esToEn = async (text) => {
    const req = encodeURI(`${urlDev}q=${text}&tl=en&sl=es`);
    // console.log('going to fetch: ', req);
    let response = await fetch(req);
    let json = await response.json();
    return json.translations[0].result;
}

// Make a request en-es
const enToEs = async (text) => {
    let data = {
        q: text,
        tl: "es",
        sl: "en"
    };
    let response = await fetch(urlDev2, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    }).catch(err => {
        console.log(err);
    });
    let json = await response.json();
    return json.translations[0].result;
}

const enToEsPOST = async (text) => {
    var options = {
      'method': 'POST',
      'url': urlDev2,
      'headers': {
      },
      formData: {
        'q': text,
        'tl': 'es',
        'sl': 'en'
      }
    };
    let response = await request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body);
      return response.body;
    });
    //console.log(response);
    let json = await response.json();
    return json.translations[0].result;
}


exports.enToEs = enToEs;
exports.esToEn = esToEn;
exports.enToEsPOST = enToEsPOST;