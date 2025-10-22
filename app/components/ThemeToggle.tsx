'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  // 🧠 Leemos el tema inicial sólo una vez, sin setState directo
  useEffect(() => {
    const prefersDark =
      typeof window !== 'undefined' &&
      (localStorage.theme === 'dark' ||
        (!('theme' in localStorage) &&
          window.matchMedia('(prefers-color-scheme: dark)').matches));

    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 👇 establecemos el estado solo una vez después del DOM update
    requestAnimationFrame(() => setDark(prefersDark));
  }, []);

  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setDark(true);
    }
  };

  if (dark === null) return null; // evita render hasta saber el estado real

  return (
    <button
      onClick={toggleTheme}
      className="px-3 py-1 border rounded text-sm dark:bg-slate-800"
    >
      {dark ? '☀️ Claro' : '🌙 Oscuro'}
    </button>
  );
}
