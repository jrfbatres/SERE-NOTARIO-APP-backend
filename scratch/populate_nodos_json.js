const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

const tree = {
  "nombre": "Código de Familia (El Salvador)",
  "hijos": [
    {
      "nombre": "Título Preliminar",
      "hijos": [
        { "nombre": "Objeto", "detalle": "Régimen jurídico de familia, menores y tercera edad" },
        { "nombre": "Concepto de Familia", "detalle": "Matrimonio, unión no matrimonial y parentesco" },
        { "nombre": "Principios", "detalle": "Unidad, igualdad de derechos, protección integral" },
        { "nombre": "Derechos Irrenunciables y Deberes Indelegables" },
        { "nombre": "Integración y Aplicación con Tratados Internacionales" }
      ]
    },
    {
      "nombre": "El Matrimonio",
      "hijos": [
        {
          "nombre": "Constitución",
          "hijos": [
            { "nombre": "Entre igual hombre y mujer" },
            { "nombre": "Libre y mutuo consentimiento" },
            { "nombre": "Funcionarios autorizados" }
          ]
        },
        {
          "nombre": "Impedimentos",
          "hijos": [
            { "nombre": "Absolutos", "detalle": "Menores de 18 años, casados, falta de razón" },
            { "nombre": "Relativos", "detalle": "Parientes, adoptantes, homicidio de cónyuge" },
            { "nombre": "Reglas especiales", "detalle": "Tutela, nueva matrimonio de mujer" }
          ]
        },
        {
          "nombre": "Celebración",
          "hijos": [
            { "nombre": "Acta prenupcial y expediente" },
            { "nombre": "Testigos y solemnidad del acto" },
            { "nombre": "Matrimonio por poder" },
            { "nombre": "Matrimonio en artículo mortis" }
          ]
        },
        {
          "nombre": "Régimen Patrimonial",
          "hijos": [
            { "nombre": "Separación de Bienes" },
            { "nombre": "Participación en las Ganancias" },
            { "nombre": "Comunidad Diferida (Supletorio)" },
            { "nombre": "Capitulaciones Matrimoniales" },
            { "nombre": "Protección a la Vivienda Familiar" }
          ]
        },
        {
          "nombre": "Nulidad y Disolución",
          "hijos": [
            { "nombre": "Nulidad Absoluta", "detalle": "Falta de consentimiento, mismo sexo" },
            { "nombre": "Nulidad Relativa", "detalle": "Error, fuerza, falta de testigos" },
            { "nombre": "Disolución", "detalle": "Muerte o divorcio" },
            { "nombre": "Motivos de Divorcio", "detalle": "Mutuo consentimiento, separación, intolerancia" }
          ]
        }
      ]
    },
    {
      "nombre": "Unión No Matrimonial",
      "hijos": [
        { "nombre": "Convivencia estable de 3 o más años" },
        { "nombre": "Régimen de participación en ganancias" },
        { "nombre": "Derecho a suceder abintestato" },
        { "nombre": "Declaración judicial de existencia" }
      ]
    },
    {
      "nombre": "Parentesco",
      "hijos": [
        { "nombre": "Clases", "detalle": "Consanguinidad, afinidad, adopción" },
        { "nombre": "Líneas", "detalle": "Recta y colateral" },
        { "nombre": "Grado de proximidad" }
      ]
    },
    {
      "nombre": "Filiación",
      "hijos": [
        {
          "nombre": "Establecimiento",
          "hijos": [
            { "nombre": "Presunción", "detalle": "Ley, reconocimiento voluntario, judicial" },
            { "nombre": "Maternidad", "detalle": "Parto e identidad" },
            { "nombre": "Investigación de paternidad maternidad" }
          ]
        },
        {
          "nombre": "Impugnación",
          "hijos": [
            { "nombre": "Impugnación de paternidad por el marido e hijo" },
            { "nombre": "Impugnación de reconocimiento voluntario" },
            { "nombre": "Impugnación de maternidad", "detalle": "Falso parto y suplantación" }
          ]
        }
      ]
    },
    {
      "nombre": "Relaciones Paterno Filiales",
      "hijos": [
        {
          "nombre": "Derechos y Deberes de los Hijos",
          "hijos": [
            { "nombre": "Igualdad de hijos" },
            { "nombre": "Salud individual y base genética" },
            { "nombre": "Crianza, educación y protección" }
          ]
        },
        {
          "nombre": "Autoridad Parental",
          "hijos": [
            { "nombre": "Ejercicio conjunto por padre y madre" },
            { "nombre": "Cuidado personal y convivencia" },
            { "nombre": "Representación legal" },
            { "nombre": "Administración de bienes" },
            { "nombre": "Extinción, pérdida y suspensión" }
          ]
        }
      ]
    },
    {
      "nombre": "Asistencia Familiar y Tutela",
      "hijos": [
        {
          "nombre": "Los Alimentos",
          "hijos": [
            { "nombre": "Sujetos", "detalle": "Cónyuges, parientes, hermanos" },
            { "nombre": "Proporcionalidad y necesidad" },
            { "nombre": "Retención migratoria por impago" },
            { "nombre": "Protección y retención de salarios" }
          ]
        },
        {
          "nombre": "La Tutela",
          "hijos": [
            { "nombre": "Cargo a favor de menores o incapaces" },
            { "nombre": "Tipos", "detalle": "Testamentaria, legítima, dativa" },
            { "nombre": "Tutela de mayores incapacitados" },
            { "nombre": "Rendición de cuentas e inventario" }
          ]
        }
      ]
    },
    {
      "nombre": "Estado Familiar y Registro",
      "hijos": [
        { "nombre": "Calidad jurídica en relación a la familia" },
        { "nombre": "Registro del Estado Familiar", "detalle": "Municipal y Central" },
        { "nombre": "Pruebas", "detalle": "Certificaciones o pruebas" },
        { "nombre": "Posesión de estado familiar" }
      ]
    },
    {
      "nombre": "Derecho del Trabajo",
      "hijos": [
        { "nombre": "Protección integral y políticas públicas" },
        { "nombre": "Sistema Nacional de Protección a la Familia" },
        { "nombre": "Sistema Nacional de Protección al Menor" }
      ]
    }
  ]
};

