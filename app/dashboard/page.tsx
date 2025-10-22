"use client";
import React, { useState } from "react";
import FileUpload from "@/app/components/FileUpload";
import MessageCard from "@/app/components/MessageCard";
import { Message } from "@/lib/parser";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import ThemeToggle from "@/app/components/ThemeToggle";
import DateSelector from "@/app/components/DateSelector";

export default function DashboardPage() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/login";
    });
  }, []);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);

  // ✅ Aquí colocamos la función para abrir el PDF
  async function openPdf(selectedMessages: Message[]) {
    const res = await fetch("/api/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: selectedMessages }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Generador de Rótulos</h1>

      <div className="flex gap-4 items-center mb-6">
        <DateSelector value={selectedDate} onChange={setSelectedDate} />
        <FileUpload
          selectedDate={selectedDate}
          onParsed={(msgs) => {
            setMessages(msgs);
            setSelected(msgs.map(() => true));
          }}
        />
      </div>

      <button
        onClick={() => setMessages(messages)}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Guardar en BD
      </button>

      {/* Botón para generar PDF */}
      {messages.length > 0 && (
        <button
          onClick={() => {
            const selectedMessages = messages.filter((_, i) => selected[i]);
            openPdf(selectedMessages);
          }}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Generar PDF
        </button>
      )}

      {/* Grid de cards */}
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

      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>
    </div>
  );
}
