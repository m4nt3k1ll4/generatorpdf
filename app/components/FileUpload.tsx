'use client';
import React, { useRef, useState } from 'react';
import { parseTextFile, Message } from '@/lib/parser';

interface FileUploadProps {
  selectedDate: string;
  onParsed: (messages: Message[]) => void;
}

export default function FileUpload({ selectedDate, onParsed }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setFileName(file.name);
    setLoading(true);

    try {
      const text = await file.text();
      console.log('📄 Contenido leído del archivo:', text.slice(0, 100)); // debug opcional

      const parsed = parseTextFile(text);
      console.log('✅ Mensajes parseados:', parsed);

      if (parsed.length === 0) {
        setError('No se encontraron mensajes válidos para esta fecha.');
      } else {
        onParsed(parsed);
      }
    } catch (err) {
      console.error(err);
      setError('Error al procesar el archivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".txt"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
      >
        {loading ? 'Procesando...' : 'Seleccionar .txt'}
      </button>

      {fileName && (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {fileName}
        </span>
      )}

      {error && (
        <p className="text-sm text-red-500 ml-2">{error}</p>
      )}
    </div>
  );
}
