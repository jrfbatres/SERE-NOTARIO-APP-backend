'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/ThemeContext';
import UserProfilePopup from '@/components/UserProfilePopup';

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [toast, setToast] = useState(null);

  const router = useRouter();
  const { isDarkMode } = useTheme();

  const showToast = (msg, duration = 4000) => {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  };

  const fetchUsersReport = async (dateStr = '') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const queryParam = dateStr ? `?fecha=${dateStr}` : '';
      const res = await fetch(`/api/admin/usuarios${queryParam}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });

      if (res.status === 403) {
        setUsuarios([]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setUsuarios(data.data);
      } else {
        showToast(data.error || 'Error al obtener el reporte.');
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
          fetchUsersReport();
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
    fetchUsersReport(dateVal);
  };

  const clearFilter = () => {
    setFechaFiltro('');
    setLoading(true);
    fetchUsersReport('');
  };

  if (loading && !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-[#002b49] bg-[#f8f9ff]">
        Verificando credenciales de administrador...
      </div>
    );
  }

  // Calculate summary metrics
  const totalUsers = usuarios.length;
  const usersWithLinks = usuarios.filter(u => u.tiene_link).length;
  const totalNodesCompleted = usuarios.reduce((sum, u) => sum + parseInt(u.nodos_completados || 0), 0);

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
              Reporte de Usuarios y Progreso
            </h1>
            <p className="text-[10px] font-black opacity-70 uppercase tracking-widest text-[#b59348]/85">
              CONSULTA DE NUEVOS REGISTROS Y ESTADÍSTICAS DE ESTUDIO
            </p>
          </div>
        </div>
        <UserProfilePopup userProfile={userProfile} />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className={`p-6 rounded-3xl border ${themeClasses.card} flex flex-col justify-between`}>
              <span className="text-[10px] font-black uppercase tracking-wider opacity-65">Registros Totales</span>
              <span className="text-3xl font-black text-[#b59348] mt-2">{totalUsers}</span>
              <p className="text-[10px] opacity-50 mt-1">Usuarios registrados en el periodo seleccionado</p>
            </div>
            <div className={`p-6 rounded-3xl border ${themeClasses.card} flex flex-col justify-between`}>
              <span className="text-[10px] font-black uppercase tracking-wider opacity-65">Con Enlace de Pago</span>
              <span className="text-3xl font-black text-blue-500 mt-2">{usersWithLinks}</span>
              <p className="text-[10px] opacity-50 mt-1">Usuarios que han generado al menos un link de pago</p>
            </div>
            <div className={`p-6 rounded-3xl border ${themeClasses.card} flex flex-col justify-between`}>
              <span className="text-[10px] font-black uppercase tracking-wider opacity-65">Nodos Completados</span>
              <span className="text-3xl font-black text-green-500 mt-2">{totalNodesCompleted}</span>
              <p className="text-[10px] opacity-50 mt-1">Suma de temas/nodos completados y aprobados</p>
            </div>
          </div>
          
          {/* Controls / Filter Section */}
          <div className={`p-6 rounded-3xl border ${themeClasses.card} flex flex-col sm:flex-row items-center justify-between gap-4`}>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="material-symbols-outlined text-[#b59348]">event</span>
              <span className="text-sm font-bold uppercase tracking-wider">Filtrar por Día de Registro:</span>
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
                Cargando reporte de usuarios...
              </div>
            ) : usuarios.length === 0 ? (
              <div className="p-12 text-center text-sm font-bold opacity-60 italic">
                No se encontraron registros de usuario creados en esta fecha.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-100/50'} text-xs font-black uppercase tracking-wider opacity-85`}>
                      <th className="p-4 md:px-6">Usuario</th>
                      <th className="p-4 md:px-6">Rol / Plan</th>
                      <th className="p-4 md:px-6">Fecha Registro</th>
                      <th className="p-4 md:px-6">Enlace Pago</th>
                      <th className="p-4 md:px-6 text-center">Nodos Aprobados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-transparent">
                    {usuarios.map((usr) => (
                      <tr key={usr.id} className={`text-xs border-b ${themeClasses.tableRow}`}>
                        {/* User info */}
                        <td className="p-4 md:px-6">
                          <p className="font-bold text-sm">{usr.nombre}</p>
                          <p className="opacity-60">{usr.correo}</p>
                        </td>
                        {/* Role info */}
                        <td className="p-4 md:px-6">
                          <span className="font-black text-sm capitalize">{usr.rol || 'Estándar'}</span>
                        </td>
                        {/* Register Date */}
                        <td className="p-4 md:px-6">
                          <p className="opacity-80">
                            {new Date(usr.creado_en).toLocaleDateString()} {new Date(usr.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        {/* Has link check */}
                        <td className="p-4 md:px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black tracking-wide text-[9px] uppercase ${
                            usr.tiene_link 
                              ? 'bg-blue-500/10 text-blue-500' 
                              : 'bg-gray-500/10 text-gray-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${usr.tiene_link ? 'bg-blue-500' : 'bg-gray-500'}`} />
                            {usr.tiene_link ? 'Creado' : 'No Creado'}
                          </span>
                        </td>
                        {/* Nodos completados */}
                        <td className="p-4 md:px-6 text-center">
                          <span className={`inline-flex items-center justify-center font-black rounded-full px-3 py-1 text-xs ${
                            usr.nodos_completados > 0 
                              ? 'bg-green-500/10 text-green-500' 
                              : 'bg-gray-500/10 text-gray-500'
                          }`}>
                            {usr.nodos_completados} {usr.nodos_completados === 1 ? 'tema' : 'temas'}
                          </span>
                        </td>
                      </tr>
                    ))}
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
