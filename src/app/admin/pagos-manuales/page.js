'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/ThemeContext';

export default function AdminPagosManualesPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [toast, setToast] = useState(null);
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const showToast = (msg, duration = 4000) => {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  };

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Fetching perfil para verificar admin (aunque el API ya lo hace, mejor UX)
        const profileRes = await fetch('/api/usuario/perfil', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        
        if (profileData.success) {
          const profile = profileData.data;
          const isAdmin = profile.correo === 'admin@serenotario.com' || profile.rol === 'Administrador' || profile.rol === 'ADMINISTRADOR';
          if (!isAdmin) {
            router.push('/');
            return;
          }
        }

        // Fetch usuarios
        const usersRes = await fetch('/api/admin/usuarios', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        
        if (usersData.success) {
          setUsuarios(usersData.data);
        } else {
          showToast(usersData.error || 'Error al obtener usuarios');
        }
      } catch (err) {
        console.error(err);
        showToast('Error de conexión.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsuarios();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      showToast('Por favor, selecciona un usuario.');
      return;
    }
    if (!selectedPlan) {
      showToast('Por favor, selecciona un plan.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/pagos-manuales', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usuarioId: selectedUser,
          planMonto: selectedPlan
        })
      });
      
      const data = await res.json();
      if (data.success) {
        showToast('Pago manual registrado y plan actualizado exitosamente.');
        setSelectedUser('');
        setSelectedPlan('');
        setSearchTerm('');
      } else {
        showToast(data.error || 'Error al registrar el pago manual.');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al guardar el pago.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = usuarios.filter(u => 
    u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.correo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#0f0f13] text-[#e2e2e9]' : 'bg-[#f4f4f9] text-[#1a1a1c]'}`}>
        <p className="font-bold opacity-70 animate-pulse text-sm tracking-wider uppercase">Cargando módulo...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 ${isDarkMode ? 'bg-[#0f0f13] text-[#e2e2e9]' : 'bg-[#f4f4f9] text-[#1a1a1c]'}`}>
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className={`px-6 py-3 rounded-full shadow-lg text-sm font-bold tracking-wide ${isDarkMode ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-green-100 text-green-700 border border-green-200'}`}>
            {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`px-6 pt-12 pb-6 relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-b from-blue-900/20 to-transparent' : 'bg-gradient-to-b from-blue-100/50 to-transparent'}`}>
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={() => router.push('/')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 ${isDarkMode ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-black/5 text-black/70 hover:bg-black/10'}`}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Pagos Manuales</h1>
            <p className={`text-xs mt-1 font-medium tracking-wide uppercase ${isDarkMode ? 'text-blue-400/80' : 'text-blue-600/80'}`}>
              ADMINISTRACIÓN DE SUSCRIPCIONES
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 max-w-2xl mx-auto">
        <div className={`p-6 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-[#1a1a1f] border-white/5' : 'bg-white border-black/5'}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* User Selection */}
            <div>
              <label className="block text-sm font-bold mb-2 opacity-80">Seleccionar Usuario</label>
              
              <div className="relative mb-3">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] opacity-40">search</span>
                <input 
                  type="text"
                  placeholder="Buscar por nombre o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${isDarkMode ? 'bg-white/5 border border-white/10 focus:ring-blue-500/50' : 'bg-black/5 border border-black/10 focus:ring-blue-500/50'}`}
                />
              </div>

              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                size={5}
                className={`w-full p-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-white/5 border border-white/10 focus:ring-blue-500/50' : 'bg-black/5 border border-black/10 focus:ring-blue-500/50'}`}
              >
                {filteredUsers.length === 0 ? (
                  <option disabled className="p-2 opacity-50 text-center">No se encontraron usuarios</option>
                ) : (
                  filteredUsers.map(u => (
                    <option key={u.id} value={u.id} className="p-2 border-b border-gray-500/10 last:border-0 hover:bg-blue-500/10 cursor-pointer">
                      {u.nombre} - {u.correo} (Plan: {u.rol})
                    </option>
                  ))
                )}
              </select>
              <p className="text-[10px] mt-2 opacity-50 uppercase tracking-wider">
                {selectedUser ? `Usuario seleccionado: ${usuarios.find(u => u.id === selectedUser)?.nombre}` : 'Ningún usuario seleccionado'}
              </p>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-bold mb-2 opacity-80">Seleccionar Plan</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className={`w-full p-4 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 appearance-none ${isDarkMode ? 'bg-white/5 border border-white/10 focus:ring-blue-500/50' : 'bg-black/5 border border-black/10 focus:ring-blue-500/50'}`}
              >
                <option value="" disabled>-- Selecciona un Plan --</option>
                <option value="5">Plan Lite ($5.00) - 20 Días (1 Mes)</option>
                <option value="10">Plan Profundo ($10.00) - 60 Días (3 Meses)</option>
                <option value="15">Plan Premium Acceso Total ($15.00) - 3 Meses</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 mt-4 rounded-xl font-black uppercase tracking-wider text-sm transition-all active:scale-[0.98] ${
                submitting 
                  ? 'bg-blue-500/50 cursor-not-allowed text-white' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              {submitting ? 'Procesando pago...' : 'Registrar Pago Manual'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
