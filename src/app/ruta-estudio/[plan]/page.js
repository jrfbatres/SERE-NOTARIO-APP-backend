'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from '@/app/ThemeContext';
import UserProfilePopup from '@/components/UserProfilePopup';

export default function RutaEstudioPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const router = useRouter();
  const params = useParams();
  const { isDarkMode } = useTheme();

  const plan = params.plan; // 'express' o 'profundo'

  useEffect(() => {
    if (!plan) return; // Esperar a que los parámetros estén listos

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    Promise.all([
      fetch(`/api/ruta-estudio/${plan}`, { headers }).then(async res => {
        const status = res.status;
        const text = await res.text();
        console.log(`Fetch Status: ${status}, Response: ${text}`);
        try {
          return JSON.parse(text);
        } catch (e) {
          return { error: 'Invalid JSON', raw: text };
        }
      }),
      fetch('/api/usuario/perfil', { headers }).then(res => res.json())
    ])
      .then(([rutaRes, profileRes]) => {
        if (rutaRes.success) {
          setData(rutaRes);
        } else {
          console.warn("Error API ruta:", rutaRes);
          setData({ error: rutaRes.error || 'Error al cargar la ruta' });
        }
        if (profileRes.success) setUserProfile(profileRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setData({ error: 'Error de conexión' });
        setLoading(false);
      });
  }, [plan, router]);

  const goToStudyNode = (nodo_id, cantidadPreguntas, diaNum) => {
    const queryParts = [];
    if (cantidadPreguntas) queryParts.push(`limit=${cantidadPreguntas}`);
    if (data?.pensum_id) queryParts.push(`pensum_id=${data.pensum_id}`);
    if (diaNum !== undefined) queryParts.push(`dia=${diaNum}`);
    if (plan) queryParts.push(`plan=${plan}`);
    
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    router.push(`/simulador/${nodo_id}${queryString}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-[#002b49] bg-[#f8f9ff]">Cargando Ruta de Estudio...</div>;

  const themeClasses = {
    bg: isDarkMode ? "bg-[#001524]" : "bg-[#f8f9ff]",
    text: isDarkMode ? "text-white" : "text-[#002b49]",
    card: isDarkMode ? "bg-[#002b49]/50 border-white/10" : "bg-white border-gray-200",
    nodeCard: isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-gray-50 border-gray-200 hover:bg-gray-100",
    header: isDarkMode ? "bg-[#001524]/90 border-white/10" : "bg-white/90 border-gray-200",
  };

  return (
    <div className={`min-h-screen flex flex-col font-body-md ${themeClasses.bg} ${themeClasses.text} transition-colors duration-300`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-30 flex items-center justify-between p-4 md:px-8 border-b backdrop-blur-md ${themeClasses.header}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="p-2 rounded-full hover:bg-gray-500/20 transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#b59348]">
              {data?.pensum_nombre || 'Ruta de Estudio'}
            </h1>
            <p className="text-xs font-bold opacity-70 uppercase tracking-widest">
              {data?.dias_totales ? `${data.dias_totales} DÍAS` : ''}
            </p>
          </div>
        </div>
        <UserProfilePopup userProfile={userProfile} />
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="text-center mb-6">
            <h2 className="text-lg md:text-xl font-bold">Tu Camino al Éxito</h2>
          </div>

          {/* Resumen de Progreso y Nota Global */}
          {data?.dias && (function() {
            const allNodes = data.dias.flatMap(d => d.nodos);
            const nodesWithGrades = allNodes.filter(n => n.nota !== null);
            const completedCount = allNodes.filter(n => n.completado).length;
            const totalNodes = allNodes.length;
            
            const notaGlobal = nodesWithGrades.length > 0
              ? nodesWithGrades.reduce((sum, n) => sum + Number(n.nota), 0) / nodesWithGrades.length
              : 0;

            const progressPercent = totalNodes > 0 
              ? Math.round((completedCount / totalNodes) * 100) 
              : 0;

            return (
              <div className={`p-6 rounded-3xl border ${themeClasses.card} shadow-md grid grid-cols-1 md:grid-cols-3 gap-6 items-center`}>
                <div className="text-center md:text-left">
                  <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider block mb-1">Nota Global</span>
                  <div className="flex items-baseline justify-center md:justify-start gap-1">
                    <span className="text-3xl font-black text-[#b59348]">
                      {nodesWithGrades.length > 0 ? notaGlobal.toFixed(1) : '-.-'}
                    </span>
                    <span className="text-sm opacity-60">/ 10</span>
                  </div>
                  <p className="text-[11px] opacity-70 mt-1">Promedio de temas evaluados</p>
                </div>
                
                <div className="text-center md:text-left">
                  <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider block mb-1">Progreso General</span>
                  <div className="flex items-baseline justify-center md:justify-start gap-1">
                    <span className="text-3xl font-black text-green-500">{progressPercent}%</span>
                    <span className="text-xs opacity-60">({completedCount} de {totalNodes} temas)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>

                <div className="text-center md:text-left border-t md:border-t-0 md:border-l border-black/5 dark:border-white/5 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider block mb-1">Estado de la Ruta</span>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="material-symbols-outlined text-[#b59348] text-2xl">trending_up</span>
                    <span className="text-sm font-bold">Plan de Estudio Express</span>
                  </div>
                  <p className="text-[11px] opacity-70 mt-1">Estudio segmentado en bloques de 5 preguntas.</p>
                </div>
              </div>
            );
          })()}

          {data?.error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-600 rounded-xl font-bold text-center">
              {data.error}
            </div>
          )}

          {/* DEBUG BLOCK */}
          {!data?.dias && !data?.error && data !== null && (
             <div className="p-4 bg-yellow-100 text-black rounded">
               DEBUG DATA: {JSON.stringify(data)}
             </div>
          )}
          {data === null && !loading && (
             <div className="p-4 bg-yellow-100 text-black rounded">
               DEBUG DATA IS NULL
             </div>
          )}
           <div className="flex flex-col space-y-4">
            {data?.dias && (function() {
              const firstUncompletedIndex = data.dias.findIndex(d => !d.completado);
              
              const isDayLocked = (idx) => {
                const rol = userProfile?.rol;
                if ((rol === 'DEMO' || rol === 'DEMOS') && idx > 0) {
                  return true;
                }
                for (let i = 0; i < idx; i++) {
                  if (!data.dias[i].completado) {
                    return true;
                  }
                }
                return false;
              };

              return data.dias.map((day, idx) => {
                const completado = day.completado;
                const isCurrentActive = idx === firstUncompletedIndex;
                const isLocked = isDayLocked(idx);
                
                return (
                  <div 
                    key={`task-${day.dia}-${idx}`}
                    className={`p-4 md:p-5 rounded-2xl border ${themeClasses.card} shadow-sm flex flex-col md:flex-row md:items-start gap-4 transition-all duration-300 ${completado ? 'opacity-75' : ''} ${isLocked ? 'opacity-50 grayscale pointer-events-none' : ''} ${isCurrentActive ? 'ring-2 ring-[#b59348] shadow-md' : ''}`}
                  >
                    {/* Indicador de Día a la izquierda */}
                    <div className="flex md:flex-col items-center md:items-start justify-between md:justify-start gap-2 md:w-48 shrink-0 pb-3 md:pb-0 border-b md:border-b-0 md:border-r border-black/5 dark:border-white/5 pr-0 md:pr-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${completado ? 'bg-green-500/10 text-green-600 dark:text-green-400' : isCurrentActive ? 'bg-[#b59348]/15 text-[#b59348]' : 'bg-gray-500/10 text-gray-500'}`}>
                          Día {day.dia}
                        </span>
                        {isCurrentActive && (
                          <span className="bg-[#b59348] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                            ACTIVO
                          </span>
                        )}
                        {completado && (
                          <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[10px]">done</span>
                            Listo
                          </span>
                        )}
                      </div>
                      <h3 className={`text-base font-black ${completado ? 'text-green-500' : (isLocked ? 'text-gray-400' : 'text-[#b59348]')}`}>
                        Día de Estudio {day.dia}
                      </h3>
                    </div>

                    {/* Lista de temas / Nodos a la derecha */}
                    <div className="flex-1 space-y-2 w-full">
                      {day.nodos.length === 0 ? (
                        <div className="text-xs opacity-50 font-bold italic py-2">Sin asignaciones para este día.</div>
                      ) : day.nodos.map((nodo, nIdx) => (
                        <button
                          key={`${nodo.nodo_id}-${nIdx}`}
                          onClick={() => goToStudyNode(nodo.nodo_id, nodo.cantidad_preguntas, day.dia)}
                          disabled={isLocked}
                          className={`w-full text-left p-3 rounded-xl border ${themeClasses.nodeCard} transition-all duration-200 ${!isLocked && 'active:scale-[0.99] hover:border-[#b59348]/40 group flex flex-col sm:flex-row sm:items-center justify-between gap-3'}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm leading-tight transition-colors line-clamp-2 ${!isLocked && 'group-hover:text-[#b59348]'}`}>
                              {nodo.nodo_nombre}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-black/5 dark:border-white/5">
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                              Bloque {nodo.bloque_actual} / {nodo.bloques_totales}
                            </span>
                            
                            {nodo.completado ? (
                              <span className="text-xs font-black text-green-500 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">done_all</span>
                                LISTO
                              </span>
                            ) : (
                              <div className="flex gap-1">
                                {Array.from({ length: Math.min(nodo.bloques_totales, 5) }).map((_, i) => (
                                  <div 
                                    key={i} 
                                    className={`h-1.5 w-3 rounded-full ${i < (nodo.bloque_actual - 1) ? 'bg-[#b59348]' : 'bg-gray-300 dark:bg-gray-700'}`} 
                                  />
                                ))}
                                {nodo.bloques_totales > 5 && <span className="text-[8px] opacity-50 ml-1">...</span>}
                              </div>
                            )}

                            {nodo.nota !== null && nodo.nota !== undefined && (
                              <span className={`text-[11px] font-black shrink-0 px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 ${Number(nodo.nota) >= 7 ? 'text-green-600' : 'text-red-500'}`}>
                                {Number(nodo.nota).toFixed(1)} / 10
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>

        </div>
      </main>
    </div>
  );
}
