import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rootId = searchParams.get('root');

    const userId = getUserIdFromRequest(request);

    let text;
    let params = [];

    if (userId) {
      // Fetch nodes with user progress joined
      text = `
        SELECT 
          n.id, 
          n.nombre, 
          n.padre_id, 
          n.nivel, 
          n.total_preguntas, 
          n.porcentaje_preguntas,
          n.ley_id,
          un.nota as usuario_nota,
          un.completado as usuario_completado
        FROM "notarioElite".nodos n
        LEFT JOIN "notarioElite".usuario_nodos un 
          ON un.nodo_id = n.id AND un.usuario_id = $1
        ORDER BY n.id ASC
      `;
      params.push(userId);
    } else {
      // Fallback if not authenticated
      text = `
        SELECT 
          id, 
          nombre, 
          padre_id, 
          nivel, 
          total_preguntas, 
          porcentaje_preguntas,
          ley_id
        FROM "notarioElite".nodos
        ORDER BY id ASC
      `;
    }

    const result = await query(text, params);
    const nodes = result.rows;

    // Determine the ley_id to initialize
    let leyIdToInit = null;
    if (rootId) {
      const rootNode = nodes.find(n => n.id === rootId);
      if (rootNode) {
        leyIdToInit = rootNode.ley_id;
      } else {
        const parsed = parseInt(rootId);
        if (!isNaN(parsed)) {
          leyIdToInit = parsed;
        }
      }
    }

    // Initialize progress in usuario_nodos and usuario_leyes if user is logged in and we have a leyId
    if (userId && leyIdToInit) {
      // Init law record
      await query(`
        INSERT INTO "notarioElite".usuario_leyes (usuario_id, ley_id, nota)
        VALUES ($1::uuid, $2, NULL)
        ON CONFLICT (usuario_id, ley_id) DO NOTHING
      `, [userId, leyIdToInit]);

      // Init node records
      await query(`
        INSERT INTO "notarioElite".usuario_nodos (usuario_id, nodo_id, ley_id, completado)
        SELECT $1::uuid, id, ley_id, FALSE
        FROM "notarioElite".nodos
        WHERE ley_id = $2
        ON CONFLICT (usuario_id, nodo_id) DO NOTHING
      `, [userId, leyIdToInit]);

      // Re-fetch nodes with newly initialized progress records (to include the new null/false values)
      const freshResult = await query(text, params);
      nodes.splice(0, nodes.length, ...freshResult.rows);
    }

    // Build the tree
    const map = {};
    const roots = [];

    // Initialize map
    nodes.forEach(node => {
      map[node.id] = { 
        ...node, 
        usuario_nota: node.usuario_nota !== undefined && node.usuario_nota !== null ? parseFloat(node.usuario_nota) : null,
        usuario_completado: node.usuario_completado !== undefined && node.usuario_completado !== null ? !!node.usuario_completado : false,
        children: [] 
      };
    });

    // Populate children
    nodes.forEach(node => {
      if (node.padre_id) {
        if (map[node.padre_id]) {
          map[node.padre_id].children.push(map[node.id]);
        }
      } else {
        roots.push(map[node.id]);
      }
    });

    // Rollup percentage and total questions recursively
    const visited = new Set();
    const rollupNode = (node) => {
      if (visited.has(node.id)) {
        return {
          total_preguntas: parseInt(node.total_preguntas || 0),
          porcentaje_preguntas: parseFloat(node.porcentaje_preguntas || 0)
        };
      }
      visited.add(node.id);

      let childrenTotal = 0;
      let childrenPorcentaje = 0;

      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          const childRollup = rollupNode(child);
          childrenTotal += childRollup.total_preguntas;
          childrenPorcentaje += childRollup.porcentaje_preguntas;
        });
      }

      const directTotal = parseInt(node.total_preguntas || 0);
      const directPorcentaje = parseFloat(node.porcentaje_preguntas || 0);

      node.total_preguntas = directTotal + childrenTotal;
      node.porcentaje_preguntas = directPorcentaje + childrenPorcentaje;

      return {
        total_preguntas: node.total_preguntas,
        porcentaje_preguntas: node.porcentaje_preguntas
      };
    };

    // Calculate rollups for all roots
    roots.forEach(root => rollupNode(root));

    // Helper to sort nodes by study relevance
    const sortNodes = (nodeArray) => {
      return nodeArray.sort((a, b) => {
        const pctA = parseFloat(a.porcentaje_preguntas || 0);
        const pctB = parseFloat(b.porcentaje_preguntas || 0);
        if (pctB !== pctA) {
          return pctB - pctA; // Most relevant first (descending percentage)
        }
        
        const qA = parseInt(a.total_preguntas || 0);
        const qB = parseInt(b.total_preguntas || 0);
        if (qB !== qA) {
          return qB - qA; // Descending total questions
        }
        
        return (a.nombre || '').localeCompare(b.nombre || ''); // Alphabetical fallback
      });
    };

    // Sort children for every node in the map
    Object.values(map).forEach(node => {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children);
      }
    });

    // Sort the top-level roots
    sortNodes(roots);

    // If a specific root is requested (e.g., Código Civil's ID), return that branch.
    let data = roots;
    if (rootId) {
      if (map[rootId]) {
        data = map[rootId];
      } else {
        const leyIdNum = parseInt(rootId);
        if (!isNaN(leyIdNum)) {
          const matchingNode = nodes.find(node => node.ley_id === leyIdNum && (node.padre_id === null || node.padre_id === 'MAPA CONCEPTUAL' || !node.padre_id));
          if (matchingNode && map[matchingNode.id]) {
            data = map[matchingNode.id];
          }
        }
      }
    }

    if (data && !Array.isArray(data)) {
      const leyId = data.ley_id;
      if (leyId) {
        const leyResult = await query(`
          SELECT audio_1, audio_2, video_1, video_2 
          FROM "notarioElite".leyes 
          WHERE id = $1
        `, [leyId]);
        if (leyResult.rows.length > 0) {
          data.audio_1 = leyResult.rows[0].audio_1;
          data.audio_2 = leyResult.rows[0].audio_2;
          data.video_1 = leyResult.rows[0].video_1;
          data.video_2 = leyResult.rows[0].video_2;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching nodes map:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
