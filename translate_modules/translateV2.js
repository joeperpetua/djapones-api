const fetch = require('node-fetch');
const url = `https://apiml.joeper.myds.me/translate?`;

// Make a request es-en
const esToEn = async (text) => {
    const req = encodeURI(`${url}q=${text}&tl=en`);

    let response = await fetch(req);
    let json = response.json();
    return json.translations[0].result;
}

// Make a request en-es
const enToEs = async (text) => {
    const req = encodeURI(`${url}q=${text}&tl=es`);

    let response = await fetch(req);
    let json = await response.json();
    return json.translations[0].result;
}

exports.enToEs = enToEs;
exports.esToEn = esToEn;