// Map article ranges to top-level node names to help with article assignment
const nodeRanges = [
  { nombre: "Título Preliminar", min: 1, max: 10 },
  { nombre: "El Matrimonio", min: 11, max: 117 }, 
  { nombre: "Unión No Matrimonial", min: 118, max: 126 },
  { nombre: "Parentesco", min: 127, max: 132 },
  { nombre: "Filiación", min: 133, max: 185 },
  { nombre: "Estado Familiar y Registro", min: 186, max: 201 },
  { nombre: "Relaciones Paterno Filiales", min: 202, max: 246 },
  { nombre: "Asistencia Familiar y Tutela", min: 247, max: 343 },
  { nombre: "Derecho del Trabajo", min: 344, max: 404 } // Libro Quinto
];

function slugify(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').substring(0, 50);
}

async function insertNode(node, padre_id, nivel) {
  const id = 'ley3_' + slugify(node.nombre) + '_' + Math.floor(Math.random()*10000);
  await pool.query(`
    INSERT INTO "notarioElite".nodos (id, ley_id, padre_id, nombre, nivel, concepto, creado_en)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
  `, [id, 3, padre_id, node.nombre, nivel, node.detalle || '']);
  
  if (node.hijos && node.hijos.length > 0) {
    for (const hijo of node.hijos) {
      await insertNode(hijo, id, nivel + 1);
    }
  }
  
  return id;
}

// Global variable to store created nodes mapped to names
const createdNodes = {};

async function fetchCreatedNodes() {
  const res = await pool.query('SELECT id, nombre, nivel, padre_id FROM "notarioElite".nodos WHERE ley_id = 3');
  for (const row of res.rows) {
    createdNodes[row.nombre] = row;
  }
}

async function main() {
  try {
    console.log("Limpiando datos anteriores para ley_id = 3...");
    await pool.query('DELETE FROM "notarioElite".articulos WHERE ley_id = 3');
    await pool.query('DELETE FROM "notarioElite".nodos WHERE ley_id = 3');

    console.log("Insertando estructura jerárquica de nodos...");
    const rootId = 'ley3_root';
    await pool.query(`
      INSERT INTO "notarioElite".nodos (id, ley_id, padre_id, nombre, nivel, concepto, creado_en)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [rootId, 3, null, tree.nombre, 1, '']);

    for (const hijo of tree.hijos) {
      await insertNode(hijo, rootId, 2);
    }
    
    await fetchCreatedNodes();
    
    // Parse articles
    let content = fs.readFileSync('scratch/codigoFamilia.txt', 'utf8');
    const replacements = { '├ì': 'Í', '├│': 'ó', '├í': 'á', '├®': 'é', '├║': 'ú', '├▒': 'ñ', '├ô': 'Ó', '├ü': 'Á', '├Ü': 'Ú', '├¡': 'í', '├ë': 'É', '├æ': 'Ñ' };
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
        if (currentArticle) articles.push(currentArticle);
        let tema = '';
        for (let j = i - 1; j >= 0; j--) {
          const prevLine = lines[j];
          if (/^Art\./.test(prevLine)) break;
          if (!prevLine.startsWith('TÍTULO') && !prevLine.startsWith('CAPÍTULO') && !prevLine.startsWith('SECCIÓN') && /^[A-ZÁÉÍÓÚÑ\s]+$/.test(prevLine)) {
            tema = prevLine;
            break;
          }
        }
        currentArticle = { numero: artMatch[1], tema: tema || 'Sin tema', contenido: artMatch[2].trim() };
      } else if (currentArticle) {
        if (!line.startsWith('TÍTULO') && !line.startsWith('CAPÍTULO') && !line.startsWith('SECCIÓN') && !/^[A-ZÁÉÍÓÚÑ\s]+$/.test(line)) {
            currentArticle.contenido += ' ' + line;
        }
      }
    }
    if (currentArticle) articles.push(currentArticle);
    
    const res = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM "notarioElite".articulos');
    let nextId = parseInt(res.rows[0].next_id);
    
    let inserted = 0;
    for (const art of articles) {
      const num = parseInt(art.numero);
      
      // Determine the best node
      let nodeName = "Código de Familia (El Salvador)"; // fallback
      for (const range of nodeRanges) {
        if (num >= range.min && num <= range.max) {
          nodeName = range.nombre;
          break;
        }
      }
      
      // Try to find the deepest node that matches the range (i.e. the L2 node)
      const targetNode = createdNodes[nodeName] || createdNodes["Código de Familia (El Salvador)"];
      
      // But wait! Is it better to just attach to the L2 node? Yes, if there are leaf nodes, they are more like study topics, not direct article matches since we don't have exact mapping for all 402 articles to the specific sub-sub topics.
      // E.g., attaching all Art 11-117 to "El Matrimonio" node.
      const nodoId = targetNode.id;
      
      await pool.query(`
        INSERT INTO "notarioElite".articulos 
        (id, ley_id, nodo_id, numero, tema, contenido, creado_en)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [nextId++, 3, nodoId, art.numero, art.tema, art.contenido]);
      inserted++;
    }
    
    console.log(`Successfully recreated JSON tree and inserted ${inserted} articulos.`);
    
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

main();
