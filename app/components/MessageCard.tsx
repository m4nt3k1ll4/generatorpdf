"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Message } from "@/lib/parser";
import { Edit3, CheckSquare, Square } from "lucide-react";

type Props = {
    message: Message;
    selected: boolean;
    onUpdate: (updated: Message) => void;
    onToggleSelect?: (id: string, checked: boolean) => void;
    onSelectChange?: (checked: boolean) => void; // fallback legacy
};

function ModalPortal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const [container] = useState(() => {
        if (typeof document !== "undefined") {
            const el = document.createElement("div");
            el.setAttribute("data-portal", "modal");
            return el;
        }
        return null;
    });

    useEffect(() => {
        if (!container) return;
        document.body.appendChild(container);
        setMounted(true);
        return () => {
            document.body.removeChild(container);
        };
    }, [container]);

    // montar solo en cliente
    if (!mounted || !container) return null;
    return createPortal(children, container);
}

export default function MessageCard({
    message,
    selected,
    onUpdate,
    onToggleSelect,
    onSelectChange,
}: Props) {
    const [editing, setEditing] = useState(false);
    const [editMsg, setEditMsg] = useState<Message>(message);

    useEffect(() => setEditMsg(message), [message]);

    // Bloquear scroll del body mientras el modal esté abierto
    useEffect(() => {
        if (!editing) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [editing]);

    const handleSave = () => {
        setEditing(false);
        onUpdate(editMsg);
    };

    const handleToggleSelect = () => {
        const next = !selected;
        const id = String((message as any).id);
        if (onToggleSelect) onToggleSelect(id, next);
        else if (onSelectChange) onSelectChange(next);
    };

    const READONLY_FIELDS = new Set(["id", "date", "created_at", "updated_at"]);

    return (
        <div
            className={`relative rounded-2xl border shadow-sm transition-all
        bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700
        ${editing ? "" : "hover:shadow-lg hover:scale-[1.01]"}  /* desactiva transform mientras editas */
      `}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4">
                <button
                    onClick={handleToggleSelect}
                    className={`inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded-md
            ${selected
                            ? "bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30"
                            : "bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-400/20"
                        }`}
                    aria-pressed={selected}
                >
                    {selected ? <CheckSquare size={18} /> : <Square size={18} />}
                    {selected ? "Seleccionado" : "Marcar"}
                </button>

                <button
                    onClick={() => setEditing(true)}
                    className="text-blue-600 dark:text-blue-400 inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-85"
                >
                    <Edit3 size={16} /> Editar
                </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-5 mt-2 text-[15px] leading-relaxed text-slate-800 dark:text-slate-100 space-y-1.5">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {message.nombre}
                </p>
                {message.cedula && <p><span className="font-semibold">CC:</span> {message.cedula}</p>}
                <p><span className="font-semibold">Tel:</span> {message.telefono}</p>
                <p><span className="font-semibold">Dir:</span> {message.direccion}</p>
                <p><span className="font-semibold">Ciudad:</span> {message.ciudad_departamento}</p>
                <p><span className="font-semibold">Prod:</span> {message.producto}</p>
                {message.observaciones && (
                    <p className="italic text-slate-600 dark:text-slate-300">“{message.observaciones}”</p>
                )}
            </div>

            {/* Modal via Portal (fuera del árbol de la card) */}
            {editing && (
                <ModalPortal>
                    <div
                        className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                        role="dialog"
                        aria-modal="true"
                        onClick={() => { setEditing(false); setEditMsg(message); }} // click fuera cierra
                    >
                        <div
                            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700"
                            onClick={(e) => e.stopPropagation()} // evitar cerrar al click interno
                        >
                            <h3 className="font-semibold text-lg mb-4">Editar registro</h3>

                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1.5">
                                {Object.entries(editMsg).map(([key, val]) => {
                                    if (READONLY_FIELDS.has(key)) return null;
                                    return (
                                        <div key={key}>
                                            <label className="block text-[11px] text-gray-500 mb-1 uppercase font-bold tracking-wide">
                                                {key.replaceAll("_", " ")}
                                            </label>
                                            <input
                                                className="w-full border px-3 py-2 rounded-md text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                                                value={String(val ?? "")}
                                                onChange={(e) =>
                                                    setEditMsg({ ...editMsg, [key]: e.target.value } as Message)
                                                }
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end gap-3 mt-5">
                                <button
                                    onClick={() => { setEditing(false); setEditMsg(message); }}
                                    className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}
