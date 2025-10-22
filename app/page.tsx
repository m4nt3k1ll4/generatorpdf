'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  useEffect(() => {
    // Verificamos si el usuario tiene sesión activa
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/login';
      }
    });
  }, []);

  return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-lg text-gray-600">Cargando...</p>
    </div>
  );
}
