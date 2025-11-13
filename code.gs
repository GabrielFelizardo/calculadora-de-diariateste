/****************************************************************
 * CONFIGURAÇÃO
 ****************************************************************/

// Busca configurações das Properties (mais seguro)
const SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID')

const SECRET_API_KEY = PropertiesService.getScriptProperties().getProperty('SECRET_API_KEY')

/****************************************************************
 * FUNÇÃO GET - LÊ TODOS OS DADOS DA PLANILHA
 ****************************************************************/
function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    
    const nacionalSheet = spreadsheet.getSheetByName('Nacional');
    const nacionalData = nacionalSheet.getDataRange().getValues();
    nacionalData.shift();
    const nacionalJson = {};
    nacionalData.forEach(row => {
      const [categoria, grupo, alimentacao, pousada] = row;
      if (!nacionalJson[categoria]) nacionalJson[categoria] = {};
      nacionalJson[categoria][grupo] = { alimentacao: parseFloat(alimentacao), pousada: parseFloat(pousada) };
    });

    const internacionalSheet = spreadsheet.getSheetByName('Internacional');
    const internacionalData = internacionalSheet.getDataRange().getValues();
    internacionalData.shift();
    const internacionalJson = {};
    internacionalData.forEach(row => {
      const [grupoPais, grupo, diaria] = row;
      if (!internacionalJson[grupoPais]) internacionalJson[grupoPais] = {};
      internacionalJson[grupoPais][grupo] = { diaria: parseFloat(diaria) };
    });

    const configSheet = spreadsheet.getSheetByName('Config');
    const configData = configSheet.getDataRange().getValues();
    configData.shift();
    const configJson = {};
    configData.forEach(row => {
        const [chave, valor] = row;
        configJson[chave] = parseFloat(valor);
    });

    const finalJson = {
        nacional: nacionalJson,
        internacional: internacionalJson,
        config: configJson
    };
    return ContentService.createTextOutput(JSON.stringify(finalJson)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

/****************************************************************
 * FUNÇÃO POST - ATUALIZA DADOS NA PLANILHA
 ****************************************************************/
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    if (params.apiKey !== SECRET_API_KEY) {
      throw new Error("API Key inválida.");
    }
    const sheetName = params.sheet;
    const novosValores = params.valores;
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(sheetName);
    const range = sheet.getDataRange();
    const data = range.getValues();
    
    if (sheetName === 'Config') {
        for (let i = 1; i < data.length; i++) {
            const chave = data[i][0];
            if (novosValores[chave] !== undefined) {
                data[i][1] = novosValores[chave];
            }
        }
    } else if (sheetName === 'Nacional') {
      for (let i = 1; i < data.length; i++) {
        const [categoria, grupo] = data[i];
        if (novosValores[categoria] && novosValores[categoria][grupo]) {
          data[i][2] = novosValores[categoria][grupo].alimentacao;
          data[i][3] = novosValores[categoria][grupo].pousada;
        }
      }
    } else { // Internacional
      for (let i = 1; i < data.length; i++) {
        const [grupoPais, grupo] = data[i];
        if (novosValores[grupoPais] && novosValores[grupoPais][grupo]) {
          data[i][2] = novosValores[grupoPais][grupo].diaria;
        }
      }
    }
    range.setValues(data);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}
