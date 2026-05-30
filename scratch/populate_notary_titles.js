const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:admin@72.61.9.7:1521/batres'
});

const titles = {
  "1": "Objeto de la Ley y Definición del Notariado",
  "2": "Clasificación de los Instrumentos Notariales",
  "3": "Ámbito Territorial y Temporal del Ejercicio Notarial",
  "4": "Requisitos para Obtener la Autorización de Notario",
  "5": "Funcionarios Diplomáticos y Jueces Autorizados para Ejercer el Notariado",
  "6": "Causas de Incapacidad para el Ejercicio del Notariado",
  "7": "Causas de Inhabilitación para el Ejercicio del Notariado",
  "8": "Causas de Suspensión en el Ejercicio del Notariado",
  "9": "Prohibiciones Especiales para los Notarios",
  "10": "Nómina Permanente de Notarios Autorizados",
  "11": "Procedimiento de Incapacidad, Inhabilitación o Suspensión de Notarios",
  "12": "Devolución de Protocolo y Sello por Suspensión o Inhabilitación",
  "13": "Procedimiento de Rehabilitación de Notarios",
  "14": "Nómina Anual de Notarios con Modificaciones",
  "15": "Efectos de la Omisión del Nombre en la Nómina Anual",
  "16": "Definición y Contenido del Protocolo",
  "17": "Formación y Legalización de los Libros de Protocolo",
  "18": "Vigencia y Renovación del Libro de Protocolo",
  "19": "Registro de Entrega de Hojas y Libros de Protocolo",
  "20": "Hojas de Protocolo Adicionales para Terminar Instrumentos",
  "21": "Cierre e Índice del Libro de Protocolo",
  "22": "Devolución Temporal del Protocolo al Notario",
  "23": "Obligación de Entrega del Protocolo Vencido o Agotado",
  "24": "Legajo de Anexos del Protocolo",
  "25": "Sanción por Incumplimiento en la Entrega de Libros de Protocolo",
  "26": "Control y Revisión de la Obligación de Entrega de Protocolos",
  "27": "Revisión y Remisión de Libros Vencidos a la Corte",
  "28": "Exhibición del Protocolo e Inspecciones Ordenadas por la Corte",
  "29": "Ausencia del Notario del País y Entrega del Protocolo",
  "30": "Custodia y Entrega de Protocolo y Sello de Notario Fallecido",
  "31": "Competencia Judicial en Materia Notarial y Protocolo de Jueces Civiles",
  "32": "Requisitos de Forma y Contenido de la Escritura Matriz",
  "33": "Validez de la Escritura Matriz por Omisión de Requisitos",
  "34": "Reglas sobre Testigos Instrumentales",
  "35": "Justificación y Calificación de la Personería",
  "36": "Advertencia de Vicios o Defectos en Documentos de Base",
  "37": "Prohibición de Otorgar Instrumentos ante Incapacidad o Ausencia de Partes",
  "38": "Reglas de Escritura, Numeración y Suspensión en el Protocolo",
  "39": "Advertencia sobre Solvencia de Impuestos",
  "40": "Modificaciones al Otorgamiento de Testamentos Solemnes",
  "41": "Otorgamiento y Custodia de Testamentos Cerrados",
  "42": "Apertura Judicial y Uso de Testamentos Cerrados en Secretaría",
  "43": "Expedición de Testimonios y su Anotación Marginal",
  "44": "Requisitos y Formatos de los Testimonios",
  "45": "Expedición de Testimonios por la Secretaría de la Corte",
  "46": "Remisión de Testimonios en Papel Común a la Sección del Notariado",
  "47": "Testimonio y Registro Especial de Testamentos Nuncupativos",
  "48": "Traslado de Testimonios en Caso de Pérdida o Destrucción de Protocolo",
  "49": "Registro de Firma, Sello Notarial y Copias Simples",
  "50": "Elaboración y Valor Legal de las Actas Notariales",
  "51": "Formalidades y Requisitos de las Actas Notariales",
  "52": "Reconocimiento de Documentos Privados y Fuerza Ejecutiva",
  "53": "Copias de Actas Notariales y su Remisión Anual",
  "54": "Legalización de Firmas o Auténticas y sus Prohibiciones",
  "55": "Protocolización de Documentos e Instrumentos Públicos o Privados",
  "56": "Formalidades para la Protocolización de Documentos",
  "57": "Invalidez de Testimonios y Actas por Omisión de Formalidades",
  "58": "Reposición de Libros de Protocolo Destruidos o Perdidos",
  "59": "Sanción por Infracciones en el Ejercicio de la Función Notarial",
  "60": "Procedimiento para Imposición de Sanciones a Notarios",
  "61": "Responsabilidad Civil y Penal del Notario",
  "62": "Nulidad de Instrumentos Públicos por Incompetencia o Falta de Formalidades",
  "63": "Custodia del Archivo de Protocolos y Expedición de Testimonios Viejos",
  "64": "Dirección y Organización de la Sección del Notariado",
  "65": "Arancel de Derechos Notariales",
  "66": "Derechos Notariales por Actos del Estado y Municipios",
  "67": "Exención de Pago de Arancel",
  "68": "Exclusividad de la Tarifa de Aranceles",
  "69": "Prohibición de Cobro de Aranceles Adicionales",
  "70": "Modificaciones y Actualización del Arancel Notarial",
  "71": "Disposiciones Generales del Otorgamiento de Instrumentos",
  "72": "Validez de Documentos Extranjeros",
  "73": "Traducción y Autenticación de Documentos en Idioma Extranjero",
  "74": "Trámite de Diligencias de Jurisdicción Voluntaria",
  "75": "Reglas de Notificación y Citaciones en Diligencias Notariales",
  "76": "Conservación de Diligencias de Jurisdicción Voluntaria",
  "77": "Protocolización de Resoluciones en Jurisdicción Voluntaria",
  "78": "Entrega de Diligencias Originales a los Interesados",
  "79": "Responsabilidad por Errores en Jurisdicción Voluntaria",
  "80": "Inspección de Oficinas Notariales por la Corte Suprema",
  "81": "Régimen de Fianza y Garantía Notarial",
  "82": "Aplicación Supletoria de Normas Procesales y de Derecho Común",
  "83": "Derogatorias de Leyes Anteriores y Vigencia",
  "84": "Disposiciones Transitorias sobre Libros en Curso",
  "85": "Fecha de Vigencia de la Ley de Notariado"
};

async function main() {
  try {
    console.log("Starting database updates for Ley de Notariado (ley_id = 9)...");
    
    // We will update each article where it belongs to a node of ley_id = 9
    for (const [numero, tema] of Object.entries(titles)) {
      const updateQuery = `
        UPDATE "notarioElite".articulos a
        SET tema = $1
        FROM "notarioElite".nodos n
        WHERE a.nodo_id = n.id AND n.ley_id = 9 AND a.numero = $2;
      `;
      const result = await pool.query(updateQuery, [tema, numero]);
      console.log(`Updated Artículo ${numero}: ${tema} (${result.rowCount} rows affected)`);
    }

    console.log("All updates completed successfully.");
  } catch (err) {
    console.error("Error during updates:", err);
  } finally {
    await pool.end();
  }
}

main();
