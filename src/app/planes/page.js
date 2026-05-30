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

  const handleClose = () => {
    router.push('/');
  };

  const planes = {
    basico_mensual: { monto: 15, nombreProducto: "Plan Básico Mensual", mesesDuracion: 1 },
    basico_semestral: { monto: 50, nombreProducto: "Plan Básico 6 Meses", mesesDuracion: 6 },
    plus_mensual: { monto: 20, nombreProducto: "Plan Plus Mensual", mesesDuracion: 1 },
    plus_semestral: { monto: 80, nombreProducto: "Plan Plus 6 Meses", mesesDuracion: 6 }
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
            <button 
              onClick={() => handleSelectPlan('basico_mensual')}
              disabled={loadingPlan === 'basico_mensual'}
              className={`w-full py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 ${loadingPlan === 'basico_mensual' ? 'opacity-70 cursor-wait' : 'cursor-pointer'} ${themeClasses.buttonBg}`}
            >
              {loadingPlan === 'basico_mensual' ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : null}
              {loadingPlan === 'basico_mensual' ? 'Cargando...' : 'Seleccionar Plan'}
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
            <button 
              onClick={() => handleSelectPlan('basico_semestral')}
              disabled={loadingPlan === 'basico_semestral'}
              className={`w-full py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 ${loadingPlan === 'basico_semestral' ? 'opacity-70 cursor-wait' : 'cursor-pointer'} ${themeClasses.buttonBg}`}
            >
              {loadingPlan === 'basico_semestral' ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : null}
              {loadingPlan === 'basico_semestral' ? 'Cargando...' : 'Seleccionar Plan'}
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
            <button 
              onClick={() => handleSelectPlan('plus_mensual')}
              disabled={loadingPlan === 'plus_mensual'}
              className={`w-full py-3 bg-[#b59348] hover:bg-[#a1813b] text-[#002b49] rounded-xl font-black uppercase tracking-wider text-xs shadow-md transition-colors flex items-center justify-center gap-2 ${loadingPlan === 'plus_mensual' ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
            >
              {loadingPlan === 'plus_mensual' ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : null}
              {loadingPlan === 'plus_mensual' ? 'Cargando...' : 'Obtener Plus'}
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
            <button 
              onClick={() => handleSelectPlan('plus_semestral')}
              disabled={loadingPlan === 'plus_semestral'}
              className={`w-full py-3 ${isDarkMode ? 'bg-white hover:bg-gray-200 text-[#002b49]' : 'bg-[#002b49] hover:bg-[#001c30] text-white'} rounded-xl font-black uppercase tracking-wider text-xs shadow-md transition-colors flex items-center justify-center gap-2 ${loadingPlan === 'plus_semestral' ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
            >
              {loadingPlan === 'plus_semestral' ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : null}
              {loadingPlan === 'plus_semestral' ? 'Cargando...' : 'Mejor Valor'}
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
