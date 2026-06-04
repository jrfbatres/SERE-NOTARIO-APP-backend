'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../ThemeContext';

export default function RegistroPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, correo: email, clave: password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to login after successful registration
        router.push('/login');
      } else {
        setError(data.error + (data.details ? `: ${data.details}` : ''));
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const themeClasses = {
    bg: isDarkMode ? "bg-[#001524]" : "bg-[#f8f9ff]",
    text: isDarkMode ? "text-white" : "text-[#002b49]",
    cardBg: isDarkMode ? "bg-[#002b49]/50 border-white/10" : "bg-surface-container-lowest border-outline-variant",
    inputBg: isDarkMode ? "bg-[#001524] border-white/20 text-white" : "bg-surface border-outline-variant text-on-surface",
    label: isDarkMode ? "text-gray-300" : "text-on-surface",
    buttonBg: isDarkMode ? "bg-[#b59348] hover:bg-[#a1813b] text-[#002b49]" : "bg-primary hover:bg-primary-container text-on-primary",
    footerText: isDarkMode ? "text-gray-400" : "text-outline"
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} transition-colors duration-300 flex flex-col items-center justify-center`}>
      <main className="w-full max-w-[440px] flex flex-col items-center mx-auto p-gutter">
        <header className="mb-lg text-center">
          <img
            alt="Seré Notario Logo"
            className="h-28 md:h-32 mx-auto object-contain mb-sm transition-all duration-300"
            src={isDarkMode ? "/images/logo-oscuro.png" : "/images/logo.png"}
          />
          <h1 className="hidden">Registro Seré Notario</h1>
        </header>

        <section className={`${themeClasses.cardBg} w-full p-md md:p-lg border rounded-lg login-card transition-colors duration-300`}>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 text-red-200 border border-red-500/30 rounded font-body-md">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-md">
            <div className="flex flex-col space-y-xs">
              <label className={`font-label-md text-label-md ${themeClasses.label}`} htmlFor="nombre">Nombre Completo</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-gray-400">person</span>
                <input
                  className={`w-full pl-10 pr-sm py-sm border rounded focus:ring-1 focus:ring-[#b59348] focus:border-[#b59348] transition-all outline-none font-body-md ${themeClasses.inputBg}`}
                  id="nombre"
                  placeholder="Juan Pérez"
                  required
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col space-y-xs">
              <label className={`font-label-md text-label-md ${themeClasses.label}`} htmlFor="email">Correo Electrónico</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-gray-400">mail</span>
                <input
                  className={`w-full pl-10 pr-sm py-sm border rounded focus:ring-1 focus:ring-[#b59348] focus:border-[#b59348] transition-all outline-none font-body-md ${themeClasses.inputBg}`}
                  id="email"
                  placeholder="nombre@ejemplo.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col space-y-xs">
              <label className={`font-label-md text-label-md ${themeClasses.label}`} htmlFor="password">Contraseña</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-sm text-gray-400">lock</span>
                <input
                  className={`w-full pl-10 pr-10 py-sm border rounded focus:ring-1 focus:ring-[#b59348] focus:border-[#b59348] transition-all outline-none font-body-md ${themeClasses.inputBg}`}
                  id="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-sm text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              className={`w-full font-label-md text-label-md py-sm rounded-lg flex items-center justify-center gap-base transition-all duration-200 border border-secondary/20 shadow-sm active:scale-[0.98] disabled:opacity-50 font-bold uppercase tracking-wide ${themeClasses.buttonBg}`}
              type="submit"
              disabled={loading}
            >
              <span>{loading ? 'Creando cuenta...' : 'Crear Cuenta'}</span>
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
            </button>
          </form>

          <div className="mt-lg pt-md border-t border-white/10 text-center">
            <p className={`font-body-md text-body-md ${themeClasses.label}`}>
              ¿Ya tiene una cuenta?
              <a className="text-[#b59348] font-label-md text-label-md hover:underline ml-xs" href="/login">Iniciar Sesión</a>
            </p>
          </div>
        </section>

        <footer className="mt-lg text-center space-y-sm">
          <div className="flex items-center justify-center gap-md opacity-40 grayscale">
            <span className={`material-symbols-outlined text-[32px] ${isDarkMode ? 'text-white' : 'text-primary'}`}>verified_user</span>
            <span className={`material-symbols-outlined text-[32px] ${isDarkMode ? 'text-white' : 'text-primary'}`}>security</span>
            <span className={`material-symbols-outlined text-[32px] ${isDarkMode ? 'text-white' : 'text-primary'}`}>shield</span>
          </div>
          <p className={`font-caption text-caption ${themeClasses.footerText}`}>
            © 2024 Seré Notario. Todos los derechos reservados. <br />
            Acceso restringido a personal autorizado.
          </p>
        </footer>
      </main>
    </div>
  );
}
