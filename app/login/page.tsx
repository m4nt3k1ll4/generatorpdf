'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ThemeToggle from '@/app/components/ThemeToggle';
import { Loader2 } from 'lucide-react'; // icono de carga opcional (instala con npm i lucide-react)

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 transition-colors px-4">
      {/* 🔘 Theme Toggle arriba a la derecha */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-sm border border-slate-200 dark:border-slate-700"
      >
        <h2 className="text-2xl font-bold mb-2 text-center text-slate-800 dark:text-slate-100">
          {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
        </h2>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
          {isLogin
            ? 'Bienvenido de nuevo, ingresa tus credenciales'
            : 'Completa los campos para registrarte'}
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading
            ? isLogin
              ? 'Entrando...'
              : 'Registrando...'
            : isLogin
            ? 'Entrar'
            : 'Crear cuenta'}
        </button>

        <p
          className="text-sm text-center text-blue-500 hover:underline cursor-pointer mt-4"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin
            ? '¿No tienes cuenta? Regístrate'
            : '¿Ya tienes cuenta? Inicia sesión'}
        </p>
      </form>

      <footer className="text-xs text-slate-400 dark:text-slate-500 mt-6">
        © {new Date().getFullYear()} PdfGenerator
      </footer>
    </div>
  );
}
