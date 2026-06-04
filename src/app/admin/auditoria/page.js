'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditoriaExamenes() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [examenes, setExamenes] = useState([]);
  const [selectedExamen, setSelectedExamen] = useState('');
  const [preguntas, setPreguntas] = useState([]);
  const [loadingPreguntas, setLoadingPreguntas] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/usuario/perfil', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (data.success && data.data.rol === 'Administrador') {
        setIsAdmin(true);
        loadExamenes(token);
      } else {
        router.push('/');
      }
    })
    .catch(() => router.push('/'));
  }, [router]);

  const loadExamenes = (token) => {
    fetch('/api/admin/examenes', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        setExamenes(data.data);
      }
      setLoading(false);
    });
  };

  const handleExamenChange = (e) => {
    const examenId = e.target.value;
    setSelectedExamen(examenId);
    if (!examenId) {
      setPreguntas([]);
      return;
    }

    setLoadingPreguntas(true);
    const token = localStorage.getItem('token');
    fetch(`/api/admin/auditoria/preguntas?examen_id=${examenId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        setPreguntas(data.data);
      }
      setLoadingPreguntas(false);
    });
  };

  const toggleBanMostrar = (id, currentBan) => {
    const newBan = currentBan === 'S' ? 'N' : 'S';
    const token = localStorage.getItem('token');

    // Optimistic UI update
    setPreguntas(prev => prev.map(p => p.id === id ? { ...p, ban_mostrar: newBan } : p));

    fetch(`/api/admin/auditoria/preguntas/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ban_mostrar: newBan })
    })
    .then(r => r.json())
    .then(data => {
      if (!data.success) {
        // Revert on failure
        setPreguntas(prev => prev.map(p => p.id === id ? { ...p, ban_mostrar: currentBan } : p));
        showToast('Error al actualizar el estado.');
      } else {
        showToast(`Pregunta ${newBan === 'S' ? 'habilitada' : 'ocultada'} exitosamente.`);
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b0c] flex items-center justify-center text-[#ffe088] font-bold tracking-widest uppercase">
        Verificando credenciales...
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0a0b0c] text-[#c6c6cd] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative pb-20">
        
        {/* Header */}
        <div className="bg-[#191c1e] p-6 rounded-2xl shadow-[4px_4px_10px_#050606,-4px_-4px_10px_#2d3236]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#ffe088] tracking-wide uppercase">Auditoría de Exámenes</h1>
              <p className="text-sm opacity-80 mt-1">Revisa y oculta preguntas defectuosas</p>
            </div>
            
            <div className="w-full md:w-1/3">
              <select
                value={selectedExamen}
                onChange={handleExamenChange}
                className="w-full bg-[#0a0b0c] text-white rounded-xl p-3 outline-none border border-[#ffe088]/20 focus:border-[#ffe088] transition-colors shadow-[inset_2px_2px_4px_#050606,inset_-2px_-2px_4px_#2d3236]"
              >
                <option value="">Selecciona un Examen...</option>
                {examenes.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.titulo}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {loadingPreguntas ? (
          <div className="text-center py-20 text-[#ffe088] animate-pulse">Cargando preguntas...</div>
        ) : preguntas.length > 0 ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <span className="text-sm font-bold uppercase tracking-wider text-[#ffe088]/80">
                {preguntas.length} Preguntas encontradas
              </span>
            </div>

            {preguntas.map((q, index) => (
              <div 
                key={q.id} 
                className={`p-6 rounded-2xl transition-all duration-300 border ${
                  q.ban_mostrar === 'S' 
                    ? 'bg-[#191c1e] border-transparent shadow-[4px_4px_10px_#050606,-4px_-4px_10px_#2d3236]' 
                    : 'bg-[#1e1919] border-[#ba1a1a]/40 shadow-none opacity-80'
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
                  
                  {/* Left Side: Question and Options */}
                  <div className="flex-1 space-y-4">
                    <div className="flex gap-3">
                      <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#0a0b0c] text-[#ffe088] font-black text-sm shadow-[inset_2px_2px_4px_#050606]">
                        {index + 1}
                      </span>
                      <p className="text-white text-lg font-medium leading-relaxed">
                        {q.pregunta}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11">
                      {q.opciones && q.opciones.map((opt, oIdx) => (
                        <div 
                          key={opt.id || oIdx} 
                          className={`p-3 rounded-xl border text-sm flex items-start gap-2 ${
                            opt.es_correcta 
                              ? 'bg-[#002116] border-[#479175] text-[#a6f2d1]' 
                              : 'bg-[#0a0b0c] border-[#c6c6cd]/10 text-[#c6c6cd]/80'
                          }`}
                        >
                          <span className="shrink-0">{opt.es_correcta ? '✅' : '❌'}</span>
                          <span>{opt.texto_opcion}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Side: Actions */}
                  <div className="shrink-0 flex flex-col items-end gap-3 min-w-[140px] pl-11 lg:pl-0">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                      q.ban_mostrar === 'S' ? 'bg-[#ffe088]/10 text-[#ffe088]' : 'bg-[#ba1a1a]/20 text-[#ffdad6]'
                    }`}>
                      {q.ban_mostrar === 'S' ? 'Visible' : 'Oculto'}
                    </span>
                    
                    <button
                      onClick={() => toggleBanMostrar(q.id, q.ban_mostrar)}
                      className={`w-full py-2 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 ${
                        q.ban_mostrar === 'S'
                          ? 'bg-[#ba1a1a] text-white hover:bg-[#93000a]'
                          : 'bg-[#479175] text-white hover:bg-[#002116]'
                      }`}
                    >
                      {q.ban_mostrar === 'S' ? 'Ocultar' : 'Habilitar'}
                    </button>
                    
                    <div className="text-right mt-2">
                      <p className="text-[10px] uppercase opacity-50">Ley</p>
                      <p className="text-xs font-semibold text-[#ffe088] truncate max-w-[140px]" title={q.ley_nombre}>{q.ley_nombre}</p>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        ) : selectedExamen ? (
          <div className="text-center py-20 opacity-50">No hay preguntas para este examen.</div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 opacity-30">
            <span className="material-symbols-outlined text-6xl mb-4">plagiarism</span>
            <p className="uppercase tracking-widest text-sm font-bold">Selecciona un examen para comenzar</p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#ffe088] text-[#191c1e] px-6 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] font-bold text-sm z-50 animate-slide-up whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
