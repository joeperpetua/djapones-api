const axios = require('axios');
const url = `https://apiml.joeper.myds.me/djapones`;

// Make a request es-en
const esToEn = async (text) => {
    try {
        const response = await axios.get(encodeURI(`${url}?q=${text}&tl=eng&sl=spa`));
        return response.data.translations[0].result;
    } catch (error) {
        console.error(error);
    }
}

// Make a request en-es
const enToEs = async (text, html) => {
    if (html){
        let data = new FormData();
        data.append('q', text);
        data.append('tl', 'spa');
        data.append('sl', 'eng');

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: url,
            data : data
        };

        try {
            const response = await axios.request(config);
            return response.data.translations[0].result;
        } catch (error) {
            console.error(error);
        }
        
    }else {
        try {
            const response = await axios.get(encodeURI(`${url}?q=${text}&tl=spa&sl=eng`));
            return response.data.translations[0].result;
        } catch (error) {
            console.error(error);
        }
    }
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