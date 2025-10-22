'use client'
import React from 'react';
import { parseTextFile, Message } from '@/lib/parser';

type Props = {
    onParsed: (messages: Message[]) => void;
    selectedDate: string;
    };

    export default function FileUpload({ onParsed, selectedDate }: Props) {
    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const msgs = parseTextFile(text, selectedDate);
        onParsed(msgs);
    };

    return (
        <div>
        <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-700 text-white px-4 py-2 rounded">
            Subir .txt
            <input type="file" accept=".txt" onChange={handleFile} className="hidden" />
        </label>
        </div>
    );
}
