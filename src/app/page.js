'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from './ThemeContext';
import UserProfilePopup from '../components/UserProfilePopup';
import InvitationModal from '../components/InvitationModal';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#002b49] text-white p-3.5 rounded-xl border border-[#b59348]/40 shadow-2xl w-64 md:w-80 backdrop-blur-md bg-opacity-95 text-left">
        <p className="font-bold text-[13px] leading-relaxed mb-2 whitespace-normal break-words">
          {data.name}
        </p>
        <div className="flex items-center justify-between border-t border-white/10 pt-2 mt-1">
          <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Porcentaje</span>
          <span className="text-sm font-black text-[#b59348]">{data.value}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomTreemapContent = (props) => {
  const { x, y, width, height, value, name, id, onClick } = props;

  const getFillColor = (val) => {
    if (val >= 15) return '#001629'; 
    if (val >= 10) return '#002b49'; 
    if (val >= 5) return '#765a13';  
    if (val >= 2) return '#b59348';  
    if (val >= 0.9) return '#e5d7b3'; 
    return '#eff4ff';              
  };

  const isDarkColor = (val) => {
    return val >= 5; 
  };

  const fillColor = getFillColor(value);
  const darkTheme = isDarkColor(value);
  const textColor = darkTheme ? 'text-white' : 'text-[#002b49]';
  const textMutedColor = darkTheme ? 'text-white/60' : 'text-[#002b49]/60';

  if (width < 25 || height < 15) return null;

  return (
    <g 
      onClick={() => onClick && onClick(id)}
      className="cursor-pointer"
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        ry={6}
        style={{
          fill: fillColor,
          stroke: 'rgba(255,255,255,0.7)',
          strokeWidth: 1.5,
        }}
        className="transition-all duration-300 hover:brightness-[1.05] hover:shadow-md"
      />
      <foreignObject x={x + 4} y={y + 4} width={width - 8} height={height - 8}>
        <div
          className={`flex flex-col h-full ${textColor} pointer-events-none select-none overflow-hidden justify-between p-1.5`}
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          <p
            className="font-bold leading-tight"
            style={{
              fontSize: width > 140 ? '14px' : (width > 85 ? '11.5px' : '9.5px'),
              display: '-webkit-box',
              WebkitLineClamp: height > 45 ? 2 : 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {name}
          </p>

          {width > 40 && height > 24 && (
            <div className="flex items-baseline gap-0.5 justify-end mt-auto">
              <span className={`font-black leading-none ${textColor} ${width > 150 ? 'text-2xl' : (width > 90 ? 'text-lg' : 'text-xs')}`}>
                {value}%
              </span>
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
};

export default function DashboardPage() {
  const [leyes, setLeyes] = useState([]);
  const [globalGrade, setGlobalGrade] = useState(null);
  const [lastGrade, setLastGrade] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const router = useRouter();

  const { isDarkMode, toggleDarkMode } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const carouselSlides = [
    {
      title: "De 2,500 Instrumentos Legales, Solo 8 Representan el 70% del Examen de Notariado",
      text: "Cargamos los Exámenes y Cuestionarios de 2018–2025 y Creamos un Mapa de Importancia de Qué Debes Estudiar."
    },
    {
      title: "La suerte es lo que sucede cuando la preparación se encuentra con la oportunidad.",
      text: "La oportunidad solo se da una vez al año, ahora solo falta que te prepares, todo depende de ti."
    },
    {
      title: "NO TENGO tiempo, NO TENGO suerte o NO TENGO... excusas. La verdad NO ES TU PRIORIDAD",
      text: "La suerte no se levanta temprano, no da el máximo en lo que hace, no se desvela ni busca las oportunidades. NO ES SUERTE, SON MUCHAS GANAS DE SALIR ADELANTE."
    },
    {
      title: "Hemos creado un manos libres para que aproveches cada minuto y practiques mientras conduces.",
      text: "No dejes pasar otro año, estudia, esfuérzate. ¿Cuál es el costo de no ser notario? ¿Cuánto has dejado de ganar? El sacrificio de hoy es la recompensa del mañana."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

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
      fetchWithAuthCheck('/api/dashboard/heatmap'),
      fetchWithAuthCheck('/api/usuario/nota-global'),
      fetchWithAuthCheck('/api/usuario/perfil')
    ])
      .then(([heatmapData, gradeData, profileData]) => {
        if (heatmapData.success) {
          const formatted = (heatmapData.data || []).map(item => ({
            name: item.nombre || 'Sin nombre',
            value: parseFloat(item.porcentaje_preguntas) || 0,
            id: item.id
          }));
          setLeyes(formatted);
        }
        if (gradeData.success) {
          setGlobalGrade(gradeData.nota_global);
          setLastGrade(gradeData.nota_ultima);
        }
        if (profileData && profileData.success) {
          setUserProfile(profileData.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [router]);

  const goToStudy = (leyId) => {
    if (userProfile && userProfile.rol === 'DEMO') {
      const selectedLey = leyes.find(l => l.id === leyId);
      if (!selectedLey || !selectedLey.name.toUpperCase().includes('CÓDIGO CIVIL')) {
        setToast("Acceso Limitado. Como usuario DEMO, tu acceso está restringido al Código Civil. Actualiza tu plan para liberar todo el contenido.");
        setTimeout(() => setToast(null), 5000);
        return;
      }
    }
    router.push(`/estudio/${leyId}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-headline-md text-[#002b49]">Cargando Mapa de Calor...</div>;

  const themeClasses = {
    bg: isDarkMode ? "bg-[#001524]" : "bg-[#f8f9ff]",
    text: isDarkMode ? "text-white" : "text-[#002b49]",
    sidebarBg: isDarkMode ? "bg-[#001524]/95 border-white/10" : "bg-white/95 border-gray-200 shadow-xl",
    menuItemHover: isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-100",
    buttonBg: isDarkMode ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200",
    carouselText: isDarkMode ? "text-gray-300" : "text-gray-600",
    carouselDots: isDarkMode ? "bg-white/20 hover:bg-white/40" : "bg-gray-300 hover:bg-gray-400",
    chartContainer: isDarkMode ? "bg-[#002b49]/50 border-white/5" : "bg-white border-gray-200 shadow-sm",
    chartStroke: isDarkMode ? "#001524" : "#fff"
  };

  return (
    <div className={`min-h-screen flex font-body-md ${themeClasses.bg} ${themeClasses.text} transition-colors duration-300 overflow-hidden`}>
      
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#001524] text-white px-6 py-4 rounded-xl shadow-2xl z-[100] animate-in fade-in slide-in-from-top-4 font-bold text-center min-w-[320px] max-w-[90vw] md:max-w-md border border-[#b59348]">
          <span className="material-symbols-outlined text-[#b59348] text-3xl mb-2 block">lock</span>
          {toast}
        </div>
      )}

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

        {/* User Profile - Placed outside scrollable nav to prevent clipping */}
        <div className="hidden lg:flex justify-center pt-6 pb-2">
          <UserProfilePopup userProfile={userProfile} position="right" />
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          
          <button
            onClick={() => router.push('/simulador/simulacro')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider ${themeClasses.menuItemHover}`}
          >
            <span className="material-symbols-outlined text-[20px] text-[#b59348]">assignment</span>
            <span className="flex-1 text-left">Simulacro General</span>
          </button>
          
          <button
            onClick={() => router.push('/manos-libres')}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-[#001524] to-[#002b49] text-white rounded-xl font-black shadow-[0_0_15px_rgba(181,147,72,0.3)] transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider relative overflow-hidden group border border-[#b59348]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#b59348]/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
            <span className="material-symbols-outlined text-[20px] text-[#b59348] group-hover:text-[#e5d7b3]">headphones</span>
            <span className="flex-1 text-left">Manos Libres</span>
          </button>

          <button
            onClick={() => router.push('/estadistica')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider ${themeClasses.menuItemHover}`}
          >
            <span className="material-symbols-outlined text-[20px] text-[#b59348]">bar_chart</span>
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

          {['Fundador', 'Administrador'].includes(userProfile?.rol) && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98] text-[13px] uppercase tracking-wider text-white shadow-lg bg-gradient-to-r from-[#b59348] to-[#9c7a36] hover:brightness-110`}
            >
              <span className="material-symbols-outlined text-[20px]">group_add</span>
              <span className="flex-1 text-left">Invitar Colega</span>
            </button>
          )}

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

        {/* Footer Area (User, Dark Mode, Last Grade) */}
        <div className={`p-5 border-t border-opacity-10 space-y-4 ${isDarkMode ? 'border-white' : 'border-gray-200'}`}>
          
          {/* Last Grade Display */}
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
        
        {/* Mobile Header (Hidden on Desktop) */}
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

        <div className="p-4 md:p-8 flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full">
          
          {/* Carousel */}
          <section className="flex flex-col text-left justify-center relative w-full lg:w-3/4 mx-auto text-center mt-2">
            <div className="transition-opacity duration-500 ease-in-out min-h-[60px] md:min-h-[70px]">
              <h1 className="text-[15px] md:text-[18px] font-bold mb-1.5 leading-tight">
                {carouselSlides[currentSlide].title}
              </h1>
              <p className={`text-[12px] md:text-[13px] w-full leading-tight ${themeClasses.carouselText}`}>
                {carouselSlides[currentSlide].text}
              </p>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {carouselSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentSlide ? 'w-6 bg-[#b59348]' : `w-2 ${themeClasses.carouselDots}`
                  }`}
                  aria-label={`Ir al mensaje ${idx + 1}`}
                />
              ))}
            </div>
          </section>

          {/* Treemap */}
          <div className="w-full flex justify-center mb-[-12px] z-10 relative pointer-events-none">
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm border ${isDarkMode ? 'bg-[#001524] text-yellow-400 border-yellow-400/30' : 'bg-white text-[#b59348] border-[#b59348]/30'}`}>
              <span className="material-symbols-outlined text-[16px]">ads_click</span>
              Haz clic en una ley para empezar a estudiar
            </div>
          </div>
          <section className={`${themeClasses.chartContainer} rounded-3xl p-5 pt-8 flex flex-col items-center justify-center w-full transition-colors duration-300 flex-1 min-h-[400px]`}>
            <div className="h-full w-full">
              {leyes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    key={`treemap-${isDarkMode}-${JSON.stringify(leyes.map(l => l.id))}`}
                    data={leyes}
                    dataKey="value"
                    aspectRatio={16 / 9}
                    stroke={themeClasses.chartStroke}
                    isAnimationActive={false}
                    content={<CustomTreemapContent onClick={goToStudy} />}
                  >
                    <Tooltip content={<CustomTooltip />} />
                  </Treemap>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 font-medium">
                  No hay leyes marcadas para estudio.
                </div>
              )}
            </div>
          </section>

          {/* Footer Disclaimer */}
          <div className="w-full text-center mt-auto pb-4 opacity-50">
            <p className="text-[10px] md:text-xs uppercase tracking-wider font-bold">
              Nota: Las preguntas y respuestas son extraídas de los exámenes publicados por la <span className="font-black">CORTE SUPREMA DE JUSTICIA</span>.
            </p>
          </div>

        </div>
      </main>

      <InvitationModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        onInvitationSent={() => {
          setToast("¡Invitación enviada con éxito!");
          setTimeout(() => setToast(null), 5000);
        }}
      />
    </div>
  );
}
