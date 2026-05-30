const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

async function main() {
  try {
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
    let currentTema = '';
    
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
      const nodoId = `ley3_art${art.numero}`;
      
      // Upsert node
      await pool.query(`
        INSERT INTO "notarioElite".nodos (id, ley_id, nombre, concepto, creado_en)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (id) DO NOTHING
      `, [nodoId, 3, art.tema, art.contenido.substring(0, 50)]);
      
      await pool.query(`
        INSERT INTO "notarioElite".articulos 
        (id, ley_id, nodo_id, numero, tema, contenido, creado_en)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [nextId++, 3, nodoId, art.numero, art.tema, art.contenido]);
      inserted++;
    }
    
    console.log(`Successfully inserted ${inserted} articles.`);
    
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

main();
