'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/ThemeContext';
import UserProfilePopup from '@/components/UserProfilePopup';

export default function AdminSoportePage() {
  const [threads, setThreads] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // { id, nombre, correo }
  const [historial, setHistorial] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [toast, setToast] = useState(null);

  const router = useRouter();
  const { isDarkMode } = useTheme();
  const messagesEndRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchThreads = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/soporte', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success) {
        setThreads(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchThreadHistory = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/soporte?usuarioId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success) {
        setHistorial(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Poll for threads and selected history
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/usuario/perfil', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(profileRes => {
        if (profileRes.success) {
          const profile = profileRes.data;
          const isAdmin = profile.correo === 'admin@serenotario.com' || profile.rol === 'Administrador' || profile.rol === 'ADMINISTRADOR';
          if (!isAdmin) {
            router.push('/');
            return;
          }
          setUserProfile(profile);
          fetchThreads().then(() => setLoading(false));
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Periodic polling interval
  useEffect(() => {
    if (!userProfile) return;

    const interval = setInterval(() => {
      fetchThreads();
      if (selectedUser) {
        fetchThreadHistory(selectedUser.id);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [userProfile, selectedUser]);

  // Scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [historial]);

  const handleSelectUser = (thread) => {
    setSelectedUser({
      id: thread.usuario_id,
      nombre: thread.usuario_nombre,
      correo: thread.usuario_correo
    });
    setHistorial([]);
    fetchThreadHistory(thread.usuario_id);
    // Mark as read in UI thread list immediately
    setThreads(prev => prev.map(t => {
      if (t.usuario_id === thread.usuario_id) {
        return { ...t, mensajes_no_leidos: 0 };
      }
      return t;
    }));
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedUser || mensaje.trim() === '' || mensaje.length > 150) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/soporte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuarioId: selectedUser.id,
          mensaje: mensaje.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHistorial(prev => [...prev, data.data]);
        setMensaje('');
        fetchThreads(); // Refresh thread last message
      } else {
        showToast(data.error || 'Error al enviar respuesta.');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión.');
    }
  };

  if (loading && !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-[#002b49] bg-[#f8f9ff]">
        Verificando credenciales de administrador...
      </div>
    );
  }

  const themeClasses = {
    bg: isDarkMode ? "bg-[#001524]" : "bg-[#f8f9ff]",
    text: isDarkMode ? "text-white" : "text-[#002b49]",
    card: isDarkMode ? "bg-[#002b49]/50 border-white/10" : "bg-white border-gray-200 shadow-md",
    header: isDarkMode ? "bg-[#001524]/90 border-white/10" : "bg-white/90 border-gray-200",
    threadItem: isDarkMode ? "hover:bg-white/5 border-white/5" : "hover:bg-gray-50 border-gray-100",
    threadActive: isDarkMode ? "bg-white/10 border-l-4 border-gold-brand" : "bg-gold-brand/10 border-l-4 border-gold-brand",
    input: isDarkMode ? "bg-white/5 border-white/10 text-white focus:border-[#b59348]" : "bg-white border-gray-300 text-[#002b49]",
  };

  return (
    <div className={`min-h-screen flex flex-col font-body-md ${themeClasses.bg} ${themeClasses.text} transition-colors duration-300`}>
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#002b49] text-white px-5 py-3.5 rounded-2xl border border-[#b59348] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="material-symbols-outlined text-[#b59348] text-[20px]">info</span>
          <span className="text-xs font-black uppercase tracking-wider">{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-30 flex items-center justify-between p-4 md:px-8 border-b backdrop-blur-md ${themeClasses.header}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="p-2 rounded-full hover:bg-gray-500/20 transition-colors flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#b59348]">
              Bandeja de Soporte
            </h1>
            <p className="text-[10px] font-black opacity-70 uppercase tracking-widest text-[#b59348]/85">
              RESPUESTA EN TIEMPO REAL A CONSULTAS DE USUARIOS
            </p>
          </div>
        </div>
        <UserProfilePopup userProfile={userProfile} />
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-hidden flex p-4 md:p-6 gap-6">
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)]">
          
          {/* Left Column: Threads list */}
          <div className={`w-full md:w-80 lg:w-96 rounded-3xl border flex flex-col overflow-hidden ${themeClasses.card}`}>
            <div className="p-4 border-b border-white/10">
              <h2 className="text-xs font-black uppercase tracking-widest opacity-80">Conversaciones Activas</h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
              {threads.length === 0 ? (
                <div className="p-8 text-center text-xs italic opacity-60">
                  No hay mensajes de soporte todavía.
                </div>
              ) : (
                threads.map((thread) => {
                  const isActive = selectedUser?.id === thread.usuario_id;
                  const hasUnread = parseInt(thread.mensajes_no_leidos) > 0;
                  return (
                    <button
                      key={thread.usuario_id}
                      onClick={() => handleSelectUser(thread)}
                      className={`w-full text-left p-4 transition-all duration-200 border-b flex flex-col gap-1 cursor-pointer ${
                        isActive ? themeClasses.threadActive : themeClasses.threadItem
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-sm truncate max-w-[80%]">
                          {thread.usuario_nombre}
                        </span>
                        {hasUnread && (
                          <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                            {thread.mensajes_no_leidos}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] opacity-50 truncate max-w-full">{thread.usuario_correo}</p>
                      <p className="text-xs opacity-75 truncate max-w-full italic mt-1">"{thread.ultimo_mensaje}"</p>
                      <span className="text-[8px] opacity-40 self-end mt-1">
                        {new Date(thread.fecha_ultimo_mensaje).toLocaleDateString()} {new Date(thread.fecha_ultimo_mensaje).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Thread History */}
          <div className={`flex-1 rounded-3xl border flex flex-col overflow-hidden ${themeClasses.card}`}>
            {selectedUser ? (
              <>
                {/* Thread Header */}
                <div className="p-4 border-b border-white/10 bg-black/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider">{selectedUser.nombre}</h2>
                    <p className="text-[10px] opacity-60">{selectedUser.correo}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[9px] uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Canal Abierto
                  </span>
                </div>

                {/* History Viewport */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/5">
                  {historial.map((msg, index) => {
                    const isOwnMessage = msg.es_admin; // Admin replies are own messages
                    return (
                      <div 
                        key={msg.id || index}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] p-4 rounded-2xl text-xs leading-relaxed shadow-sm flex flex-col ${
                          isOwnMessage 
                            ? 'bg-[#b59348] text-white rounded-tr-none' 
                            : (isDarkMode ? 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none' : 'bg-gray-100 text-gray-700 rounded-tl-none')
                        }`}>
                          <p className="break-words font-medium">{msg.mensaje}</p>
                          <div className="flex items-center justify-between gap-4 mt-2 opacity-65 text-[8px]">
                            <span>{new Date(msg.creado_en).toLocaleDateString()}</span>
                            <span>{new Date(msg.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Footer Form */}
                <form onSubmit={handleSendReply} className="p-4 border-t border-white/10 bg-black/10 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                      maxLength={150}
                      placeholder={`Responder a ${selectedUser.nombre}...`}
                      className={`flex-1 px-4 py-3 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-[#b59348] transition-all ${themeClasses.input}`}
                    />
                    <button
                      type="submit"
                      disabled={mensaje.trim() === '' || mensaje.length > 150}
                      className="px-5 py-3 bg-[#b59348] hover:bg-[#9c7a36] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">send</span>
                      Enviar
                    </button>
                  </div>
                  <div className="flex justify-between items-center px-1 text-[10px]">
                    <span className="opacity-55">Límite de caracteres por respuesta</span>
                    <span className={`font-black ${mensaje.length > 150 ? 'text-red-500' : 'opacity-60'}`}>
                      {mensaje.length} / 150
                    </span>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-65">
                <span className="material-symbols-outlined text-5xl text-gold-brand mb-3">forum</span>
                <div style={{ width: '100%', maxWidth: '380px' }} className="space-y-2">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-[#b59348]">Centro de Soporte</h3>
                  <p className="text-xs leading-relaxed">
                    Selecciona una conversación del listado izquierdo para leer los detalles e intercambiar mensajes en tiempo real con el usuario.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
