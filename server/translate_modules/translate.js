const {TranslationServiceClient} = require('@google-cloud/translate');
const projectId = 'djapones';
const location = 'global';
const path = require('./api-path');
const keyFilename = path.path;

// Instantiates a client
const translationClient = new TranslationServiceClient({projectId, keyFilename});

// Make a request es-en
const esToEn = async (text) => {
  // Construct request
  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [text],
    mimeType: 'text/plain', // mime types: text/plain, text/html
    sourceLanguageCode: 'es',
    targetLanguageCode: 'en',
  };

  try {
    // Run request
    const [response] = await translationClient.translateText(request);

    // for (const translation of response.translations) {
    //   console.log(`Translation: ${translation.translatedText}`);
    // }

    return response.translations[0].translatedText;

  } catch (error) {
    return `error: ${error}`;
  }
}

// Make a request en-es
const enToEs = async (text) => {
  // Construct request
  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [text],
    mimeType: 'text/plain', // mime types: text/plain, text/html
    sourceLanguageCode: 'en',
    targetLanguageCode: 'es',
  };

  try {
    // Run request
    const [response] = await translationClient.translateText(request);

    // for (const translation of response.translations) {
    //   console.log(`Translation: ${translation.translatedText}`);
    // }

    return response.translations[0].translatedText;

  } catch (error) {
    return `error 500: ${error}`;
  }
}

exports.enToEs = enToEs;
exports.esToEn = esToEn;
