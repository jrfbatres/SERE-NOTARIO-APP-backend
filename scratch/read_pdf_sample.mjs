import fs from 'fs';
import pdf from 'pdf-parse';

async function readSample() {
  const dataBuffer = fs.readFileSync('C:\\Users\\jrfba\\OneDrive\\Desktop\\notario\\ley\\CODIGO FAMILIA\\codigoFamilia.pdf');
  try {
      const data = await pdf(dataBuffer);
      console.log(data.text.substring(0, 5000));
  } catch (err) {
      console.error(err);
  }
}

readSample();
