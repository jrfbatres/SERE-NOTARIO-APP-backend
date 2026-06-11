'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [nuevaClave, setNuevaClave] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Si no hay token, mostrar error inmediato
  if (!token) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-6 rounded-lg text-center">
        <span className="material-symbols-outlined text-4xl mb-2">error</span>
        <h2 className="text-lg font-bold mb-2">Enlace inválido</h2>
        <p className="text-sm text-red-400/80 mb-4">No se ha proporcionado un token de seguridad válido.</p>
        <Link href="/login" className="inline-block bg-[#d4af37] hover:bg-[#b59348] text-white px-6 py-2 rounded-lg transition-colors">
          Ir al Inicio
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (nuevaClave.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (nuevaClave !== confirmarClave) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-clave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nuevaClave }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al restablecer la contraseña.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-6 rounded-lg text-center">
        <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
        <h2 className="text-lg font-bold mb-2">¡Contraseña actualizada!</h2>
        <p className="text-sm text-green-400/80 mb-4">Tu contraseña ha sido cambiada exitosamente. Serás redirigido al inicio de sesión...</p>
        <Link href="/login" className="inline-block border border-green-400 text-green-400 hover:bg-green-400 hover:text-white px-6 py-2 rounded-lg transition-colors mt-2">
          Ir ahora
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm flex items-start gap-2">
          <span className="material-symbols-outlined text-lg shrink-0">error</span>
          <p className="mt-0.5">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="nuevaClave" className="block text-sm font-medium text-[#c6c6cd] mb-1.5">
          Nueva Contraseña
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#8d9196]">
            lock
          </span>
          <input
            id="nuevaClave"
            type="password"
            value={nuevaClave}
            onChange={(e) => setNuevaClave(e.target.value)}
            className="w-full bg-[#111315] border border-[#2a2d30] rounded-lg py-3 pl-10 pr-4 text-[#eff1f3] placeholder:text-[#8d9196] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmarClave" className="block text-sm font-medium text-[#c6c6cd] mb-1.5">
          Confirmar Contraseña
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#8d9196]">
            lock_reset
          </span>
          <input
            id="confirmarClave"
            type="password"
            value={confirmarClave}
            onChange={(e) => setConfirmarClave(e.target.value)}
            className="w-full bg-[#111315] border border-[#2a2d30] rounded-lg py-3 pl-10 pr-4 text-[#eff1f3] placeholder:text-[#8d9196] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
            placeholder="Repite tu contraseña"
            required
            minLength={6}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#d4af37] hover:bg-[#b59348] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
      >
        {loading ? (
          <>
            <span className="material-symbols-outlined animate-spin">refresh</span>
            Guardando...
          </>
        ) : (
          'Restablecer Contraseña'
        )}
      </button>
    </form>
  );
}

export default function ResetClave() {
  return (
    <div className="min-h-screen bg-[#111315] flex flex-col items-center justify-center p-4">
      <div 
        className="w-full max-w-md bg-[#191c1e] rounded-xl shadow-2xl p-8 border border-[#2a2d30]"
        style={{ width: '100%', maxWidth: '28rem', minWidth: 'min(90vw, 400px)' }}
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-[#d4af37]/10 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[#d4af37] text-3xl">password</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-[#eff1f3] mb-2">
          Crear nueva contraseña
        </h1>
        <p className="text-center text-[#8d9196] mb-8 text-sm">
          Ingresa tu nueva contraseña para acceder a tu cuenta.
        </p>

        <Suspense fallback={<div className="text-center text-gray-500 py-4"><span className="material-symbols-outlined animate-spin text-2xl">autorenew</span></div>}>
          <ResetForm />
        </Suspense>

      </div>
    </div>
  );
}
