'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../ThemeContext';
import UserProfilePopup from '../../components/UserProfilePopup';

export default function RankingPage() {
  const [rankingData, setRankingData] = useState({ topUsers: [], currentUserRank: null });
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
      fetchWithAuthCheck('/api/ranking'),
      fetchWithAuthCheck('/api/usuario/perfil'),
      fetchWithAuthCheck('/api/usuario/nota-global')
    ])
      .then(([rankingRes, profileData, gradeData]) => {
        if (rankingRes && rankingRes.success) {
          setRankingData(rankingRes.data);
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

  const getMedalColor = (index) => {
    if (index === 0) return 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]'; // Gold
    if (index === 1) return 'text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.6)]'; // Silver
    if (index === 2) return 'text-[#cd7f32] drop-shadow-[0_0_8px_rgba(205,127,50,0.6)]'; // Bronze
    return 'text-gray-400';
  };

  const { topUsers, currentUserRank } = rankingData;
  const isCurrentUserInTop = currentUserRank && topUsers.some(u => u.id === currentUserRank.id);

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
          <button onClick={() => router.push('/')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider ${themeClasses.menuItemHover}`}>
            <span className="material-symbols-outlined text-[20px] text-[#b59348]">home</span>
            <span className="flex-1 text-left">Inicio</span>
          </button>
          
          <button onClick={() => router.push('/simulador/simulacro')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider ${themeClasses.menuItemHover}`}>
            <span className="material-symbols-outlined text-[20px] text-[#b59348]">assignment</span>
            <span className="flex-1 text-left">Simulacro General</span>
          </button>
          
          <button onClick={() => router.push('/manos-libres')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider ${themeClasses.menuItemHover}`}>
            <span className="material-symbols-outlined text-[20px] text-[#b59348]">headphones</span>
            <span className="flex-1 text-left">Manos Libres</span>
          </button>
          
          <button onClick={() => router.push('/estadistica')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider ${themeClasses.menuItemHover}`}>
            <span className="material-symbols-outlined text-[20px] text-[#b59348]">bar_chart</span>
            <span className="flex-1 text-left">Estadísticas</span>
          </button>

          <button onClick={() => {}} className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#b59348]/20 text-[#b59348] border border-[#b59348]/40 rounded-xl font-black shadow-inner transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider">
            <span className="material-symbols-outlined text-[20px]">emoji_events</span>
            <span className="flex-1 text-left">Ranking</span>
          </button>
          
          <button onClick={() => router.push('/planes')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider ${themeClasses.menuItemHover}`}>
            <span className="material-symbols-outlined text-[20px] text-[#b59348]">credit_card</span>
            <span className="flex-1 text-left">Planes de Pago</span>
          </button>
        </nav>

        {/* Footer Area */}
        <div className={`p-5 border-t border-opacity-10 space-y-4 ${isDarkMode ? 'border-white' : 'border-gray-200'}`}>
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
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <header className={`lg:hidden flex items-center justify-between p-4 sticky top-0 z-30 backdrop-blur-md border-b ${isDarkMode ? 'bg-[#001524]/90 border-white/10' : 'bg-white/90 border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-1 rounded-md hover:bg-gray-500/20 transition-colors">
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <img src={isDarkMode ? "/images/logo-oscuro.png" : "/images/logo.png"} alt="Seré Notario Logo" className="h-8 w-auto object-contain" />
          </div>
          <UserProfilePopup userProfile={userProfile} />
        </header>

        <div className="p-4 md:p-8 flex-1 flex flex-col max-w-4xl mx-auto w-full">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black mb-2 uppercase tracking-tight flex items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-[#b59348]">emoji_events</span>
                Ranking de Notarios
              </h1>
              <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Compite por el primer lugar completando leyes y módulos.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <span className="material-symbols-outlined animate-spin text-4xl text-[#b59348]">refresh</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pb-20">
              {/* Leaderboard List */}
              <div className={`rounded-2xl border overflow-hidden ${themeClasses.cardBg}`}>
                {topUsers.map((user, index) => {
                  const isCurrent = currentUserRank && currentUserRank.id === user.id;
                  return (
                    <div 
                      key={user.id} 
                      className={`flex items-center gap-4 p-4 md:p-5 border-b last:border-0 transition-colors
                        ${isCurrent ? (isDarkMode ? 'bg-[#b59348]/20' : 'bg-[#b59348]/10') : 'hover:bg-black/5'}
                        ${isDarkMode ? 'border-white/5' : 'border-gray-100'}
                      `}
                    >
                      <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 shrink-0">
                        {index < 3 ? (
                          <span className={`material-symbols-outlined text-3xl md:text-4xl ${getMedalColor(index)}`}>military_tech</span>
                        ) : (
                          <span className={`text-lg md:text-xl font-black ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>#{user.posicion}</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-base md:text-lg truncate ${isCurrent ? 'text-[#b59348]' : ''}`}>
                          {user.nombre} {isCurrent && '(Tú)'}
                        </h3>
                        <div className="flex gap-4 mt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-[#b59348]">menu_book</span>
                            <span className={`text-xs md:text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {user.leyes_completadas} Leyes
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-[#b59348]">check_circle</span>
                            <span className={`text-xs md:text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {user.nodos_pasados} Temas
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Current User Float if not in Top */}
              {!isCurrentUserInTop && currentUserRank && (
                <div className={`mt-4 rounded-2xl border-2 border-[#b59348] p-4 md:p-5 flex items-center gap-4 shadow-[0_0_20px_rgba(181,147,72,0.15)] ${isDarkMode ? 'bg-[#001524]' : 'bg-white'}`}>
                  <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 shrink-0">
                    <span className="text-lg md:text-xl font-black text-[#b59348]">#{currentUserRank.posicion}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base md:text-lg truncate text-[#b59348]">
                      Tú ({currentUserRank.nombre})
                    </h3>
                    <div className="flex gap-4 mt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-[#b59348]">menu_book</span>
                        <span className={`text-xs md:text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {currentUserRank.leyes_completadas} Leyes
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-[#b59348]">check_circle</span>
                        <span className={`text-xs md:text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {currentUserRank.nodos_pasados} Temas
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
