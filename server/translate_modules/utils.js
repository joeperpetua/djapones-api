const conjugator = require('./conjugator');
const wanakana = require('wanakana');

const isConjugation = async (keyword, src) => {
    // convert to hiragana if it is romaji
    if (!checkForJapaneseInString(keyword, isKanji) && !checkForJapaneseInString(keyword, isKana) && src === 'jp') {
        keyword = wanakana.toHiragana(keyword);
    }

    let response = conjugator.unconjugate(keyword);

    if (response[0]){
        if (response[0][0][0]) {
            response = response[0][0][0];
        }else if (response[0][0]) {
            response = response[0][0];
        }else{
            response = response[0];
        }
    }else{
        response = false;
    }

    // console.log(response);

    return response;

}

const checkForJapaneseInString = (str, callback) => {
    let has = false;
    for (let char = 0; char < str.length; char++) {
        if (callback(str[char])) {
            has = true;
        }
    }
    return has;
}

const isKanji = (ch) => {
    return (ch >= "\u4e00" && ch <= "\u9faf") || (ch >= "\u3400" && ch <= "\u4dbf");
}

const isKana = (ch) => {
    return (ch >= "\u3040" && ch <= "\u309f") || (ch >= "\u30a0" && ch <= "\u30ff");
}

const removeDuplicates = async (str) => {
    let uniqueList = str.split('; ').filter(function(allItems,i,a){
      return i == a.indexOf(allItems);
    }).join('; ');
    return uniqueList;
}

exports.isConjugation = isConjugation;
exports.isKanji = isKanji;
exports.isKana = isKana;
exports.removeDuplicates = removeDuplicates;
exports.wanakana = wanakana;