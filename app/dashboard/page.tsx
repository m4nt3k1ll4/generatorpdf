'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from "date-fns";
import { supabase } from '@/lib/supabaseClient';
import FileUpload from '@/app/components/FileUpload';
import MessageCard from '@/app/components/MessageCard';
import ThemeToggle from '@/app/components/ThemeToggle';
import DateSelector from '@/app/components/DateSelector';
import LogoutButton from '@/app/components/LogoutButton';
import { Message } from '@/lib/parser';
import { loadMessagesByDate, saveMessages, updateMessage } from '@/lib/messagesApi';
import { Search, CheckSquare, Square } from 'lucide-react';
import { enrichPrices, defaultCatalog } from '@/lib/priceCatalog';

const today = format(new Date(), "yyyy-MM-dd");

// normaliza id a string
const mid = (m: Message) => String((m as any).id);

// formateador de COP
const money = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set()); // ✅ por ID
  const [selectAll, setSelectAll] = useState(true);
  const [loading, setLoading] = useState(true);

  // UI/filters
  const [query, setQuery] = useState('');
  const [onlySelected, setOnlySelected] = useState(false);

  function resetMessages(date = today) {
    setMessages([]);
    setSelectedIds(new Set());
    setSelectAll(false);
    setOnlySelected(false);
    setQuery('');
    setSelectedDate(date);
  }

  // Verificar sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = '/login';
    });
  }, []);

  // Última fecha con registros
  useEffect(() => {
    async function loadLatestDate() {
      const { data } = await supabase
        .from('messages')
        .select('date')
        .order('date', { ascending: false })
        .limit(1);

      setSelectedDate(data && data.length > 0 ? data[0].date : today);
    }
    loadLatestDate();
  }, []);

  // Cargar mensajes de la fecha (con enriquecimiento de precios por catálogo)
  useEffect(() => {
    async function fetchMessages() {
      if (!selectedDate) return;
      setLoading(true);
      const loaded = await loadMessagesByDate(selectedDate);
      const enriched = enrichPrices(loaded, defaultCatalog); // ⬅️ A (autocompleta precio total por producto)
      setMessages(enriched);
      // marcar todos seleccionados por defecto
      setSelectedIds(new Set(enriched.map(mid)));
      setSelectAll(true);
      setLoading(false);
    }
    fetchMessages();
  }, [selectedDate]);

  // Generar PDF
  async function openPdf(selectedMessages: Message[]) {
    if (!selectedMessages.length) return;
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: selectedMessages }),
      });
      if (!res.ok) throw new Error('Fallo al generar PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error(e);
      alert('❌ No se pudo generar el PDF.');
    }
  }

  // Guardar en Supabase (desde FileUpload)
  const handleSaveToDB = async (messageList: Message[]) => {
    try {
      await saveMessages(messageList);
      alert('✅ Registros guardados correctamente');
    } catch (err) {
      console.error(err);
      alert('❌ Error al guardar los registros');
    }
  };

  // ✅ Actualización con re-render correcto (B permite editar precio total manualmente)
  const handleUpdate = async (updated: Message) => {
    const id = mid(updated);
    // UI primero
    setMessages(prev => prev.map(m => (mid(m) === id ? { ...m, ...updated } as Message : m)));
    try {
      await updateMessage(id, updated);
    } catch (e) {
      console.error(e);
      alert("❌ No se pudo guardar el cambio.");
    }
  };

  // ✅ Seleccionar/Deseleccionar todos por ID
  const toggleSelectAll = () => {
    const newState = !selectAll;
    setSelectAll(newState);
    setSelectedIds(newState ? new Set(messages.map(mid)) : new Set());
  };

  const isEmpty = !loading && messages.length === 0;

  // -------- Visibilidad: filtros y contadores --------
  const total = messages.length;
  const selectedCount = selectedIds.size;

  const filtered = useMemo(() => {
    let list = messages;

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(m => {
        const fields = [
          m.nombre, m.telefono, (m as any).ciudad_departamento,
          m.producto, m.direccion, m.observaciones,
        ].filter(Boolean).map(String).map(s => s.toLowerCase());
        return fields.some(f => f.includes(q));
      });
    }

    if (onlySelected) {
      list = list.filter(m => selectedIds.has(mid(m)));
    }

    return list;
  }, [messages, selectedIds, query, onlySelected]);

  const filteredSelectedCount = useMemo(
    () => filtered.reduce((acc, m) => acc + (selectedIds.has(mid(m)) ? 1 : 0), 0),
    [filtered, selectedIds]
  );

  // Subtotales (precio es TOTAL)
  const subtotalAll = useMemo(
    () => messages.reduce((acc, m) => acc + (typeof m.precio === 'number' ? m.precio : 0), 0),
    [messages]
  );

  const subtotalSelected = useMemo(
    () => messages.reduce((acc, m) => acc + (selectedIds.has(mid(m)) && typeof m.precio === 'number' ? m.precio : 0), 0),
    [messages, selectedIds]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              🧾 Generador de Rótulos
            </h1>
            {selectedDate && (
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                Fecha: {selectedDate}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>

        {/* Controles sticky */}
        <div className="mx-auto max-w-7xl px-6 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {selectedDate && (
                <DateSelector value={selectedDate} onChange={setSelectedDate} />
              )}

              <FileUpload
                onParsed={async (msgs) => {
                  const fechas = [...new Set(msgs.map((m) => m.date))];
                  const maxDate = fechas.sort().reverse()[0];
                  resetMessages();
                  await handleSaveToDB(msgs);
                  setSelectedDate(maxDate);
                }}
              />
            </div>

            {/* Buscador */}
            <div className="flex-1 min-w-[240px]">
              <label htmlFor="search" className="sr-only">Buscar</label>
              <div className="relative">
                <input
                  id="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre, teléfono, ciudad, producto…"
                  className="w-full rounded-md border bg-white dark:bg-slate-800 px-10 py-2 text-sm outline-none ring-0 focus:border-slate-400 dark:focus:border-slate-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                aria-pressed={selectAll}
              >
                {selectAll ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                {selectAll ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>

              <label className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-slate-700"
                  checked={onlySelected}
                  onChange={(e) => setOnlySelected(e.target.checked)}
                />
                Solo seleccionados
              </label>

              <button
                onClick={() => openPdf(messages.filter(m => selectedIds.has(mid(m))))}
                disabled={selectedCount === 0}
                className="inline-flex items-center gap-2 rounded-md bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white px-4 py-2 text-sm transition-colors"
              >
                Generar PDF
                <span className="ml-1 rounded bg-white/20 px-2 py-0.5 text-xs">
                  {selectedCount}
                </span>
              </button>
            </div>
          </div>

          {/* Resumen compacto */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <span> Total: <b>{total}</b> </span>
            <span> Seleccionados: <b>{selectedCount}</b> </span>
            <span> Subtotal (todos): <b>{money(subtotalAll)}</b> </span>
            <span> Subtotal (selección): <b>{money(subtotalSelected)}</b> </span>
            {query && (
              <span>
                Filtrados: <b>{filtered.length}</b> (seleccionados en filtro: <b>{filteredSelectedCount}</b>)
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-lg border bg-white dark:bg-slate-800 overflow-hidden">
                <div className="h-full animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && isEmpty && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-20">
            <p className="text-lg">📂 Aún no hay registros para la fecha seleccionada</p>
            <p className="text-sm mt-1">Selecciona otra fecha o sube un archivo para comenzar.</p>
          </div>
        )}

        {/* Grid */}
        {!loading && !isEmpty && (
          <>
            {filtered.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-16">
                <p className="text-lg">🔎 No hay coincidencias con tu búsqueda/filtros</p>
                <p className="text-sm">Borra el texto de búsqueda o desactiva “Solo seleccionados”.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((msg) => {
                  const id = mid(msg);
                  return (
                    <MessageCard
                      key={id}
                      message={msg}
                      selected={selectedIds.has(id)}
                      onUpdate={handleUpdate}
                      onToggleSelect={(idSel, checked) => {
                        setSelectedIds(prev => {
                          const next = new Set(prev);
                          if (checked) next.add(idSel); else next.delete(idSel);
                          // sincroniza el botón “(de)seleccionar todo”
                          setSelectAll(next.size === messages.length && messages.length > 0);
                          return next;
                        });
                      }}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
