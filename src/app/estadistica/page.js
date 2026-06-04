'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../ThemeContext';
import UserProfilePopup from '../../components/UserProfilePopup';

export default function EstadisticaPage() {
  const [estadisticas, setEstadisticas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [lastGrade, setLastGrade] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    const fetchWithAuthCheck = (url) => 
      fetch(`${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`, { headers, cache: 'no-store' })
        .then(res => {
          if (res.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
            return { success: false };
          }
          return res.json();
        });

    Promise.all([
      fetchWithAuthCheck('/api/estadistica'),
      fetchWithAuthCheck('/api/usuario/perfil'),
      fetchWithAuthCheck('/api/usuario/nota-global')
    ])
      .then(([statsData, profileData, gradeData]) => {
        if (statsData.success) {
          setEstadisticas(statsData.data);
        }
        if (profileData && profileData.success) {
          setUserProfile(profileData.data);
        }
        if (gradeData && gradeData.success) {
          setLastGrade(gradeData.nota_ultima);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [router]);

  const themeClasses = {
    bg: isDarkMode ? "bg-[#001524]" : "bg-[#f8f9ff]",
    text: isDarkMode ? "text-white" : "text-[#002b49]",
    sidebarBg: isDarkMode ? "bg-[#001524]/95 border-white/10" : "bg-white/95 border-gray-200 shadow-xl",
    menuItemHover: isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-100",
    buttonBg: isDarkMode ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200",
    cardBg: isDarkMode ? "bg-[#002b49]/40 border-white/10" : "bg-white border-gray-200 shadow-sm",
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 70) return 'bg-[#b59348]'; // Gold
    if (percentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`min-h-screen flex font-body-md ${themeClasses.bg} ${themeClasses.text} transition-colors duration-300 overflow-hidden`}>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${themeClasses.sidebarBg} border-r`}>
        
        {/* Logo Section */}
        <div className={`p-6 pb-4 border-b border-opacity-10 ${isDarkMode ? 'border-white' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <img
                src={isDarkMode ? "/images/logo-oscuro.png" : "/images/logo.png"}
                alt="Seré Notario Logo"
                className="h-16 w-auto object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="text-[22px] font-black tracking-tight leading-none">
                SERÉ<br/><span className="text-[#b59348]">NOTARIO</span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 rounded-full hover:bg-gray-500/20 text-gray-400">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="hidden lg:flex justify-center pt-6 pb-2">
          <UserProfilePopup userProfile={userProfile} position="right" />
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          <button
            onClick={() => router.push('/')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider ${themeClasses.menuItemHover}`}
          >
            <span className="material-symbols-outlined text-[20px] text-[#b59348]">home</span>
            <span className="flex-1 text-left">Inicio</span>
          </button>
          
          <button
            onClick={() => router.push('/simulador/simulacro')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider ${themeClasses.menuItemHover}`}
          >
            <span className="material-symbols-outlined text-[20px] text-[#b59348]">assignment</span>
            <span className="flex-1 text-left">Simulacro General</span>
          </button>
          
          <button
            onClick={() => router.push('/manos-libres')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider ${themeClasses.menuItemHover}`}
          >
            <span className="material-symbols-outlined text-[20px] text-[#b59348]">headphones</span>
            <span className="flex-1 text-left">Manos Libres</span>
          </button>
          
          <button
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#b59348]/20 text-[#b59348] border border-[#b59348]/40 rounded-xl font-black shadow-inner transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-[20px]">bar_chart</span>
            <span className="flex-1 text-left">Estadísticas</span>
          </button>

          <button
            onClick={() => router.push('/ranking')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider ${themeClasses.menuItemHover}`}
          >
            <span className="material-symbols-outlined text-[20px] text-[#b59348]">emoji_events</span>
            <span className="flex-1 text-left">Ranking</span>
          </button>
          
          <button
            onClick={() => router.push('/planes')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider ${themeClasses.menuItemHover}`}
          >
            <span className="material-symbols-outlined text-[20px] text-[#b59348]">credit_card</span>
            <span className="flex-1 text-left">Planes de Pago</span>
          </button>

          {userProfile?.rol === 'Administrador' && (
            <button
              onClick={() => router.push('/admin/auditoria')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 mt-4 rounded-xl font-bold transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider border border-[#ba1a1a]/40 ${isDarkMode ? 'bg-[#ba1a1a]/10 hover:bg-[#ba1a1a]/20 text-[#ffdad6]' : 'bg-[#ba1a1a]/10 hover:bg-[#ba1a1a]/20 text-[#93000a]'}`}
            >
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              <span className="flex-1 text-left">Auditoría Admin</span>
            </button>
          )}
        </nav>

        {/* Footer Area */}
        <div className={`p-5 border-t border-opacity-10 space-y-4 ${isDarkMode ? 'border-white' : 'border-gray-200'}`}>
          <div className={`flex items-center justify-between p-3 rounded-xl border ${themeClasses.buttonBg}`}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b59348] text-[20px]">history</span>
              <span className="text-xs uppercase tracking-wider font-bold opacity-80">Última Nota</span>
            </div>
            <span className="text-sm font-black">
              {lastGrade !== null && lastGrade !== undefined ? `${lastGrade.toFixed(2)} / 10` : '--'}
            </span>
          </div>

          <div className="flex items-center justify-center mt-4">
            <button 
              onClick={toggleDarkMode}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-colors ${isDarkMode ? 'border-white/10 text-yellow-400 hover:bg-white/10' : 'border-gray-200 text-[#002b49] hover:bg-gray-100'}`}
              title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
              <span>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* Mobile Header */}
        <header className={`lg:hidden flex items-center justify-between p-4 sticky top-0 z-30 backdrop-blur-md border-b ${isDarkMode ? 'bg-[#001524]/90 border-white/10' : 'bg-white/90 border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 rounded-md hover:bg-gray-500/20 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <img
              src={isDarkMode ? "/images/logo-oscuro.png" : "/images/logo.png"}
              alt="Seré Notario Logo"
              className="h-8 w-auto object-contain"
            />
          </div>
          <UserProfilePopup userProfile={userProfile} />
        </header>

        <div className="p-4 md:p-8 flex-1 flex flex-col max-w-5xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-black mb-2 uppercase tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-[#b59348]">bar_chart</span>
              Estadísticas de Progreso
            </h1>
            <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Monitorea tu avance por cada ley en base a los temas aprobados.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <span className="material-symbols-outlined animate-spin text-4xl text-[#b59348]">refresh</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {estadisticas.map((stat, idx) => {
                const total = parseInt(stat.total_nodos, 10);
                const pasados = parseInt(stat.nodos_pasados, 10);
                const percentage = total > 0 ? Math.round((pasados / total) * 100) : 0;
                
                return (
                  <div key={stat.ley_id} className={`p-5 rounded-2xl border ${themeClasses.cardBg} flex flex-col gap-3 transition-transform hover:scale-[1.02] duration-300`}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-sm md:text-base leading-snug flex-1">
                        {stat.ley_nombre}
                      </h3>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Peso Examen</span>
                        <span className="text-[#b59348] font-black text-lg leading-none">{parseFloat(stat.importancia)}%</span>
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="flex justify-between items-end mb-1.5">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {pasados} / {total} Temas Aprobados
                        </span>
                        <span className="text-sm font-black">{percentage}%</span>
                      </div>
                      <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(percentage)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
