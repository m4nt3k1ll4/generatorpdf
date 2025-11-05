"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Message } from "@/lib/parser";
import { Edit3, CheckSquare, Square } from "lucide-react";
import { PriceCatalog, defaultCatalog, catalogSuggestions } from "@/lib/priceCatalog";

type Props = {
    message: Message;
    selected: boolean;
    onUpdate: (updated: Message) => void;
    onToggleSelect?: (id: string, checked: boolean) => void; // recomendado
    onSelectChange?: (checked: boolean) => void; // fallback
    catalog?: PriceCatalog;
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
    if (!mounted || !container) return null;
    return createPortal(children, container);
}

const money = (n: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default function MessageCard({
    message,
    selected,
    onUpdate,
    onToggleSelect,
    onSelectChange,
    catalog = defaultCatalog,
}: Props) {
    const [editing, setEditing] = useState(false);
    const [editMsg, setEditMsg] = useState<Message>(message);

    useEffect(() => setEditMsg(message), [message]);

    // bloquear scroll con modal
    useEffect(() => {
        if (!editing) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [editing]);

    useEffect(() => {
        if (!editing) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setEditing(false);
                setEditMsg(message);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                handleSave();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [editing, message, editMsg]);

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
    const priceChips = useMemo(() => catalogSuggestions(editMsg.producto ?? "", catalog), [editMsg.producto, catalog]);

    const qty = typeof message.cantidad === "number" && message.cantidad > 0 ? message.cantidad : 1;
    const hasTotal = typeof message.precio === "number";

    return (
        <div
            className={`relative rounded-2xl border shadow-sm transition-all
      bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700
      ${editing ? "" : "hover:shadow-lg hover:scale-[1.01]"}
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
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{message.nombre}</p>
                {message.cedula && (
                    <p>
                        <span className="font-semibold">CC:</span> {message.cedula}
                    </p>
                )}
                <p>
                    <span className="font-semibold">Tel:</span> {message.telefono}
                </p>
                <p>
                    <span className="font-semibold">Dir:</span> {message.direccion}
                </p>
                <p>
                    <span className="font-semibold">Ciudad:</span> {message.ciudad_departamento}
                </p>
                <p>
                    <span className="font-semibold">Prod:</span> {message.producto}
                </p>

                {/* Cantidad + Total */}
                <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <p>
                        <span className="font-semibold">Cant:</span> {qty}
                    </p>
                    <p>
                        <span className="font-semibold">Total:</span> {hasTotal ? money(message.precio as number) : "—"}
                    </p>
                </div>

                {message.observaciones && (
                    <p className="italic text-slate-600 dark:text-slate-300">“{message.observaciones}”</p>
                )}
            </div>

            {/* Modal via Portal */}
            {editing && (
                <ModalPortal>
                    <div
                        className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        role="dialog"
                        aria-modal="true"
                        onClick={() => { setEditing(false); setEditMsg(message); }}
                    >
                        {/* Panel FULL-SCREEN sin scroll interno */}
                        <div
                            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full h-full md:h-auto md:max-h-none md:w-[min(100vw-3rem,980px)] p-8 border border-slate-200 dark:border-slate-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Cerrar (X) */}
                            <button
                                onClick={() => { setEditing(false); setEditMsg(message); }}
                                className="absolute right-4 top-4 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xl"
                                aria-label="Cerrar"
                            >
                                ×
                            </button>

                            {/* Título */}
                            <h3 className="font-extrabold text-2xl text-slate-900 dark:text-white mb-6">
                                Editar pedido
                            </h3>

                            {/* GRID 2 columnas, campos grandes, sin contenedor con overflow */}
                            <form
                                className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[17px]"
                                onSubmit={(e) => { e.preventDefault(); handleSave(); }}
                            >
                                {/* Cantidad */}
                                <div className="col-span-1">
                                    <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                        Cantidad
                                    </label>
                                    <input
                                        autoFocus
                                        type="number"
                                        min={1}
                                        inputMode="numeric"
                                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg bg-white dark:bg-slate-900"
                                        value={editMsg.cantidad ?? ""}
                                        onChange={(e) =>
                                            setEditMsg({
                                                ...editMsg,
                                                cantidad: e.target.value === "" ? undefined : Number(e.target.value),
                                            })
                                        }
                                    />
                                </div>

                                {/* Total (COP) */}
                                <div className="col-span-1">
                                    <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                        Total (COP)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={100}
                                        inputMode="numeric"
                                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg bg-white dark:bg-slate-900"
                                        value={editMsg.precio === undefined ? "" : editMsg.precio}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setEditMsg({
                                                ...editMsg,
                                                precio: v === "" ? undefined : Number(v),
                                            });
                                        }}
                                    />
                                    {/* Chips sugerencias (en una línea, sin romper layout) */}
                                    {priceChips.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {priceChips.map((s) => (
                                                <button
                                                    key={s.label}
                                                    type="button"
                                                    onClick={() => setEditMsg({ ...editMsg, precio: s.value })}
                                                    className="px-3 py-1.5 text-sm rounded-full border bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                                                    title={s.label}
                                                >
                                                    {s.label}: {money(s.value)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Nombre */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                        Nombre
                                    </label>
                                    <input
                                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg bg-white dark:bg-slate-900"
                                        value={editMsg.nombre ?? ""}
                                        onChange={(e) => setEditMsg({ ...editMsg, nombre: e.target.value })}
                                    />
                                </div>

                                {/* Teléfono */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                        Teléfono
                                    </label>
                                    <input
                                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg bg-white dark:bg-slate-900"
                                        value={editMsg.telefono ?? ""}
                                        onChange={(e) => setEditMsg({ ...editMsg, telefono: e.target.value })}
                                    />
                                </div>

                                {/* Dirección (full ancho en desktop si quieres) */}
                                <div className="md:col-span-2">
                                    <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                        Dirección
                                    </label>
                                    <input
                                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg bg-white dark:bg-slate-900"
                                        value={editMsg.direccion ?? ""}
                                        onChange={(e) => setEditMsg({ ...editMsg, direccion: e.target.value })}
                                    />
                                </div>

                                {/* Ciudad / Depto */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                        Ciudad / Departamento
                                    </label>
                                    <input
                                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg bg-white dark:bg-slate-900"
                                        value={editMsg.ciudad_departamento ?? ""}
                                        onChange={(e) => setEditMsg({ ...editMsg, ciudad_departamento: e.target.value })}
                                    />
                                </div>

                                {/* Producto */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                        Producto
                                    </label>
                                    <input
                                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg bg-white dark:bg-slate-900"
                                        value={editMsg.producto ?? ""}
                                        onChange={(e) => setEditMsg({ ...editMsg, producto: e.target.value })}
                                    />
                                </div>

                                {/* Observaciones (textarea grande) */}
                                <div className="md:col-span-2">
                                    <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                        Observaciones
                                    </label>
                                    <textarea
                                        rows={3}
                                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg bg-white dark:bg-slate-900 resize-none"
                                        value={editMsg.observaciones ?? ""}
                                        onChange={(e) => setEditMsg({ ...editMsg, observaciones: e.target.value })}
                                    />
                                </div>
                            </form>

                            {/* Botones grandes, fijos abajo (sin scroll) */}
                            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    onClick={() => { setEditing(false); setEditMsg(message); }}
                                    className="px-6 py-3 rounded-lg border text-base bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600"
                                >
                                    Cancelar (Esc)
                                </button>

                                <button
                                    onClick={handleSave}
                                    className="px-6 py-3 rounded-lg text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                                >
                                    Guardar (Ctrl/⌘ + Enter)
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}
