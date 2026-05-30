const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres' });

const leyJson = {
  "nombre": "Código de Familia (El Salvador)",
  "hijos": [
    {
      "nombre": "Título Preliminar",
      "hijos": [
        {
          "nombre": "Objeto",
          "detalle": "Régimen jurídico de familia, menores y tercera edad"
        },
        {
          "nombre": "Concepto de Familia",
          "detalle": "Matrimonio, unión no matrimonial y parentesco"
        },
        {
          "nombre": "Principios",
          "detalle": "Unidad, igualdad de derechos, protección integral"
        },
        {
          "nombre": "Derechos Irrenunciables y Deberes Indelegables"
        },
        {
          "nombre": "Integración y Aplicación con Tratados Internacionales"
        }
      ]
    },
    {
      "nombre": "El Matrimonio",
      "hijos": [
        {
          "nombre": "Constitución",
          "hijos": [
            {
              "nombre": "Entre igual hombre y mujer"
            },
            {
              "nombre": "Libre y mutuo consentimiento"
            },
            {
              "nombre": "Funcionarios autorizados"
            }
          ]
        },
        {
          "nombre": "Impedimentos",
          "hijos": [
            {
              "nombre": "Absolutos",
              "detalle": "Menores de 18 años, casados, falta de razón"
            },
            {
              "nombre": "Relativos",
              "detalle": "Parientes, adoptantes, homicidio de cónyuge"
            },
            {
              "nombre": "Reglas especiales",
              "detalle": "Tutela, nueva matrimonio de mujer"
            }
          ]
        },
        {
          "nombre": "Celebración",
          "hijos": [
            {
              "nombre": "Acta prenupcial y expediente"
            },
            {
              "nombre": "Testigos y solemnidad del acto"
            },
            {
              "nombre": "Matrimonio por poder"
            },
            {
              "nombre": "Matrimonio en artículo mortis"
            }
          ]
        },
        {
          "nombre": "Régimen Patrimonial",
          "hijos": [
            {
              "nombre": "Separación de Bienes"
            },
            {
              "nombre": "Participación en las Ganancias"
            },
            {
              "nombre": "Comunidad Diferida (Supletorio)"
            },
            {
              "nombre": "Capitulaciones Matrimoniales"
            },
            {
              "nombre": "Protección a la Vivienda Familiar"
            }
          ]
        },
        {
          "nombre": "Nulidad y Disolución",
          "hijos": [
            {
              "nombre": "Nulidad Absoluta",
              "detalle": "Falta de consentimiento, mismo sexo"
            },
            {
              "nombre": "Nulidad Relativa",
              "detalle": "Error, fuerza, falta de testigos"
            },
            {
              "nombre": "Disolución",
              "detalle": "Muerte o divorcio"
            },
            {
              "nombre": "Motivos de Divorcio",
              "detalle": "Mutuo consentimiento, separación, intolerancia"
            }
          ]
        }
      ]
    },
    {
      "nombre": "Unión No Matrimonial",
      "hijos": [
        {
          "nombre": "Convivencia estable de 3 o más años"
        },
        {
          "nombre": "Régimen de participación en ganancias"
        },
        {
          "nombre": "Derecho a suceder abintestato"
        },
        {
          "nombre": "Declaración judicial de existencia"
        }
      ]
    },
    {
      "nombre": "Parentesco",
      "hijos": [
        {
          "nombre": "Clases",
          "detalle": "Consanguinidad, afinidad, adopción"
        },
        {
          "nombre": "Líneas",
          "detalle": "Recta y colateral"
        },
        {
          "nombre": "Grado de proximidad"
        }
      ]
    },
    {
      "nombre": "Filiación",
      "hijos": [
        {
          "nombre": "Establecimiento",
          "hijos": [
            {
              "nombre": "Presunción",
              "detalle": "Ley, reconocimiento voluntario, judicial"
            },
            {
              "nombre": "Maternidad",
              "detalle": "Parto e identidad"
            },
            {
              "nombre": "Investigación de paternidad maternidad"
            }
          ]
        },
        {
          "nombre": "Impugnación",
          "hijos": [
            {
              "nombre": "Impugnación de paternidad por el marido e hijo"
            },
            {
              "nombre": "Impugnación de reconocimiento voluntario"
            },
            {
              "nombre": "Impugnación de maternidad",
              "detalle": "Falso parto y suplantación"
            }
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
            {
              "nombre": "Igualdad de hijos"
            },
            {
              "nombre": "Salud individual y base genética"
            },
            {
              "nombre": "Crianza, educación y protección"
            }
          ]
        },
        {
          "nombre": "Autoridad Parental",
          "hijos": [
            {
              "nombre": "Ejercicio conjunto por padre y madre"
            },
            {
              "nombre": "Cuidado personal y convivencia"
            },
            {
              "nombre": "Representación legal"
            },
            {
              "nombre": "Administración de bienes"
            },
            {
              "nombre": "Extinción, pérdida y suspensión"
            }
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
            {
              "nombre": "Sujetos",
              "detalle": "Cónyuges, parientes, hermanos"
            },
            {
              "nombre": "Proporcionalidad y necesidad"
            },
            {
              "nombre": "Retención migratoria por impago"
            },
            {
              "nombre": "Protección y retención de salarios"
            }
          ]
        },
        {
          "nombre": "La Tutela",
          "hijos": [
            {
              "nombre": "Cargo a favor de menores o incapaces"
            },
            {
              "nombre": "Tipos",
              "detalle": "Testamentaria, legítima, dativa"
            },
            {
              "nombre": "Tutela de mayores incapacitados"
            },
            {
              "nombre": "Rendición de cuentas e inventario"
            }
          ]
        }
      ]
    },
    {
      "nombre": "Estado Familiar y Registro",
      "hijos": [
        {
          "nombre": "Calidad jurídica en relación a la familia"
        },
        {
          "nombre": "Registro del Estado Familiar",
          "detalle": "Municipal y Central"
        },
        {
          "nombre": "Pruebas",
          "detalle": "Certificaciones o pruebas"
        },
        {
          "nombre": "Posesión de estado familiar"
        }
      ]
    },
    {
      "nombre": "Derecho del Trabajo",
      "hijos": [
        {
          "nombre": "Protección integral y políticas públicas"
        },
        {
          "nombre": "Sistema Nacional de Protección a la Familia"
        },
        {
          "nombre": "Sistema Nacional de Protección al Menor"
        }
      ]
    }
  ]
};

