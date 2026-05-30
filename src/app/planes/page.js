'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '../ThemeContext';

export default function PlanesPage() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const handleClose = () => {
    router.push('/');
  };

  const themeClasses = {
    bg: isDarkMode ? "bg-[#001524]" : "bg-[#f8f9ff]",
    textPrimary: isDarkMode ? "text-white" : "text-[#002b49]",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-500",
    headerBg: isDarkMode ? "bg-[#001524]/90 border-white/10" : "bg-white border-gray-200/80",
    headerLogoText: isDarkMode ? "text-white" : "text-[#002b49]",
    cardBg: isDarkMode ? "bg-[#002b49]/50 border-white/10" : "bg-white border-gray-200",
    cardText: isDarkMode ? "text-white" : "text-gray-800",
    cardTextSecondary: isDarkMode ? "text-gray-300" : "text-gray-600",
    cardBorder: isDarkMode ? "border-white/20" : "border-[#002b49]/20",
    buttonBg: isDarkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-100 hover:bg-gray-200 text-[#002b49]",
  };

  return (
    <div className={`min-h-screen flex flex-col ${themeClasses.bg} transition-colors duration-300 overflow-y-auto`}>
      {/* Header */}
      <header className={`h-24 shrink-0 flex justify-between items-center px-6 shadow-sm sticky top-0 z-50 backdrop-blur-md border-b ${themeClasses.headerBg} transition-colors duration-300`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleClose} 
            className="material-symbols-outlined text-gray-400 hover:text-[#b59348] transition-colors cursor-pointer"
          >
            arrow_back
          </button>
          
          <img 
            src={isDarkMode ? "/images/logo-oscuro.png" : "/images/logo.png"} 
            alt="Logo" 
            className="h-16 w-auto object-contain bg-white/5 p-0.5 rounded" 
            onError={(e) => e.currentTarget.style.display = 'none'}
          />

          <div className="flex flex-col text-left">
            <span className="font-black text-[44px] leading-tight">
              <span className={themeClasses.headerLogoText}>SERÉ</span> <span className="text-[#b59348]">NOTARIO</span>
            </span>
            <span className="text-[10px] text-gray-400 leading-none">Excelencia en Gestión Legal</span>
          </div>
        </div>
        
        <div>
          <button 
            onClick={toggleDarkMode}
            className={`material-symbols-outlined transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#002b49]'}`}
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center p-6 lg:p-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className={`text-3xl md:text-4xl font-black mb-4 ${themeClasses.textPrimary}`}>
            Elige tu Plan de Estudio
          </h1>
          <p className={`text-sm md:text-base leading-relaxed ${themeClasses.textSecondary}`}>
            Obtén acceso a la plataforma más avanzada para preparar tu examen de notariado. Selecciona el plan que mejor se adapte a tu ritmo de estudio.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto items-stretch">
          
          {/* Plan Mensual Básico */}
          <div className={`${themeClasses.cardBg} rounded-3xl p-8 border shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md`}>
            <span className={`${themeClasses.textPrimary} text-xs font-black uppercase tracking-widest mb-2 block`}>Básico</span>
            <h2 className={`text-xl font-bold mb-6 ${themeClasses.cardText}`}>Mensual</h2>
            <div className="mb-8">
              <span className={`text-4xl font-black ${themeClasses.textPrimary}`}>$15</span>
              <span className={`${themeClasses.textSecondary} text-sm font-medium`}> / mes</span>
            </div>
            <ul className={`text-sm ${themeClasses.cardTextSecondary} text-left w-full space-y-4 mb-8 flex-1`}>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">check_circle</span>
                <span>Acceso al simulador y métricas básicas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">check_circle</span>
                <span>Progresión estructurada de módulos</span>
              </li>
            </ul>
            <button className={`w-full py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-colors cursor-pointer ${themeClasses.buttonBg}`}>
              Seleccionar Plan
            </button>
          </div>

          {/* Plan 6 Meses Básico */}
          <div className={`${themeClasses.cardBg} rounded-3xl p-8 border shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md`}>
            <span className={`${themeClasses.textPrimary} text-xs font-black uppercase tracking-widest mb-2 block`}>Básico</span>
            <h2 className={`text-xl font-bold mb-6 ${themeClasses.cardText}`}>6 Meses</h2>
            <div className="mb-8">
              <span className={`text-4xl font-black ${themeClasses.textPrimary}`}>$50</span>
              <span className={`${themeClasses.textSecondary} text-sm font-medium`}> / semestre</span>
            </div>
            <ul className={`text-sm ${themeClasses.cardTextSecondary} text-left w-full space-y-4 mb-8 flex-1`}>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">check_circle</span>
                <span>Acceso al simulador y métricas básicas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">check_circle</span>
                <span>Progresión estructurada de módulos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">star</span>
                <span className="font-bold text-[#b59348]">Ahorro del 44%</span>
              </li>
            </ul>
            <button className={`w-full py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-colors cursor-pointer ${themeClasses.buttonBg}`}>
              Seleccionar Plan
            </button>
          </div>

          {/* Plan Plus Mensual (Highlighted) */}
          <div className={`bg-[#002b49] rounded-3xl p-8 border ${isDarkMode ? 'border-white/20' : 'border-[#001c30]'} shadow-xl flex flex-col items-center text-center transform lg:-translate-y-4 relative`}>
            <div className="absolute -top-4 bg-[#b59348] text-[#002b49] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
              Recomendado
            </div>
            <span className="text-[#b59348] text-xs font-black uppercase tracking-widest mb-2 block mt-2">Plus</span>
            <h2 className="text-xl font-bold text-white mb-6">Mensual</h2>
            <div className="mb-8">
              <span className="text-4xl font-black text-white">$20</span>
              <span className="text-white/60 text-sm font-medium"> / mes</span>
            </div>
            <ul className="text-sm text-white/90 text-left w-full space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">check_circle</span>
                <span>Acceso ilimitado a simuladores y estudio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">lock_open</span>
                <span className="font-bold text-[#b59348]">Todos los módulos desbloqueados al instante</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">mic</span>
                <span>Modo Manos Libres premium</span>
              </li>
            </ul>
            <button className="w-full py-3 bg-[#b59348] hover:bg-[#a1813b] text-[#002b49] rounded-xl font-black uppercase tracking-wider text-xs shadow-md transition-colors cursor-pointer">
              Obtener Plus
            </button>
          </div>

          {/* Plan Plus 6 Meses */}
          <div className={`${themeClasses.cardBg} rounded-3xl p-8 border-2 ${themeClasses.cardBorder} shadow-lg flex flex-col items-center text-center transition-all hover:shadow-xl relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 ${isDarkMode ? 'bg-[#b59348] text-[#002b49]' : 'bg-[#002b49] text-white'} text-[10px] font-black uppercase tracking-widest px-8 py-1.5 transform translate-x-[30%] translate-y-[50%] rotate-45 w-32 text-center shadow-sm`}>
              Premium
            </div>
            <span className={`${isDarkMode ? 'text-[#b59348]' : 'text-[#002b49]'} text-xs font-black uppercase tracking-widest mb-2 block`}>Plus</span>
            <h2 className={`text-xl font-bold mb-6 ${themeClasses.cardText}`}>6 Meses</h2>
            <div className="mb-8">
              <span className={`text-4xl font-black ${themeClasses.textPrimary}`}>$80</span>
              <span className={`${themeClasses.textSecondary} text-sm font-medium`}> / semestre</span>
            </div>
            <ul className={`text-sm ${themeClasses.cardTextSecondary} text-left w-full space-y-4 mb-8 flex-1`}>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">check_circle</span>
                <span>Acceso ilimitado a la plataforma</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">lock_open</span>
                <span className={`font-bold ${themeClasses.textPrimary}`}>Todos los módulos desbloqueados al instante</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">star</span>
                <span className="font-bold text-[#b59348]">Ahorro del 33% vs Plus Mensual</span>
              </li>
            </ul>
            <button className={`w-full py-3 ${isDarkMode ? 'bg-white hover:bg-gray-200 text-[#002b49]' : 'bg-[#002b49] hover:bg-[#001c30] text-white'} rounded-xl font-black uppercase tracking-wider text-xs shadow-md transition-colors cursor-pointer`}>
              Mejor Valor
            </button>
          </div>

        </div>
        
        {/* Payment Footer / Trust symbols */}
        <div className="mt-16 flex flex-col items-center opacity-60">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Pagos 100% Seguros</p>
          <div className="flex items-center gap-6 text-gray-400">
            <span className="material-symbols-outlined text-3xl">credit_card</span>
            <span className="material-symbols-outlined text-3xl">lock</span>
            <span className="material-symbols-outlined text-3xl">verified_user</span>
          </div>
        </div>
      </main>
    </div>
  );
}
