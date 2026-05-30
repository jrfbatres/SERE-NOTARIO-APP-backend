const fs = require('fs');
const pdfParse = require('pdf-parse');

async function readSample() {
  console.log(Object.keys(pdfParse));
  const pdf = pdfParse.default || pdfParse;
  if (typeof pdf === 'function') {
      const dataBuffer = fs.readFileSync('C:\\Users\\jrfba\\OneDrive\\Desktop\\notario\\ley\\CODIGO FAMILIA\\codigoFamilia.pdf');
      const data = await pdf(dataBuffer);
      console.log(data.text.substring(0, 5000));
  } else {
      console.log("No function found.");
  }
}

readSample();
