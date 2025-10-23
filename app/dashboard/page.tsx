'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import FileUpload from '@/app/components/FileUpload';
import MessageCard from '@/app/components/MessageCard';
import ThemeToggle from '@/app/components/ThemeToggle';
import DateSelector from '@/app/components/DateSelector';
import LogoutButton from '@/app/components/LogoutButton';
import { Message } from '@/lib/parser';
import { saveMessages } from '@/lib/messagesApi';

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [saving, setSaving] = useState(false);

  // 🔒 Verificar sesión activa
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = '/login';
    });
  }, []);

  // 🧾 Generar PDF
  async function openPdf(selectedMessages: Message[]) {
    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: selectedMessages }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  // 💾 Guardar mensajes en BD
  const handleSaveToDB = async () => {
    try {
      setSaving(true);
      await saveMessages(messages);
      alert('✅ Registros guardados correctamente');
    } catch (err) {
      console.error(err);
      alert('❌ Error al guardar los registros');
    } finally {
      setSaving(false);
    }
  };

  // 🧩 Manejo de selección y edición
  const handleSelectChange = (index: number, checked: boolean) => {
    setSelected((prev) => {
      const copy = [...prev];
      copy[index] = checked;
      return copy;
    });
  };

  const handleUpdate = (index: number, updated: Message) => {
    setMessages((prev) => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors px-6 py-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight">🧾 Generador de Rótulos</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      {/* Controles principales */}
      <div className="flex flex-wrap gap-4 items-center mb-8">
        <DateSelector value={selectedDate} onChange={setSelectedDate} />
<FileUpload
  selectedDate={selectedDate}
  onParsed={(msgs) => {
    const fechas = [...new Set(msgs.map((m) => m.date))];
    const maxDate = fechas.sort().reverse()[0];
    setSelectedDate(maxDate);
    const filtered = msgs.filter((m) => m.date === maxDate);
    setMessages(filtered);
    setSelected(filtered.map(() => true));
  }}
/>
        {messages.length > 0 && (
          <>
            <button
              onClick={handleSaveToDB}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar en BD'}
            </button>

            <button
              onClick={() => {
                const selectedMessages = messages.filter((_, i) => selected[i]);
                openPdf(selectedMessages);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Generar PDF
            </button>
          </>
        )}
      </div>

      {/* Contenido */}
      {isEmpty ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-16">
          <p className="text-lg">📂 Aún no has cargado ningún archivo .txt</p>
          <p className="text-sm">Selecciona una fecha y sube un archivo para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {messages.map((msg, i) => (
            <MessageCard
              key={i}
              message={msg}
              onUpdate={(updated) => handleUpdate(i, updated)}
              onSelectChange={(checked) => handleSelectChange(i, checked)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
