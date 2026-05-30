'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

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
          <span className="text-sm font-black text-gold-brand">{data.value}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomTreemapContent = (props) => {
  const { x, y, width, height, value, name, id, onClick } = props;

  const getFillColor = (val) => {
    if (val >= 15) return '#001629'; // Crítico (Navy Dark)
    if (val >= 10) return '#002b49'; // Alto (Navy Brand)
    if (val >= 5) return '#765a13';  // Medio (Gold Metallic)
    if (val >= 2) return '#b59348';  // Accent Gold (Medium-Low)
    if (val >= 0.9) return '#e5d7b3'; // Intermedio Bajo (Light Gold)
    return '#eff4ff';              // Muy Bajo (Light Slate/Blue)
  };

  const isDarkColor = (val) => {
    return val >= 5; // True for dark navy and gold metallic, false for light gold and slate
  };

  const fillColor = getFillColor(value);
  const darkTheme = isDarkColor(value);
  const textColor = darkTheme ? 'text-white' : 'text-navy-brand';
  const textMutedColor = darkTheme ? 'text-white/60' : 'text-navy-brand/60';

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

import { useTheme } from './ThemeContext';

export default function DashboardPage() {
  const [leyes, setLeyes] = useState([]);
  const [globalGrade, setGlobalGrade] = useState(null);
  const [lastGrade, setLastGrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { isDarkMode, toggleDarkMode } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);

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
    // Check auth
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

    // Fetch heatmap and global score in parallel
    Promise.all([
      fetchWithAuthCheck('/api/dashboard/heatmap'),
      fetchWithAuthCheck('/api/usuario/nota-global')
    ])
      .then(([heatmapData, gradeData]) => {
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
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [router]);

  const goToStudy = (leyId) => {
    router.push(`/estudio/${leyId}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-headline-md text-navy-brand">Cargando Mapa de Calor...</div>;

  const themeClasses = {
    bg: isDarkMode ? "bg-[#001524]" : "bg-[#f8f9ff]",
    text: isDarkMode ? "text-white" : "text-[#002b49]",
    headerBg: isDarkMode ? "bg-[#001524]/90 border-white/10" : "bg-white/90 border-gray-200/80 shadow-sm",
    headerLogoText: isDarkMode ? "text-white" : "text-navy-brand",
    buttonBg: isDarkMode ? "bg-white/10 hover:bg-white/20 text-white border-white/10" : "bg-gray-100 hover:bg-gray-200 text-[#002b49] border-gray-200",
    carouselText: isDarkMode ? "text-gray-300" : "text-on-surface-variant",
    carouselDots: isDarkMode ? "bg-white/20 hover:bg-white/40" : "bg-gray-300 hover:bg-gray-400",
    chartContainer: isDarkMode ? "bg-[#002b49]/50 border-white/5" : "bg-white border-gray-200 shadow-sm",
    chartStroke: isDarkMode ? "#001524" : "#fff"
  };

  return (
    <div className={`min-h-screen flex flex-col font-body-md ${themeClasses.bg} ${themeClasses.text} transition-colors duration-300`}>
      {/* TopAppBar */}
      <header className={`fixed top-0 w-full z-50 backdrop-blur-xl border-b flex justify-between items-center px-gutter py-3 ${themeClasses.headerBg} transition-colors duration-300`}>
        <div className="flex items-center gap-3">
          <img
            src={isDarkMode ? "/images/logo-oscuro.png" : "/images/logo.png"}
            alt="Seré Notario Logo"
            className="h-16 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="text-[32px] md:text-[40px] font-bold leading-none hidden lg:block">
            <span className={themeClasses.headerLogoText}>SERÉ</span> <span className="text-gold-brand">NOTARIO</span>
          </span>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          
          {/* Top Bar Buttons (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 mr-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${themeClasses.buttonBg}`}>
              <span className="material-symbols-outlined text-[#b59348] text-[20px] font-bold">history</span>
              <div className="flex flex-col text-left">
                <span className="text-[8px] uppercase tracking-wider font-black opacity-70 leading-none mb-0.5">Última Nota</span>
                <span className="text-sm font-black leading-none">
                  {lastGrade !== null && lastGrade !== undefined ? `${lastGrade.toFixed(2)} / 10` : '--'}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/simulador/simulacro')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all active:scale-[0.98] cursor-pointer text-[11px] uppercase tracking-wider border ${themeClasses.buttonBg}`}
            >
              <span className="material-symbols-outlined text-[16px] font-bold">assignment</span>
              <span>Simulacro General</span>
            </button>
            <button
              onClick={() => router.push('/manos-libres')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#001524] to-[#002b49] text-white border-2 border-[#b59348] hover:border-[#e5d7b3] rounded-xl font-black shadow-[0_0_15px_rgba(181,147,72,0.4)] hover:shadow-[0_0_25px_rgba(181,147,72,0.6)] transition-all duration-300 active:scale-[0.98] cursor-pointer text-[12px] uppercase tracking-widest relative overflow-hidden group animate-[pulse_3s_ease-in-out_infinite]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#b59348]/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
              <span className="material-symbols-outlined text-[18px] text-[#b59348] group-hover:text-[#e5d7b3] transition-colors drop-shadow-md">headphones</span>
              <span>Modo Manos Libres</span>
            </button>
            
            <button
              onClick={() => router.push('/planes')}
              className="flex items-center gap-2 px-4 py-2 bg-[#b59348] hover:bg-[#a1813b] text-[#002b49] rounded-xl font-black shadow hover:shadow-md transition-all active:scale-[0.98] cursor-pointer text-[11px] uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[16px] font-bold">credit_card</span>
              <span>Planes de Pago</span>
            </button>
          </div>

          <button 
            onClick={toggleDarkMode}
            className={`material-symbols-outlined transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-navy-brand'}`}
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </button>
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border overflow-hidden flex items-center justify-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
            <span className={`material-symbols-outlined ${isDarkMode ? 'text-white' : 'text-[#002b49]'}`}>person</span>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('token'); router.push('/login'); }} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border hover:bg-red-500/20 hover:text-red-500 transition-all font-bold text-xs uppercase tracking-wider ${isDarkMode ? 'border-white/10 text-gray-400' : 'border-gray-200 text-gray-500'}`}
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mt-24 p-gutter flex-1 flex flex-col gap-4 max-w-7xl mx-auto w-full">
        
        {/* Carousel Content */}
        <section className="flex flex-col text-left pt-0 min-h-[50px] justify-center relative w-full lg:w-2/3 mx-auto text-center">
          <div className="transition-opacity duration-500 ease-in-out">
            <h1 className="text-[14px] md:text-[17px] font-bold mb-1 leading-tight">
              {carouselSlides[currentSlide].title}
            </h1>
            <p className={`text-[11px] md:text-[12px] w-full leading-tight ${themeClasses.carouselText}`}>
              {carouselSlides[currentSlide].text}
            </p>
          </div>
          {/* Carousel Indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
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

        {/* Heat Map Treemap Graphic - Full Width */}
        <section className={`${themeClasses.chartContainer} rounded-3xl p-5 flex flex-col items-center justify-center w-full transition-colors duration-300 mt-2`}>
          <div className="h-[55vh] min-h-[300px] w-full">
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

        {/* Mobile Action Buttons */}
        <div className="flex lg:hidden flex-col gap-3 w-full mt-2 pb-6">
          <button
            onClick={() => router.push('/manos-libres')}
            className="w-full flex items-center justify-center gap-3 px-5 py-5 bg-gradient-to-r from-[#001524] to-[#002b49] text-white border-2 border-[#b59348] hover:border-[#e5d7b3] rounded-2xl font-black shadow-[0_0_15px_rgba(181,147,72,0.4)] hover:shadow-[0_0_25px_rgba(181,147,72,0.6)] transition-all duration-300 active:scale-[0.98] cursor-pointer text-[14px] uppercase tracking-widest relative overflow-hidden group animate-[pulse_3s_ease-in-out_infinite]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#b59348]/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
            <span className="material-symbols-outlined text-[24px] text-[#b59348] group-hover:text-[#e5d7b3] transition-colors drop-shadow-md">headphones</span>
            <span>Modo Manos Libres</span>
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => router.push('/simulador/simulacro')}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-bold border transition-all active:scale-[0.98] cursor-pointer text-[12px] uppercase tracking-wider ${themeClasses.buttonBg}`}
            >
              <span className="material-symbols-outlined text-[18px]">assignment</span>
              <span>Simulacro General</span>
            </button>
            <button
              onClick={() => router.push('/planes')}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-4 bg-[#b59348] hover:bg-[#a1813b] text-[#002b49] rounded-xl font-black shadow transition-all active:scale-[0.98] cursor-pointer text-[12px] uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[18px]">credit_card</span>
              <span>Planes de Pago</span>
            </button>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="w-full text-center mt-6 mb-8 px-4 opacity-50">
          <p className="text-[10px] md:text-xs uppercase tracking-wider font-bold">
            Nota: Las preguntas y las respuestas han sido sacadas de los exámenes de notariado y cuestionarios publicados por la <span className="font-black">CORTE SUPREMA DE JUSTICIA</span>.
          </p>
        </div>
      </main>
    </div>
  );
}
