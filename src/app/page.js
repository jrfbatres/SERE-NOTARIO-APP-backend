'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from './ThemeContext';

export default function WelcomePage() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const handleLoginClick = () => {
    router.push('/dashboard');
  };

  const themeClasses = {
    bg: isDarkMode ? "bg-[#001524]" : "bg-[#f8f9ff]",
    text: isDarkMode ? "text-white" : "text-[#002b49]",
    headerBg: isDarkMode ? "bg-[#001524] border-white/10" : "bg-white border-gray-200",
    cardBg: isDarkMode ? "bg-[#002b49]/50 border-white/10" : "bg-white border-gray-200",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-500",
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} transition-colors duration-300 pb-24 font-sans`}>
      {/* TopAppBar */}
      <header className={`fixed top-0 left-0 w-full z-50 flex justify-between items-center px-5 py-3 border-b ${themeClasses.headerBg}`}>
        <div className="flex items-center gap-3">
          <img 
            alt="Seré Notario Logo" 
            className="h-10 w-auto" 
            src={isDarkMode ? "/images/logo-oscuro.png" : "/images/logo.png"} 
          />
          <span className="font-black tracking-tight text-lg leading-none hidden sm:block">
            SERÉ<br /><span className="text-[#b59348]">NOTARIO</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleDarkMode} className="text-gray-500 hover:text-[#b59348] transition-colors">
            <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button onClick={handleLoginClick} className="px-4 py-2 bg-[#b59348] text-[#002b49] font-bold rounded-lg text-sm hover:bg-[#a1813b] transition-colors shadow-sm">
            Iniciar Sesión
          </button>
        </div>
      </header>
      
      <main className="mt-16">
        {/* Hero Section */}
        <section className="px-6 py-10 bg-gradient-to-b from-[#002b49] to-[#001524] text-white text-center rounded-b-3xl shadow-lg border-b border-[#002b49]/30">
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            ¿Estás listo para aprobar<br className="hidden md:block"/> el examen?
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Descúbrelo en 5 minutos con preguntas reales de los exámenes (2018–2025)
          </p>
          <button 
            onClick={handleLoginClick}
            className="w-full max-w-[320px] mx-auto py-4 px-6 bg-[#b59348] text-[#002b49] font-black text-lg rounded-xl hover:scale-105 transition-all shadow-[0_4px_0_0_#765a13] inline-block"
          >
            Comenzar diagnóstico
          </button>
          
          <div className="mt-12 relative mx-auto w-full max-w-[500px] aspect-square rounded-xl overflow-hidden shadow-2xl bg-white border border-[#b59348]/20">
            <img 
              className="w-full h-full object-contain p-2" 
              alt="Seré Notario - Prepárate Hoy, Certifica tu Futuro" 
              src="/images/SereNotario.png"
            />
          </div>
        </section>

        {/* Social Proof Chips */}
        <section className="flex flex-wrap justify-center gap-4 py-8 px-6 border-b border-gray-200/20 max-w-4xl mx-auto">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${themeClasses.cardBg}`}>
            <span className="material-symbols-outlined text-[#b59348]">group</span>
            <span className="text-sm font-bold">+7,000 abogados preparándose</span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${themeClasses.cardBg}`}>
            <span className="material-symbols-outlined text-[#b59348]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-sm font-bold">100% Casos Reales</span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${themeClasses.cardBg}`}>
            <span className="material-symbols-outlined text-[#b59348]">check_circle</span>
            <span className="text-sm font-bold">Inteligencia Artificial</span>
          </div>
        </section>

        {/* Value Proposition Section */}
        <section className="px-6 py-12 space-y-6 max-w-4xl mx-auto">
          <div className={`flex items-start gap-4 p-6 rounded-2xl border ${themeClasses.cardBg} hover:-translate-y-1 transition-transform shadow-sm`}>
            <div className="w-14 h-14 flex-shrink-0 bg-[#002b49]/10 rounded-full flex items-center justify-center text-[#002b49] dark:text-[#b59348] border border-[#002b49]/20 dark:border-[#b59348]/30">
              <span className="material-symbols-outlined text-3xl">analytics</span>
            </div>
            <div>
              <h3 className="text-xl font-black mb-1">Calcula tu probabilidad de aprobar</h3>
              <p className={themeClasses.textSecondary}>Algoritmos predictivos basados en tu desempeño actual con el mapa de calor.</p>
            </div>
          </div>
          <div className={`flex items-start gap-4 p-6 rounded-2xl border ${themeClasses.cardBg} hover:-translate-y-1 transition-transform shadow-sm`}>
            <div className="w-14 h-14 flex-shrink-0 bg-[#002b49]/10 rounded-full flex items-center justify-center text-[#002b49] dark:text-[#b59348] border border-[#002b49]/20 dark:border-[#b59348]/30">
              <span className="material-symbols-outlined text-3xl">assignment_late</span>
            </div>
            <div>
              <h3 className="text-xl font-black mb-1">Identifica tus debilidades por ley</h3>
              <p className={themeClasses.textSecondary}>Análisis detallado de qué códigos necesitas reforzar con base a las preguntas de 2018 a 2025.</p>
            </div>
          </div>
          <div className={`flex items-start gap-4 p-6 rounded-2xl border ${themeClasses.cardBg} hover:-translate-y-1 transition-transform shadow-sm`}>
            <div className="w-14 h-14 flex-shrink-0 bg-[#002b49]/10 rounded-full flex items-center justify-center text-[#002b49] dark:text-[#b59348] border border-[#002b49]/20 dark:border-[#b59348]/30">
              <span className="material-symbols-outlined text-3xl">map</span>
            </div>
            <div>
              <h3 className="text-xl font-black mb-1">Recibe un plan de estudio inteligente</h3>
              <p className={themeClasses.textSecondary}>Rutas personalizadas de 20 y 60 días para optimizar tu tiempo de estudio.</p>
            </div>
          </div>
        </section>

        {/* Differentiator (Modo Voz) */}
        <section className="px-6 py-8 max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-[#002b49] to-[#001524] p-8 rounded-3xl overflow-hidden text-white border-b-4 border-[#001524] shadow-xl">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 z-10 relative">
              <div className="w-20 h-20 bg-[#b59348] rounded-full flex items-center justify-center text-[#002b49] shrink-0 shadow-lg">
                <span className="material-symbols-outlined text-4xl">headphones</span>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-black mb-2 text-[#b59348]">Modo Manos Libres</h3>
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  Estudia mientras manejas o haces otras actividades con nuestro asistente de audio interactivo. La preparación te acompaña a donde vayas.
                </p>
                <button 
                  onClick={handleLoginClick}
                  className="px-8 py-3 bg-white text-[#002b49] font-black rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
                >
                  Probar Modo Voz
                </button>
              </div>
            </div>
            {/* Abstract Design Elements */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#b59348]/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-10 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-16 text-center space-y-8 max-w-2xl mx-auto">
          <h2 className="text-3xl font-black tracking-tight">
            ¿Listo para dar el primer paso hacia tu éxito?
          </h2>
          <button 
            onClick={handleLoginClick}
            className="w-full max-w-[320px] mx-auto py-4 px-6 bg-[#002b49] text-white font-black text-lg uppercase tracking-wider rounded-xl hover:-translate-y-1 transition-all shadow-[0_4px_0_0_#001524] border border-white/10 inline-block"
          >
            Acceder a la Plataforma
          </button>
        </section>
      </main>
    </div>
  );
}
