"use client";
import { useEffect, useState } from "react";
import { Message } from "@/lib/parser";

type Props = {
    message: Message;
    selected: boolean;                     // ⬅️ NUEVO: controlado desde el padre
    onUpdate: (updated: Message) => void;
    onSelectChange: (checked: boolean) => void;
};

export default function MessageCard({
    message,
    selected,
    onUpdate,
    onSelectChange,
}: Props) {
    const [editing, setEditing] = useState(false);
    const [editMsg, setEditMsg] = useState<Message>(message);

    // Si el message cambia desde el padre, sincroniza el formulario de edición
    useEffect(() => setEditMsg(message), [message]);

    const handleSave = () => {
        setEditing(false);
        onUpdate(editMsg);
    };

    // Campos que NO quieres editar desde el modal
    const READONLY_FIELDS = new Set(["id", "date", "created_at", "updated_at"]);

    return (
        <div className="relative p-4 rounded-lg border bg-white dark:bg-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
                <input
                    type="checkbox"
                    checked={selected}                    // ⬅️ controlado
                    onChange={(e) => onSelectChange(e.target.checked)}
                    className="h-4 w-4 accent-slate-700"
                    aria-label="Seleccionar registro"
                />

                <button
                    onClick={() => setEditing(true)}
                    className="text-sm text-blue-500 hover:text-blue-600 underline"
                >
                    Editar
                </button>
            </div>

            <div className="mt-2 text-sm leading-6">
                <p><strong>Nombre:</strong> {message.nombre}</p>
                {message.cedula && <p><strong>CC:</strong> {message.cedula}</p>}
                <p><strong>Teléfono:</strong> {message.telefono}</p>
                <p><strong>Dirección:</strong> {message.direccion}</p>
                <p><strong>Ciudad:</strong> {message.ciudad_departamento}</p>
                <p><strong>Producto:</strong> {message.producto}</p>
                {message.observaciones && <p><strong>Obs:</strong> {message.observaciones}</p>}
            </div>

            {editing && (
                <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md w-full max-w-sm">
                        <h3 className="font-semibold mb-3">Editar registro</h3>

                        {Object.entries(editMsg).map(([key, val]) => {
                            if (READONLY_FIELDS.has(key)) return null;
                            return (
                                <div key={key} className="mb-2">
                                    <label className="block text-xs text-gray-500 mb-1 capitalize">
                                        {key.replaceAll("_", " ")}
                                    </label>
                                    <input
                                        className="w-full border px-2 py-1 rounded text-sm bg-white dark:bg-slate-900"
                                        value={String(val ?? "")}
                                        onChange={(e) =>
                                            setEditMsg({ ...editMsg, [key]: e.target.value } as Message)
                                        }
                                    />
                                </div>
                            );
                        })}

                        <div className="flex justify-end gap-2 mt-3">
                            <button
                                onClick={() => { setEditing(false); setEditMsg(message); }}
                                className="px-3 py-1 border rounded"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
