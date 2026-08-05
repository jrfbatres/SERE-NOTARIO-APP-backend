'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '../app/ThemeContext';

export default function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [historial, setHistorial] = useState([]);
  const [tieneNoLeidos, setTieneNoLeidos] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const { isDarkMode } = useTheme();
  const messagesEndRef = useRef(null);
  const pathname = usePathname();

  // Check login status on mount and when pathname changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, [pathname]);

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/soporte', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success) {
        setHistorial(data.data);
        
        // If chat is closed, check if there are unread messages from admin
        if (!isOpen) {
          const hasUnread = data.data.some(msg => msg.es_admin && !msg.leido);
          setTieneNoLeidos(hasUnread);
        } else {
          setTieneNoLeidos(false);
        }
      }
    } catch (e) {
      console.error('Error fetching chat history:', e);
    }
  };

  // Poll for messages every 15 seconds if logged in
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchChatHistory();
    const interval = setInterval(fetchChatHistory, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isOpen]);

  // Scroll to bottom when chat history changes or opens
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [historial, isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTieneNoLeidos(false);
      fetchChatHistory();
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const textoAEnviar = mensaje.trim();
    if (textoAEnviar === '' || mensaje.length > 150) return;

    // Limpiar el campo de texto inmediatamente para una mejor experiencia de usuario (UX)
    setMensaje('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/soporte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mensaje: textoAEnviar })
      });
      const data = await res.json();
      if (data.success) {
        setHistorial(prev => [...prev, data.data]);
        setTimeout(fetchChatHistory, 500);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Opcional: restaurar el mensaje en caso de error de red
      setMensaje(textoAEnviar);
    }
  };

  if (!isAuthenticated || pathname === '/login') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 font-body-md">
      {/* Chat bubble button */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="w-14 h-14 rounded-full bg-gold-brand hover:bg-[#9c7a36] text-navy-brand flex items-center justify-center shadow-2xl relative transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[28px] text-white">forum</span>
          {tieneNoLeidos && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className={`w-80 sm:w-96 h-[450px] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300 ${
          isDarkMode ? 'bg-[#002b49] border-white/10 text-white' : 'bg-white border-gray-200 text-[#002b49]'
        }`}>
          {/* Header */}
          <div className="p-4 bg-gold-brand text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[24px]">forum</span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider leading-none">Soporte Seré Notario</h3>
                <span className="text-[10px] opacity-75">Respuesta del Administrador</span>
              </div>
            </div>
            <button 
              onClick={handleToggle} 
              className="text-white hover:opacity-75 flex items-center justify-center p-1 rounded-full hover:bg-white/10 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {historial.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                <span className="material-symbols-outlined text-4xl mb-2 text-gold-brand">chat_bubble</span>
                <p className="text-xs font-bold uppercase tracking-wider">¿En qué podemos ayudarte?</p>
                <p className="text-[10px] mt-1">Escribe tu consulta abajo y un administrador te responderá a la brevedad.</p>
              </div>
            ) : (
              historial.map((msg, index) => {
                const alignRight = !msg.es_admin;
                return (
                  <div 
                    key={`msg-${msg.id || 'temp'}-${index}`} 
                    className={`flex ${alignRight ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      alignRight 
                        ? 'bg-[#b59348] text-white rounded-tr-none' 
                        : (isDarkMode ? 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none' : 'bg-gray-100 text-gray-700 rounded-tl-none')
                    }`}>
                      <p className="break-words whitespace-pre-wrap">{msg.mensaje}</p>
                      <span className={`text-[8px] block text-right mt-1 opacity-60`}>
                        {new Date(msg.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form onSubmit={handleSend} className={`p-3 border-t flex flex-col gap-1.5 ${
            isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'
          }`}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                maxLength={150}
                placeholder="Escribe tu mensaje..."
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-[#b59348] transition-all ${
                  isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-[#002b49]'
                }`}
              />
              <button
                type="submit"
                disabled={mensaje.trim() === '' || mensaje.length > 150}
                className="w-9 h-9 rounded-xl bg-gold-brand hover:bg-[#9c7a36] text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-[8px] opacity-40">Máximo 150 caracteres</span>
              <span className={`text-[9px] font-black ${mensaje.length > 150 ? 'text-red-500' : 'opacity-50'}`}>
                {mensaje.length}/150
              </span>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
