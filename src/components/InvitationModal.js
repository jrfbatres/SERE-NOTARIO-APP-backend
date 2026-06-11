import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../app/ThemeContext';

export default function InvitationModal({ isOpen, onClose, onInvitationSent }) {
  const { isDarkMode } = useTheme();
  
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!formData.correo && !formData.telefono) {
      setError('Debe ingresar un correo electrónico o un número de teléfono');
      setLoading(false);
      return;
    }

    const usuario = formData.correo ? formData.correo : formData.telefono;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/invitaciones/enviar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          correo: usuario
        })
      });
      
      const data = await res.json();
      
      if (!data.success) {
        setError(data.error || 'Error al enviar invitación');
        setLoading(false);
        return;
      }
      
      setSuccessData(data.data);
      if (onInvitationSent) onInvitationSent();
      
    } catch (err) {
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  const getMessageTemplate = () => {
    if (!successData) return '';
    return `¡Hola ${successData.nombre}! ⚖️\n\nHas sido invitado de manera exclusiva a formar parte de *SERÉ NOTARIO*, en nuestra fase de lanzamiento.\nTendrás acceso completo por 2 meses para practicar y prepararte de la mejor forma.\n\nIngresa aquí: https://www.serenotario.com\nTu usuario: ${successData.correo}\nTu clave de acceso: ${successData.claveTemporal}\n\n¡Te esperamos!`;
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(getMessageTemplate());
    let url = `https://wa.me/?text=${text}`;
    if (formData.telefono) {
      // Limpiar el teléfono de espacios o guiones
      const cleanPhone = formData.telefono.replace(/[\s-]/g, '');
      url = `https://wa.me/${cleanPhone}?text=${text}`;
    }
    window.open(url, '_blank');
  };

  const handleEmail = async () => {
    setEmailLoading(true);
    setEmailSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/invitaciones/enviar-correo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: successData.nombre,
          correo: successData.correo,
          claveTemporal: successData.claveTemporal
        })
      });
      
      if (res.ok) {
        setEmailSuccess(true);
        setTimeout(() => setEmailSuccess(false), 4000);
      } else {
        alert('Hubo un problema enviando el correo.');
      }
    } catch (e) {
      alert('Error de conexión al enviar correo.');
    } finally {
      setEmailLoading(false);
    }
  };

  const resetAndClose = () => {
    setFormData({ nombre: '', correo: '', telefono: '' });
    setSuccessData(null);
    setError('');
    onClose();
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        style={{ minWidth: 'min(90vw, 400px)', width: '100%', maxWidth: '28rem' }}
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden transform scale-100 animate-slide-up border ${isDarkMode ? 'bg-[#001524] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-opacity-20 border-gray-500">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#b59348] text-3xl">mail</span>
            <h3 className="font-bold text-xl">Invitar Colega</h3>
          </div>
          <button onClick={resetAndClose} className="p-1 hover:bg-gray-500/20 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {!successData ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1 opacity-80">Nombre Completo</label>
              <input 
                type="text" 
                name="nombre"
                required
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. Lic. Ana García"
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#b59348] transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 opacity-80">Usuario</label>
              <input 
                type="text" 
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                placeholder="ana@ejemplo.com"
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#b59348] transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 opacity-80">Teléfono (WhatsApp)</label>
              <input 
                type="tel" 
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Opcional: 50377778888"
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#b59348] transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
              />
              <p className="text-xs opacity-60 mt-1">Ingresa el código de país (ej. 503 para El Salvador) para enviar directo por WhatsApp.</p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 mt-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${loading ? 'opacity-70 cursor-not-allowed bg-gray-500 text-white' : 'bg-[#b59348] hover:bg-[#9c7a36] text-white shadow-lg hover:shadow-xl'}`}
            >
              {loading ? (
                <><span className="material-symbols-outlined animate-spin">refresh</span> Generando...</>
              ) : (
                <><span className="material-symbols-outlined">send</span> Generar Invitación</>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-[#b59348] mb-2">¡Invitación Creada!</h3>
              <p className="text-sm opacity-80 px-4">
                La cuenta para <strong>{successData.nombre}</strong> ha sido creada exitosamente con 2 meses de acceso.
              </p>
            </div>

            <div className="bg-[#b59348]/10 border border-[#b59348]/30 p-4 rounded-xl text-left mx-2 my-6 text-sm">
              <p><strong>Usuario:</strong> {successData.correo}</p>
              <p><strong>Clave:</strong> {successData.claveTemporal}</p>
            </div>

            <p className="text-xs font-semibold opacity-70 mb-2 uppercase tracking-wider">Enviar credenciales por:</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleWhatsApp}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white transition-colors shadow-md"
              >
                <span className="material-symbols-outlined">forum</span>
                WhatsApp
              </button>
              
              {successData.correo && successData.correo.includes('@') && (
                <button 
                  onClick={handleEmail}
                  disabled={emailLoading || emailSuccess}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md ${emailSuccess ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${(emailLoading || emailSuccess) ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                  {emailLoading ? (
                    <><span className="material-symbols-outlined animate-spin">refresh</span> Enviando...</>
                  ) : emailSuccess ? (
                    <><span className="material-symbols-outlined">check</span> ¡Enviado exitosamente!</>
                  ) : (
                    <><span className="material-symbols-outlined">mail</span> Enviar por Correo</>
                  )}
                </button>
              )}
            </div>
            
            <button 
              onClick={resetAndClose}
              className="mt-6 text-sm font-bold opacity-70 hover:opacity-100 hover:text-[#b59348] transition-colors"
            >
              Cerrar y Volver
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
