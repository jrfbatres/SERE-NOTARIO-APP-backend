'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function RecuperarClave() {
  const [correo, setCorreo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!correo) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/recuperar-clave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al procesar tu solicitud.');
      }

      setSuccess(true);
      setCorreo('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111315] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#191c1e] rounded-xl shadow-2xl p-8 border border-[#2a2d30]">
        
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-[#d4af37]/10 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[#d4af37] text-3xl">key</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-[#eff1f3] mb-2">
          Recuperar Contraseña
        </h1>
        <p className="text-center text-[#8d9196] mb-8 text-sm">
          Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6 flex items-start gap-3">
            <span className="material-symbols-outlined text-xl shrink-0">error</span>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-lg mb-6 flex flex-col items-center text-center gap-2">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
            <p className="text-sm font-medium">¡Enlace enviado!</p>
            <p className="text-xs text-green-400/80 mt-1">Revisa tu bandeja de entrada (y la carpeta de spam). Si el correo existe en nuestro sistema, recibirás las instrucciones.</p>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="correo" className="block text-sm font-medium text-[#c6c6cd] mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#8d9196]">
                  mail
                </span>
                <input
                  id="correo"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full bg-[#111315] border border-[#2a2d30] rounded-lg py-3 pl-10 pr-4 text-[#eff1f3] placeholder:text-[#8d9196] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d4af37] hover:bg-[#b59348] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  Enviando...
                </>
              ) : (
                'Enviar Enlace'
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center border-t border-[#2a2d30] pt-6">
          <Link href="/login" className="text-sm text-[#d4af37] hover:text-[#ffe088] transition-colors font-medium flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
