const fetch = require('node-fetch');
const url = `https://apiml.joeper.myds.me/translate?`;

// Make a request es-en
const esToEn = async (text) => {
    const req = encodeURI(`${url}q=${text}&tl=en&sl=es`);
    // console.log('going to fetch: ', req);
    let response = await fetch(req);
    let json = await response.json();
    return json.translations[0].result;
}

// Make a request en-es
const enToEs = async (text) => {
    const req = encodeURI(`${url}q=${text}&tl=es&sl=en`);
    // console.log('going to fetch: ', req);
    let response = await fetch(req);
    let json = await response.json();
    return json.translations[0].result;
}

exports.enToEs = enToEs;
exports.esToEn = esToEn;
