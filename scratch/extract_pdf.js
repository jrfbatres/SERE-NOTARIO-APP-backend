const fs = require('fs');
const pdfParse = require('pdf-parse');

async function extractPdf() {
  const dataBuffer = fs.readFileSync('C:\\Users\\jrfba\\OneDrive\\Desktop\\notario\\ley\\CODIGO FAMILIA\\codigoFamilia.pdf');
  
  try {
    const parser = new pdfParse.PDFParse();
    await parser.load(dataBuffer);
    const text = await parser.getText();
    
    fs.writeFileSync('scratch/codigoFamilia_raw.txt', text);
    console.log('PDF extracted successfully. Size:', text.length, 'characters.');
    console.log('First 500 characters:');
    console.log(text.substring(0, 500));
  } catch (err) {
    console.error('Error parsing PDF:', err);
  }
}

extractPdf();
