'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/ThemeContext';
import UserProfilePopup from '@/components/UserProfilePopup';

export default function AdminPagosPage() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [syncingId, setSyncingId] = useState(null);
  const [toast, setToast] = useState(null);
  
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const showToast = (msg, duration = 4000) => {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  };

  const fetchPayments = async (dateStr = '') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      const queryParam = dateStr ? `?fecha=${dateStr}` : '';
      const res = await fetch(`/api/admin/pagos${queryParam}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      
      if (res.status === 403) {
        setPagos([]);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setPagos(data.data);
      } else {
        showToast(data.error || 'Error al obtener los pagos.');
      }
    } catch (e) {
      console.error(e);
      showToast('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/usuario/perfil', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(profileRes => {
        if (profileRes.success) {
          const profile = profileRes.data;
          const isAdmin = profile.correo === 'admin@serenotario.com' || profile.rol === 'Administrador' || profile.rol === 'ADMINISTRADOR';
          if (!isAdmin) {
            router.push('/dashboard');
            return;
          }
          setUserProfile(profile);
          fetchPayments();
        } else {
          router.push('/login');
        }
      })
      .catch(err => {
        console.error(err);
        router.push('/login');
      });
  }, [router]);

  const handleFilterChange = (e) => {
    const dateVal = e.target.value;
    setFechaFiltro(dateVal);
    setLoading(true);
    fetchPayments(dateVal);
  };

  const clearFilter = () => {
    setFechaFiltro('');
    setLoading(true);
    fetchPayments('');
  };

  const handleCheckPayment = async (pagoId) => {
    setSyncingId(pagoId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/pagos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pagoId })
      });
      
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(result.message);
        // Refresh payment row
        setPagos(prev => prev.map(p => {
          if (p.id === pagoId) {
            return { 
              ...p, 
              estado: result.pagado ? 'PAGADO' : p.estado,
              fecha_pago: result.pagado ? new Date().toISOString() : p.fecha_pago
            };
          }
          return p;
        }));
      } else {
        showToast(result.error || 'No se pudo sincronizar el pago.');
      }
    } catch (e) {
      console.error(e);
      showToast('Error de conexión al sincronizar.');
    } finally {
      setSyncingId(null);
    }
  };

  if (loading && !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-[#002b49] bg-[#f8f9ff]">
        Verificando credenciales de administrador...
      </div>
    );
  }

  const themeClasses = {
    bg: isDarkMode ? "bg-[#001524]" : "bg-[#f8f9ff]",
    text: isDarkMode ? "text-white" : "text-[#002b49]",
    card: isDarkMode ? "bg-[#002b49]/50 border-white/10" : "bg-white border-gray-200 shadow-md",
    header: isDarkMode ? "bg-[#001524]/90 border-white/10" : "bg-white/90 border-gray-200",
    tableRow: isDarkMode ? "border-white/5 hover:bg-white/5" : "border-gray-100 hover:bg-gray-50",
    input: isDarkMode ? "bg-white/5 border-white/10 text-white focus:border-[#b59348]" : "bg-white border-gray-300 text-[#002b49] focus:border-[#b59348]",
  };

  return (
    <div className={`min-h-screen flex flex-col font-body-md ${themeClasses.bg} ${themeClasses.text} transition-colors duration-300`}>
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#002b49] text-white px-5 py-3.5 rounded-2xl border border-[#b59348] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="material-symbols-outlined text-[#b59348] text-[20px]">info</span>
          <span className="text-xs font-black uppercase tracking-wider">{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-30 flex items-center justify-between p-4 md:px-8 border-b backdrop-blur-md ${themeClasses.header}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-full hover:bg-gray-500/20 transition-colors flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#b59348]">
              Panel de Pagos Wompi
            </h1>
            <p className="text-[10px] font-black opacity-70 uppercase tracking-widest text-[#b59348]/85">
              ADMINISTRACIÓN DE ENLACES Y TRANSACCIONES
            </p>
          </div>
        </div>
        <UserProfilePopup userProfile={userProfile} />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Controls / Filter Section */}
          <div className={`p-6 rounded-3xl border ${themeClasses.card} flex flex-col sm:flex-row items-center justify-between gap-4`}>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="material-symbols-outlined text-[#b59348]">filter_alt</span>
              <span className="text-sm font-bold uppercase tracking-wider">Filtrar por Día de Creación:</span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input 
                type="date" 
                value={fechaFiltro}
                onChange={handleFilterChange}
                className={`px-4 py-2 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-[#b59348] transition-all ${themeClasses.input}`}
              />
              {fechaFiltro && (
                <button
                  onClick={clearFilter}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className={`rounded-3xl border ${themeClasses.card} overflow-hidden shadow-lg`}>
            {loading ? (
              <div className="p-12 text-center text-sm font-bold opacity-75">
                Cargando listado de pagos...
              </div>
            ) : pagos.length === 0 ? (
              <div className="p-12 text-center text-sm font-bold opacity-60 italic">
                No se encontraron registros de pago.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-100/50'} text-xs font-black uppercase tracking-wider opacity-85`}>
                      <th className="p-4 md:px-6">Usuario</th>
                      <th className="p-4 md:px-6">Producto / Monto</th>
                      <th className="p-4 md:px-6">Estado</th>
                      <th className="p-4 md:px-6">Fechas</th>
                      <th className="p-4 md:px-6 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-transparent">
                    {pagos.map((pago) => {
                      const esPendiente = pago.estado === 'PENDIENTE';
                      return (
                        <tr key={pago.id} className={`text-xs border-b ${themeClasses.tableRow}`}>
                          {/* User info */}
                          <td className="p-4 md:px-6">
                            <p className="font-bold text-sm">{pago.usuario_nombre}</p>
                            <p className="opacity-60">{pago.usuario_correo}</p>
                          </td>
                          {/* Product info & amount */}
                          <td className="p-4 md:px-6">
                            <p className="font-bold text-sm text-[#b59348]">
                              ${parseFloat(pago.monto).toFixed(2)}
                            </p>
                            <p className="opacity-70 capitalize">{pago.nombre_producto || 'Suscripción'}</p>
                            <p className="text-[9px] opacity-40">Duración: {pago.meses_duracion} {pago.meses_duracion === 1 ? 'Mes' : 'Meses'}</p>
                          </td>
                          {/* Status Badge */}
                          <td className="p-4 md:px-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black tracking-wide text-[9px] uppercase ${
                              pago.estado === 'PAGADO' 
                                ? 'bg-green-500/10 text-green-500' 
                                : 'bg-yellow-500/10 text-yellow-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${pago.estado === 'PAGADO' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                              {pago.estado}
                            </span>
                          </td>
                          {/* Dates */}
                          <td className="p-4 md:px-6 space-y-1">
                            <p className="opacity-80">
                              <span className="font-bold opacity-50 mr-1">Creado:</span> 
                              {new Date(pago.fecha_creacion).toLocaleDateString()} {new Date(pago.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {pago.fecha_pago && (
                              <p className="text-green-500">
                                <span className="font-bold opacity-60 mr-1 text-green-500/70">Pagado:</span> 
                                {new Date(pago.fecha_pago).toLocaleDateString()}
                              </p>
                            )}
                          </td>
                          {/* Actions */}
                          <td className="p-4 md:px-6">
                            <div className="flex items-center justify-center gap-3">
                              {pago.url_enlace && (
                                <a 
                                  href={pago.url_enlace} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl flex items-center justify-center transition-colors"
                                  title="Ver Enlace de Pago"
                                >
                                  <span className="material-symbols-outlined text-sm">link</span>
                                </a>
                              )}
                              
                              {esPendiente ? (
                                <button
                                  onClick={() => handleCheckPayment(pago.id)}
                                  disabled={syncingId !== null}
                                  className={`px-3 py-1.5 bg-[#b59348]/15 hover:bg-[#b59348]/25 text-[#b59348] font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  <span className={`material-symbols-outlined text-sm ${syncingId === pago.id ? 'animate-spin' : ''}`}>
                                    sync
                                  </span>
                                  {syncingId === pago.id ? 'Revisando...' : 'Revisar Pago'}
                                </button>
                              ) : (
                                <span className="text-green-500 font-bold flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">check_circle</span>
                                  Verificado
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
