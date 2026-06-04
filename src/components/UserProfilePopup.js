'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../app/ThemeContext';
import InvitationModal from './InvitationModal';

export default function UserProfilePopup({ userProfile, position = 'bottom' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
  const [profile, setProfile] = useState(userProfile || null);

  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
    }
  }, [userProfile]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProfile = async () => {
    if (profile) return; // Already fetched
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/usuario/perfil', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePopup = () => {
    if (!isOpen) fetchProfile();
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // Determine popup position class
  const popupClass = position === 'right' 
    ? 'absolute left-full top-0 ml-4' 
    : 'absolute right-0 top-full mt-2';

  return (
    <>
      <div className="relative flex flex-col items-center justify-center" ref={dropdownRef}>
        <button 
          onClick={togglePopup}
          className={`w-8 h-8 md:w-10 md:h-10 rounded-full border overflow-hidden flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}
        >
          <span className={`material-symbols-outlined ${isDarkMode ? 'text-white' : 'text-[#002b49]'}`}>person</span>
        </button>
        {profile?.nombre && (
          <span className={`text-[10px] font-semibold mt-1 max-w-[60px] md:max-w-[80px] truncate text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {profile.nombre.split(' ')[0]}
          </span>
        )}

        {isOpen && (
          <div className={`${popupClass} w-72 rounded-xl shadow-2xl border backdrop-blur-md overflow-hidden z-50 animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#001524]/95 border-white/10 text-white' : 'bg-white/95 border-gray-200 text-gray-800'}`}>
            <div className={`p-4 border-b ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
              <h3 className="font-bold text-lg leading-tight mb-1">{profile?.nombre || 'Cargando...'}</h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{profile?.correo}</p>
            </div>
            
            <div className="p-4 space-y-3">
              {loading ? (
                <div className="flex justify-center p-4">
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                </div>
              ) : profile ? (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Rol/Plan:</span>
                    <span className="font-bold capitalize">{profile.rol || 'Estándar'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fundador:</span>
                    <span className={`font-bold ${profile.ban_fundador ? 'text-[#b59348]' : ''}`}>{profile.ban_fundador ? 'Sí' : 'No'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Vence:</span>
                    <span className="font-bold">{formatDate(profile.fecha_vence)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Invitaciones:</span>
                    <span className="font-bold bg-[#b59348] text-white px-2 py-0.5 rounded-full text-xs">
                      {profile.cantidad_invitaciones || 0}
                    </span>
                  </div>
                  {(profile.cantidad_invitaciones > 0 || profile.rol === 'Administrador') && (
                    <div className="mt-2 pt-2">
                      <button 
                        onClick={() => {
                          setIsOpen(false);
                          setIsInvitationModalOpen(true);
                        }}
                        className={`w-full py-2 px-3 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${isDarkMode ? 'bg-[#b59348]/20 text-[#b59348] hover:bg-[#b59348]/40 border border-[#b59348]/30' : 'bg-[#b59348] hover:bg-[#9c7a36] text-white shadow-md'}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">mail</span>
                        Invitar Colega
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-sm text-red-500 py-2">Error al cargar datos</div>
              )}
            </div>
            
            <div className={`p-2 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
              <button 
                onClick={handleLogout}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors ${isDarkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>

      <InvitationModal 
        isOpen={isInvitationModalOpen}
        onClose={() => setIsInvitationModalOpen(false)}
        onInvitationSent={() => fetchProfile()} 
      />
    </>
  );
}
