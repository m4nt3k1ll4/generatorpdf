'use client';
import { useState, useEffect } from 'react';
import { format } from "date-fns";
import { supabase } from '@/lib/supabaseClient';
import FileUpload from '@/app/components/FileUpload';
import MessageCard from '@/app/components/MessageCard';
import ThemeToggle from '@/app/components/ThemeToggle';
import DateSelector from '@/app/components/DateSelector';
import LogoutButton from '@/app/components/LogoutButton';
import { Message } from '@/lib/parser';
import { loadMessagesByDate, saveMessages } from '@/lib/messagesApi';

const today = format(new Date(), "yyyy-MM-dd");

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [selectAll, setSelectAll] = useState(true); // 🆕 Estado para controlar selección global
  const [loading, setLoading] = useState(true); // 🆕 Para mostrar “Cargando registros...”


  function resetMessages() {
    setMessages([]);
    setSelectedDate(today);
  }

  // 🔒 Verificar sesión activa al cargar el dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = '/login';
    });
  }, []);

  // 🧭 Cargar automáticamente la última fecha registrada en la base de datos
  useEffect(() => {
    async function loadLatestDate() {
      const { data, error } = await supabase
        .from('messages')
        .select('date')
        .order('date', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setSelectedDate(data[0].date);
      } else {
        setSelectedDate(today);
      }
    }
    loadLatestDate();
  }, []);

  // 📦 Cargar mensajes automáticamente al cambiar la fecha
  useEffect(() => {
    async function fetchMessages() {
      if (!selectedDate) return;
      setLoading(true);
      const loaded = await loadMessagesByDate(selectedDate);
      setMessages(loaded);
      setSelected(loaded.map(() => true));
      setSelectAll(true);
      setLoading(false);
    }
    fetchMessages();
  }, [selectedDate]);

  // 🧾 Generar PDF con los mensajes seleccionados
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

  // 💾 Guardar los mensajes cargados en Supabase
  const handleSaveToDB = async (messageList: Message[]) => {
    try {
      await saveMessages(messageList);
      alert('✅ Registros guardados correctamente');
    } catch (err) {
      console.error(err);
      alert('❌ Error al guardar los registros');
    }
  };

  // 🧩 Actualizar selección individual
  const handleSelectChange = (index: number, checked: boolean) => {
    setSelected((prev) => {
      const copy = [...prev];
      copy[index] = checked;
      // Si algún elemento queda sin seleccionar → desmarcamos "selectAll"
      setSelectAll(copy.every((v) => v));
      return copy;
    });
  };

  // ✏️ Actualizar datos editados dentro de una tarjeta
  const handleUpdate = (index: number, updated: Message) => {
    setMessages((prev) => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
  };

  // 🆕 Seleccionar o deseleccionar todos los registros a la vez
  const toggleSelectAll = () => {
    const newState = !selectAll;
    setSelectAll(newState);
    setSelected(messages.map(() => newState));
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors px-6 py-8">
      {/* 🧭 Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight">🧾 Generador de Rótulos</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      {/* 🎛️ Controles principales */}
      <div className="flex flex-wrap gap-4 items-center mb-8">
        {selectedDate && <DateSelector value={selectedDate} onChange={setSelectedDate} />}

        <FileUpload
          onParsed={async (msgs) => {
            const fechas = [...new Set(msgs.map((m) => m.date))];
            const maxDate = fechas.sort().reverse()[0];
            resetMessages()
            await handleSaveToDB(msgs);
            setSelectedDate(maxDate);
          }}
        />

        {/* 🆕 Botón seleccionar todo */}
        {/* {messages.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors"
          >
            {selectAll ? 'Deseleccionar todo' : 'Seleccionar todo'}
          </button>
        )} */}

        {messages.length > 0 && (
          <>
            {/* <button
              onClick={handleSaveToDB}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar en BD'}
            </button> */}

            <button
              onClick={() => {
                const selectedMessages = messages.filter((_, i) => selected[i]);
                openPdf(selectedMessages);
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              Generar PDF
            </button>
          </>
        )}
      </div>

      {/* 🕓 Indicador de carga */}
      {loading ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-16">
          <p className="text-lg animate-pulse">Cargando registros...</p>
        </div>
      ) : isEmpty ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-16">
          <p className="text-lg">📂 Aún no has cargado ningún archivo .txt</p>
          <p className="text-sm">Selecciona una fecha o sube un archivo para comenzar.</p>
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
