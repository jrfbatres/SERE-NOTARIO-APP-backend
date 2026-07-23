'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../ThemeContext';

export default function PlanesPage() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Estado de carga por plan (para mostrar spinner en el botón)
  const [loadingPlan, setLoadingPlan] = useState(null);
  
  // Estado para el modal de historial
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Estado para el temario día a día
  const [selectedSchedule, setSelectedSchedule] = useState('lite');

  const handleClose = () => {
    router.push('/');
  };

  const planes = {
    lite_mensual: { monto: 5, nombreProducto: "Plan Lite Mensual", mesesDuracion: 1 },
    profundo_mensual: { monto: 10, nombreProducto: "Plan Profundo 3 Meses", mesesDuracion: 3 },
    completo_mensual: { monto: 15, nombreProducto: "Plan Completo 3 Meses", mesesDuracion: 3 }
  };

  const handleSelectPlan = async (planKey) => {
    const selectedPlan = planes[planKey];
    setLoadingPlan(planKey);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No estás autenticado. Por favor, inicia sesión.');
        setLoadingPlan(null);
        return;
      }

      // Crear siempre uno nuevo sin verificar pendientes
      const createRes = await fetch('/api/pagos/wompi/enlace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          monto: selectedPlan.monto,
          nombreProducto: selectedPlan.nombreProducto,
          mesesDuracion: selectedPlan.mesesDuracion,
          descripcionProducto: `Suscripción a SERE NOTARIO - ${selectedPlan.nombreProducto}`,
          urlRedirect: window.location.origin + '/api/pagos/wompi/retorno'
        })
      });

      const createData = await createRes.json();
      
      if (!createRes.ok) {
        throw new Error(createData.error || 'Error al generar enlace de pago');
      }

      // Redirigir directo a wompi
      window.location.href = createData.urlEnlace;

    } catch (error) {
      console.error('Error procesando pago:', error);
      alert(error.message || 'Ocurrió un error inesperado al procesar el pago.');
      setLoadingPlan(null);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/pagos/wompi/historial', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.historial) {
        setHistoryData(data.historial);
      }
    } catch (error) {
      console.error("Error cargando historial", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSyncPayments = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/pagos/wompi/sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok && data.actualizados > 0) {
        alert(`¡Se han sincronizado ${data.actualizados} pago(s) exitosamente!`);
      } else if (res.ok) {
        // No alert if 0 to keep it quiet or subtle toast
      }
      
      // Recargar historial
      await fetchHistory();
    } catch (error) {
      console.error("Error sincronizando pagos", error);
    } finally {
      setSyncing(false);
    }
  };

  const openHistory = () => {
    setShowHistory(true);
    fetchHistory();
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

  const liteDays = [
    { dia: 1, ley: "Código Civil", temas: "Código Civil, Obligaciones y Contratos (Parte 1)" },
    { dia: 2, ley: "Código Civil", temas: "Obligaciones y Contratos (Parte 2)" },
    { dia: 3, ley: "Código Civil", temas: "Obligaciones y Contratos (Parte 3)" },
    { dia: 4, ley: "Código Civil", temas: "Obligaciones y Contratos (Parte 4)" },
    { dia: 5, ley: "Código Civil", temas: "Obligaciones y Contratos (Parte 5)" },
    { dia: 6, ley: "Código Civil", temas: "Obligaciones y Contratos (Parte 6), De las Personas (Parte 1)" },
    { dia: 7, ley: "Código Civil", temas: "De las Personas (Parte 2), Los Bienes (Parte 1)" },
    { dia: 8, ley: "Código Civil", temas: "Los Bienes (Parte 2)" },
    { dia: 9, ley: "Código Civil", temas: "Los Bienes (Parte 3), Sucesiones y Donaciones (Parte 1)" },
    { dia: 10, ley: "Código Civil", temas: "Sucesiones y Donaciones (Parte 2), Título Preliminar: La Ley (Parte 1)" },
    { dia: 11, ley: "Cód. Civil y Comercio", temas: "La Ley (Parte 2), Código de Comercio (Parte 1)" },
    { dia: 12, ley: "Código de Comercio", temas: "Código de Comercio (Parte 2), Modificaciones, Fusión y Terminación (Parte 1)" },
    { dia: 13, ley: "Cód. Comercio y Familia", temas: "Modificaciones y Fusión (Parte 2), Código de Familia (Parte 1)" },
    { dia: 14, ley: "Código de Familia", temas: "Código de Familia (Parte 2)" },
    { dia: 15, ley: "Código de Familia", temas: "Código de Familia (Parte 3)" },
    { dia: 16, ley: "Cód. Familia y Ley Notariado", temas: "Código de Familia (Parte 4), Ley de Notariado (Protocolo, Escritura Matriz, Impedimentos)" },
    { dia: 17, ley: "Ley Notariado y Jurisd. Vol.", temas: "Servicio Exterior, Testimonios, Ley de Jurisdicción Voluntaria (Parte 1)" },
    { dia: 18, ley: "Ley de Jurisdicción Voluntaria", temas: "Ley de Jurisdicción Voluntaria (Parte 2)" },
    { dia: 19, ley: "Ley de Jurisdicción Voluntaria", temas: "Ley de Jurisdicción Voluntaria (Parte 3)" },
    { dia: 20, ley: "Ley de Jurisdicción Voluntaria", temas: "Ley de Jurisdicción Voluntaria (Parte 4)" }
  ];

  const profundoDays = [
    { dia: "1-5", ley: "Código Civil", temas: "Obligaciones y Contratos (Estudio exhaustivo, Teoría General y Práctica)" },
    { dia: "6-10", ley: "Código Civil", temas: "Bienes, Dominio, Ocupación, Servidumbres, Posesión y Modos de Adquirir" },
    { dia: "11-15", ley: "Código Civil", temas: "Sucesiones por Causa de Muerte, Apertura y Delación, Testamento y Requisitos" },
    { dia: "16-20", ley: "Código Civil", temas: "Asignaciones Forzosas, Compraventa y Mandato en profundidad" },
    { dia: "21-25", ley: "Código Civil", temas: "Teoría del Pago, Extinción de las Obligaciones y Prescripciones" },
    { dia: "26-29", ley: "Código Civil", temas: "Acción de Partición, Hipoteca, Prenda y Contratos de Garantía" },
    { dia: "30-33", ley: "Código de Comercio", temas: "Comerciantes Sociales, Modificaciones, Fusiones y Títulos Valores" },
    { dia: "34-36", ley: "Código de Comercio", temas: "Obligaciones Mercantiles, Contratos y Operaciones de Crédito" },
    { dia: "37-40", ley: "Código de Familia", temas: "Matrimonio, Regímenes Patrimoniales, Divorcio y Filiación" },
    { dia: "41-43", ley: "Código de Familia", temas: "Adopción, Alimentos, Tutela y Violencia Intrafamiliar" },
    { dia: "44-47", ley: "Ley de Notariado", temas: "Función Pública del Notariado, Requisitos, Protocolo e Instrumentos" },
    { dia: "48-51", ley: "Ley de Notariado", temas: "Escritura Matriz, Testimonios, Responsabilidad del Notario y Sanciones" },
    { dia: "52-55", ley: "Jurisdicción Voluntaria", temas: "Diligencias de Aceptación de Herencia, Títulos Supletorios y Deslindes" },
    { dia: "56-58", ley: "Jurisdicción Voluntaria", temas: "Identidad de Personas, Rectificaciones de Partidas y Otras Diligencias" },
    { dia: "59-60", ley: "Leyes Especiales y Repaso", temas: "Repaso General de Casos Complejos y Nivel Trampa de todos los Módulos" }
  ];

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
        
        <div className="flex items-center gap-4">
          <button 
            onClick={openHistory}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-[#002b49]'}`}
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            Historia de Pagos
          </button>
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
      <main className="flex-1 flex flex-col items-center p-6 lg:p-12 relative">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className={`text-3xl md:text-4xl font-black mb-4 ${themeClasses.textPrimary}`}>
            Elige tu Plan de Estudio
          </h1>
          <p className={`text-sm md:text-base leading-relaxed ${themeClasses.textSecondary}`}>
            Obtén acceso a la plataforma más avanzada para preparar tu examen de notariado. Selecciona el plan que mejor se adapte a tu ritmo de estudio.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto items-stretch">
          
          {/* Plan Lite */}
          <div className={`${themeClasses.cardBg} rounded-3xl p-8 border shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md hover:scale-[1.01]`}>
            <span className={`${themeClasses.textPrimary} text-xs font-black uppercase tracking-widest mb-2 block`}>Lite / Express</span>
            <h2 className={`text-xl font-bold mb-6 ${themeClasses.cardText}`}>Plan 20 Días</h2>
            <div className="mb-8">
              <span className={`text-4xl font-black ${themeClasses.textPrimary}`}>$5</span>
              <span className={`${themeClasses.textSecondary} text-sm font-medium`}> / mes</span>
            </div>
            <ul className={`text-sm ${themeClasses.cardTextSecondary} text-left w-full space-y-4 mb-8 flex-1`}>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">calendar_today</span>
                <span>Pensum estructurado para <strong>20 días</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">schedule</span>
                <span>Estudio diario de <strong>30 minutos</strong> (Lunes a Viernes)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">grade</span>
                <span>Enfoque en los nodos y temas principales (Niveles 0 y 1)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">bar_chart</span>
                <span>Métricas de progreso por día</span>
              </li>
            </ul>
            <button 
              onClick={() => handleSelectPlan('lite_mensual')}
              disabled={loadingPlan === 'lite_mensual'}
              className={`w-full py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 ${loadingPlan === 'lite_mensual' ? 'opacity-70 cursor-wait' : 'cursor-pointer'} ${themeClasses.buttonBg}`}
            >
              {loadingPlan === 'lite_mensual' ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : null}
              {loadingPlan === 'lite_mensual' ? 'Cargando...' : 'Obtener Lite'}
            </button>
          </div>

          {/* Plan Profundo (Highlighted) */}
          <div className={`bg-[#002b49] rounded-3xl p-8 border ${isDarkMode ? 'border-white/20' : 'border-[#001c30]'} shadow-xl flex flex-col items-center text-center transform lg:-translate-y-4 relative hover:scale-[1.01] transition-all`}>
            <div className="absolute -top-4 bg-[#b59348] text-[#002b49] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
              Recomendado
            </div>
            <span className="text-[#b59348] text-xs font-black uppercase tracking-widest mb-2 block mt-2">Profundo</span>
            <h2 className="text-xl font-bold text-white mb-6">Plan 60 Días</h2>
            <div className="mb-8">
              <span className="text-4xl font-black text-white">$10</span>
              <span className="text-white/60 text-sm font-medium"> / 3 meses</span>
            </div>
            <ul className="text-sm text-white/90 text-left w-full space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">calendar_today</span>
                <span>Pensum exhaustivo de <strong>60 días</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">schedule</span>
                <span>Estudio diario de <strong>30 minutos</strong> (Lunes a Domingo)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">zoom_in</span>
                <span>Examen en profundidad de <strong>todas las leyes y temas</strong> clave</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">lock_open</span>
                <span>Módulos y preguntas de todos los niveles (Nivel Trampa incluido)</span>
              </li>
            </ul>
            <button 
              onClick={() => handleSelectPlan('profundo_mensual')}
              disabled={loadingPlan === 'profundo_mensual'}
              className={`w-full py-3 bg-[#b59348] hover:bg-[#a1813b] text-[#002b49] rounded-xl font-black uppercase tracking-wider text-xs shadow-md transition-colors flex items-center justify-center gap-2 ${loadingPlan === 'profundo_mensual' ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
            >
              {loadingPlan === 'profundo_mensual' ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : null}
              {loadingPlan === 'profundo_mensual' ? 'Cargando...' : 'Obtener Profundo'}
            </button>
          </div>

          {/* Plan Completo */}
          <div className={`${themeClasses.cardBg} rounded-3xl p-8 border shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md hover:scale-[1.01]`}>
            <span className={`${themeClasses.textPrimary} text-xs font-black uppercase tracking-widest mb-2 block`}>Completo</span>
            <h2 className={`text-xl font-bold mb-6 ${themeClasses.cardText}`}>Acceso Total</h2>
            <div className="mb-8">
              <span className={`text-4xl font-black ${themeClasses.textPrimary}`}>$15</span>
              <span className={`${themeClasses.textSecondary} text-sm font-medium`}> / 3 meses</span>
            </div>
            <ul className={`text-sm ${themeClasses.cardTextSecondary} text-left w-full space-y-4 mb-8 flex-1`}>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">check_circle</span>
                <span>Estudia tanto el Plan <strong>Lite</strong> como el Plan <strong>Profundo</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">library_books</span>
                <span>Estudio libre <strong>Ley por Ley</strong> sin restricciones de cronograma</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">headphones</span>
                <span>Acceso premium al modo <strong>Manos Libres con audio</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#b59348] text-[18px]">assignment_turned_in</span>
                <span>Simuladores de leyes ilimitados con diagnósticos personalizados</span>
              </li>
            </ul>
            <button 
              onClick={() => handleSelectPlan('completo_mensual')}
              disabled={loadingPlan === 'completo_mensual'}
              className={`w-full py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 ${loadingPlan === 'completo_mensual' ? 'opacity-70 cursor-wait' : 'cursor-pointer'} ${themeClasses.buttonBg}`}
            >
              {loadingPlan === 'completo_mensual' ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : null}
              {loadingPlan === 'completo_mensual' ? 'Cargando...' : 'Obtener Acceso Total'}
            </button>
          </div>

        </div>

        {/* Temario Día a Día */}
        <div className="w-full max-w-4xl mx-auto mt-16">
          <div className="text-center mb-6">
            <h2 className={`text-2xl md:text-3xl font-black ${themeClasses.textPrimary} uppercase tracking-tight`}>
              Pensum Diario de Estudio
            </h2>
          </div>

          {/* Selector de Plan en el Cronograma */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setSelectedSchedule('lite')}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all border ${
                selectedSchedule === 'lite'
                  ? 'bg-[#b59348] text-[#002b49] border-[#b59348] shadow'
                  : isDarkMode ? 'bg-white/5 border-white/15 text-gray-300 hover:bg-white/10' : 'bg-gray-100 border-gray-200 text-[#002b49] hover:bg-[#b59348]/10'
              }`}
            >
              Plan Lite (20 Días)
            </button>
            <button
              onClick={() => setSelectedSchedule('profundo')}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all border ${
                selectedSchedule === 'profundo'
                  ? 'bg-[#b59348] text-[#002b49] border-[#b59348] shadow'
                  : isDarkMode ? 'bg-white/5 border-white/15 text-gray-300 hover:bg-white/10' : 'bg-gray-100 border-gray-200 text-[#002b49] hover:bg-[#b59348]/10'
              }`}
            >
              Plan Profundo (60 Días)
            </button>
          </div>

          {/* Lista de Días */}
          <div className={`p-6 rounded-3xl border max-h-[500px] overflow-y-auto space-y-4 shadow-inner ${themeClasses.cardBg}`}>
            {selectedSchedule === 'lite' ? (
              liteDays.map((day) => (
                <div key={day.dia} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${isDarkMode ? 'border-white/5 bg-[#001524]/40 hover:bg-[#001524]' : 'border-gray-300/60 bg-gray-100/70 hover:bg-gray-250 text-gray-900'}`}>
                  <div className="flex-shrink-0 bg-[#b59348] text-[#002b49] font-black text-xs px-3 py-1.5 rounded-lg shadow-sm">
                    Día {day.dia}
                  </div>
                  <div className="flex-1 text-left">
                    <span className={`text-[10px] uppercase font-black tracking-widest block mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600 font-bold'}`}>
                      {day.ley}
                    </span>
                    <p className={`text-xs md:text-sm font-bold leading-relaxed ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {day.temas}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              profundoDays.map((day) => (
                <div key={day.dia} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${isDarkMode ? 'border-white/5 bg-[#001524]/40 hover:bg-[#001524]' : 'border-gray-300/60 bg-gray-100/70 hover:bg-gray-250 text-gray-900'}`}>
                  <div className="flex-shrink-0 bg-[#002b49] text-[#b59348] font-black text-xs px-3 py-1.5 rounded-lg border border-[#b59348]/30 shadow-sm">
                    Días {day.dia}
                  </div>
                  <div className="flex-1 text-left">
                    <span className={`text-[10px] uppercase font-black tracking-widest block mb-1 ${isDarkMode ? 'text-[#b59348]' : 'text-[#765a13] font-bold'}`}>
                      {day.ley}
                    </span>
                    <p className={`text-xs md:text-sm font-bold leading-relaxed ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {day.temas}
                    </p>
                  </div>
                </div>
              ))
            )}
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

      {/* Modal Historial de Pagos */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`${isDarkMode ? 'bg-[#002b49]' : 'bg-white'} rounded-3xl p-6 w-[95%] max-w-4xl shadow-2xl border ${isDarkMode ? 'border-white/10' : 'border-gray-200'} relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]`}>
            
            <div className="flex items-center justify-between mb-6 border-b pb-4 border-gray-200/20">
              <div className="flex items-center gap-4">
                <h3 className={`text-xl font-black ${themeClasses.textPrimary} flex items-center gap-2`}>
                  <span className="material-symbols-outlined text-[#b59348]">history</span>
                  Historial de Pagos
                </h3>
                <button 
                  onClick={handleSyncPayments}
                  disabled={syncing || loadingHistory}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-colors ${syncing ? 'bg-gray-200 text-gray-500 cursor-wait' : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'}`}
                  title="Verificar pagos pendientes con Wompi"
                >
                  <span className={`material-symbols-outlined text-[16px] ${syncing ? 'animate-spin' : ''}`}>sync</span>
                  {syncing ? 'Actualizando...' : 'Actualizar Estado'}
                </button>
              </div>
              <button 
                onClick={() => setShowHistory(false)} 
                className={`material-symbols-outlined ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
              >
                close
              </button>
            </div>

            <div className="overflow-auto flex-1">
              {loadingHistory ? (
                <div className="flex justify-center items-center p-12">
                  <span className="material-symbols-outlined animate-spin text-4xl text-[#b59348]">sync</span>
                </div>
              ) : historyData.length === 0 ? (
                <div className="text-center p-8 opacity-70">
                  <p className={themeClasses.textSecondary}>Aún no tienes historial de pagos.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                      <th className={`p-3 text-xs uppercase tracking-wider ${themeClasses.textSecondary}`}>Fecha</th>
                      <th className={`p-3 text-xs uppercase tracking-wider ${themeClasses.textSecondary}`}>Plan</th>
                      <th className={`p-3 text-xs uppercase tracking-wider ${themeClasses.textSecondary}`}>Monto</th>
                      <th className={`p-3 text-xs uppercase tracking-wider ${themeClasses.textSecondary}`}>Estado</th>
                      <th className={`p-3 text-xs uppercase tracking-wider text-right ${themeClasses.textSecondary}`}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((pago) => (
                      <tr key={pago.id} className={`border-b ${isDarkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}>
                        <td className={`p-3 text-sm ${themeClasses.textPrimary}`}>
                          {new Date(pago.fechaCreacion).toLocaleDateString()}
                        </td>
                        <td className={`p-3 text-sm font-medium ${themeClasses.textPrimary}`}>
                          {pago.producto}
                        </td>
                        <td className={`p-3 text-sm ${themeClasses.textPrimary}`}>
                          ${pago.monto}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            pago.estado === 'PAGADO' ? 'bg-green-500/20 text-green-500' :
                            pago.estado === 'VENCIDO' ? 'bg-red-500/20 text-red-500' :
                            'bg-orange-500/20 text-orange-500'
                          }`}>
                            {pago.estado}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {pago.estado === 'PENDIENTE' && pago.urlValida && (
                            <a 
                              href={pago.urlEnlace}
                              target="_self"
                              className="inline-flex items-center gap-1 bg-[#b59348] hover:bg-[#a1813b] text-[#002b49] px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-colors"
                            >
                              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                              Pagar Ahora
                            </a>
                          )}
                          {pago.estado === 'PAGADO' && (
                            <span className="material-symbols-outlined text-green-500">check_circle</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
