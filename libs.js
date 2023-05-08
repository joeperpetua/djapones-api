const utils = require('./translate_modules/utils');
const translateV2 = require('./translate_modules/translateV2');

const manageLangDetection = async (lowerCaseKeyword) => {
    let translatedKeyword;

    // detect lang
    let detectedLang;
    if (utils.isSpanish(lowerCaseKeyword)) {
        detectedLang = 'es';
        console.log('detected as es');
    }else if(lowerCaseKeyword.includes(' ')){
        detectedLang = 'es';
        console.log('has space, send to translation as ES');
    }else{
        detectedLang = 'jp';
        console.log('detected as jp');
    }

    // manage keyword format depending on the source lang
    
    if (detectedLang === 'es') {
        translatedKeyword = await translateV2.esToEn(lowerCaseKeyword).catch(e => {
            throw new Error(`Error en el manejo de la búsqueda para: ${lowerCaseKeyword} - ${e}`);
        });

        // make lowercase
        translatedKeyword = translatedKeyword.toLocaleLowerCase();
    }

    if (detectedLang === 'jp') {
        translatedKeyword = lowerCaseKeyword;
    }
    
    
    // if has japanese (ex. romaji false positive es -> transl made it kana), then remove spaces
    if (utils.checkForJapaneseInString(translatedKeyword, utils.isKanji) || utils.checkForJapaneseInString(translatedKeyword, utils.isKana)) {
        translatedKeyword = translatedKeyword.replace(/ /g, '');
    }

    return translatedKeyword;
}


exports.manageLangDetection = manageLangDetection;