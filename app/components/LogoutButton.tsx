'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LogOut } from 'lucide-react'; // ícono bonito
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error al cerrar sesión:', error.message);
      setLoading(false);
      return;
    }

    // Redirige al login
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md transition-colors disabled:opacity-50"
    >
      <LogOut className="w-4 h-4" />
      {loading ? 'Cerrando...' : 'Cerrar sesión'}
    </button>
  );
}
