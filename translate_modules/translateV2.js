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

exports.enToEs = enToEs;
exports.esToEn = esToEn;
