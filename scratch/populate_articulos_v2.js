const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

const nodos = [
  { id: 'ley3_nodo_1', nombre: 'Título Preliminar: Objeto, Concepto de Familia y Principios Rectores', min: 1, max: 10, concepto: 'Comprende desde el Art. 1 hasta el Art. 10.' },
  { id: 'ley3_nodo_2', nombre: 'Libro Primero - Título I: El Matrimonio', min: 11, max: 35, concepto: 'Abarca desde el Art. 11 hasta el Art. 35.' },
  { id: 'ley3_nodo_3', nombre: 'Libro Primero - Título II: Relaciones Personales y Patrimoniales entre los Cónyuges', min: 36, max: 89, concepto: 'Desde el Art. 36 hasta el Art. 89.' },
  { id: 'ley3_nodo_4', nombre: 'Libro Primero - Título III: Nulidad y Disolución del Matrimonio', min: 90, max: 117, concepto: 'Desde el Art. 90 hasta el Art. 117.' },
  { id: 'ley3_nodo_5', nombre: 'Libro Primero - Título IV: La Unión No Matrimonial', min: 118, max: 126, concepto: 'Desde el Art. 118 hasta el Art. 126.' },
  { id: 'ley3_nodo_6', nombre: 'Libro Primero - Título V: El Parentesco', min: 127, max: 132, concepto: 'Desde el Art. 127 hasta el Art. 132.' },
  { id: 'ley3_nodo_7', nombre: 'Libro Segundo - Título I: Filiación', min: 133, max: 185, concepto: 'Comprende desde el Art. 133 hasta el Art. 185.' },
  { id: 'ley3_nodo_8', nombre: 'Libro Segundo - Título II: Estado Familiar y su Registro', min: 186, max: 201, concepto: 'Desde el Art. 186 hasta el Art. 201.' },
  { id: 'ley3_nodo_9', nombre: 'Libro Tercero - Título I: Derechos y Deberes de los Hijos', min: 202, max: 205, concepto: 'Desde el Art. 202 hasta el Art. 205.' },
  { id: 'ley3_nodo_10', nombre: 'Libro Tercero - Título II: De la Autoridad Parental', min: 206, max: 246, concepto: 'Desde el Art. 206 hasta el Art. 246.' },
  { id: 'ley3_nodo_11', nombre: 'Libro Cuarto - Título I: Los Alimentos', min: 247, max: 271, concepto: 'Abarca desde el Art. 247 hasta el Art. 271.' },
  { id: 'ley3_nodo_12', nombre: 'Libro Cuarto - Título II: La Tutela', min: 272, max: 343, concepto: 'Desde el Art. 272 hasta el Art. 343.' },
  { id: 'ley3_nodo_13', nombre: 'Libro Quinto - Título I: Los Menores', min: 344, max: 388, concepto: 'Abarcaba desde el Art. 344 hasta el Art. 388.' },
  { id: 'ley3_nodo_14', nombre: 'Libro Quinto - Título II: Las Personas de la Tercera Edad', min: 389, max: 396, concepto: 'Abarcaba desde el Art. 389 hasta el Art. 396.' },
  { id: 'ley3_nodo_15', nombre: 'Libro Quinto - Título III: Deberes del Estado, Sistema Nacional de Protección', min: 397, max: 401, concepto: 'Comprende desde el Art. 397 hasta el Art. 401.' },
  { id: 'ley3_nodo_16', nombre: 'Libro Quinto - Título IV: Disposiciones Transitorias, Derogatoria y Vigencia', min: 402, max: 404, concepto: 'Desde el Art. 402 hasta el Art. 404.' }
];

function getNodoId(numero) {
  const num = parseInt(numero);
  for (const nodo of nodos) {
    if (num >= nodo.min && num <= nodo.max) {
      return nodo.id;
    }
  }
  return 'ley3_nodo_16'; // default
}

async function main() {
  try {
    console.log("Limpiando datos anteriores para ley_id = 3...");
    await pool.query('DELETE FROM "notarioElite".articulos WHERE ley_id = 3');
    await pool.query('DELETE FROM "notarioElite".nodos WHERE ley_id = 3');

    console.log("Insertando nodos estructurales...");
    for (const nodo of nodos) {
      await pool.query(`
        INSERT INTO "notarioElite".nodos (id, ley_id, nombre, concepto, creado_en)
        VALUES ($1, $2, $3, $4, NOW())
      `, [nodo.id, 3, nodo.nombre, nodo.concepto]);
    }
    
    let content = fs.readFileSync('scratch/codigoFamilia.txt', 'utf8');
    
    // Fix encoding issues
    const replacements = {
      '├ì': 'Í', '├│': 'ó', '├í': 'á', '├®': 'é', '├║': 'ú',
      '├▒': 'ñ', '├ô': 'Ó', '├ü': 'Á', '├Ü': 'Ú', '├¡': 'í',
      '├ë': 'É', '├æ': 'Ñ'
    };
    for (const [bad, good] of Object.entries(replacements)) {
      content = content.split(bad).join(good);
    }
    content = content.replace(/-- \d+ of \d+ --/g, '');
    content = content.replace(/ASAMBLEA LEGISLATIVA - REPÚBLICA DE EL SALVADOR/g, '');
    content = content.replace(/_{10,}/g, '');
    content = content.replace(/ÍNDICE LEGISLATIVO/g, '');
    
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const articles = [];
    let currentArticle = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const artMatch = line.match(/^Art\. (\d+)\.-(.*)/);
      
      if (artMatch) {
        if (currentArticle) {
          articles.push(currentArticle);
        }
        
        let tema = '';
        for (let j = i - 1; j >= 0; j--) {
          const prevLine = lines[j];
          if (/^Art\./.test(prevLine)) break;
          if (!prevLine.startsWith('TÍTULO') && !prevLine.startsWith('CAPÍTULO') && !prevLine.startsWith('SECCIÓN') && /^[A-ZÁÉÍÓÚÑ\s]+$/.test(prevLine)) {
            tema = prevLine;
            break;
          }
        }
        
        currentArticle = {
          numero: artMatch[1],
          tema: tema || 'Sin tema',
          contenido: artMatch[2].trim()
        };
      } else if (currentArticle) {
        if (!line.startsWith('TÍTULO') && !line.startsWith('CAPÍTULO') && !line.startsWith('SECCIÓN') && !/^[A-ZÁÉÍÓÚÑ\s]+$/.test(line)) {
            currentArticle.contenido += ' ' + line;
        }
      }
    }
    
    if (currentArticle) {
      articles.push(currentArticle);
    }
    
    const res = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM "notarioElite".articulos');
    let nextId = parseInt(res.rows[0].next_id);
    
    let inserted = 0;
    for (const art of articles) {
      const nodoId = getNodoId(art.numero);
      
      await pool.query(`
        INSERT INTO "notarioElite".articulos 
        (id, ley_id, nodo_id, numero, tema, contenido, creado_en)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [nextId++, 3, nodoId, art.numero, art.tema, art.contenido]);
      inserted++;
    }
    
    console.log(`Successfully inserted ${nodos.length} nodos y ${inserted} articulos.`);
    
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

main();