function normalizeString(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function generateId(leyId, nombre) {
  const norm = normalizeString(nombre).substring(0, 50);
  const rand = Math.floor(Math.random() * 10000);
  return "ley" + leyId + "_" + norm + "_" + rand;
}

let totalNodes = 0;
const nodesToInsert = [];

function traverse(node, nivel, padreId) {
  totalNodes++;
  const id = generateId(3, node.nombre);
  
  nodesToInsert.push({
    id,
    nombre: node.nombre,
    nivel,
    ley_id: 3,
    padre_id: padreId,
    concepto: node.detalle || null
  });
  
  if (node.hijos && node.hijos.length > 0) {
    for (const hijo of node.hijos) {
      traverse(hijo, nivel + 1, id);
    }
  }
}

async function run() {
  traverse(leyJson, 1, null);
  console.log('Total de nodos contados en el JSON:', totalNodes);
  
  try {
    let inserted = 0;
    for (const n of nodesToInsert) {
      await pool.query(
        'INSERT INTO "notarioElite".nodos (id, nombre, nivel, ley_id, padre_id, concepto) VALUES ($1, $2, $3, $4, $5, $6)',
        [n.id, n.nombre, n.nivel, n.ley_id, n.padre_id, n.concepto]
      );
      inserted++;
    }
    console.log('Se insertaron exitosamente', inserted, 'nodos en la base de datos.');
  } catch (err) {
    console.error('Error insertando:', err);
  } finally {
    pool.end();
  }
}

run();
