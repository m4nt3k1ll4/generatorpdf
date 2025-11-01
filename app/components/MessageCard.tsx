"use client";
import { useState } from "react";
import { Message } from "@/lib/parser";

type Props = {
    message: Message;
    onUpdate: (updated: Message) => void;
    onSelectChange: (checked: boolean) => void;
};

export default function MessageCard({
    message,
    onUpdate,
    onSelectChange,
}: Props) {
    const [selected, setSelected] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editMsg, setEditMsg] = useState(message);

    const handleSave = () => {
        setEditing(false);
        onUpdate(editMsg);
    };

    return (
        <div className="relative p-4 rounded-lg border bg-white dark:bg-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                        setSelected(e.target.checked);
                        onSelectChange(e.target.checked);
                    }}
                />
                <button
                    onClick={() => setEditing(true)}
                    className="text-sm text-blue-500 underline"
                >
                    Editar
                </button>
            </div>

            <div className="mt-2 text-sm">
                <p>
                    <strong>Nombre:</strong> {editMsg.nombre}
                </p>
                {editMsg.cedula && (
                    <p>
                        <strong>CC:</strong> {editMsg.cedula}
                    </p>
                )}
                <p>
                    <strong>Teléfono:</strong> {editMsg.telefono}
                </p>
                <p>
                    <strong>Dirección:</strong> {editMsg.direccion}
                </p>
                <p>
                    <strong>Ciudad:</strong> {editMsg.ciudad_departamento}
                </p>
                <p>
                    <strong>Producto:</strong> {editMsg.producto}
                </p>
                {editMsg.observaciones && (
                    <p>
                        <strong>Obs:</strong> {editMsg.observaciones}
                    </p>
                )}
            </div>

            {editing && (
                <div className="fixed inset-0 z-50 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center p-4 rounded-lg">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md w-full max-w-sm">
                        <h3 className="font-semibold mb-2">Editar registro</h3>
                        {Object.entries(editMsg).map(
                            ([key, val]) =>
                                key !== "date" && (
                                    <div key={key} className="mb-2">
                                        <label className="block text-xs text-gray-500 mb-1 capitalize">
                                            {key}
                                        </label>
                                        <input
                                            className="w-full border px-2 py-1 rounded text-sm"
                                            value={val as string}
                                            onChange={(e) =>
                                                setEditMsg({ ...editMsg, [key]: e.target.value })
                                            }
                                        />
                                    </div>
                                )
                        )}
                        <div className="flex justify-end gap-2 mt-3">
                            <button
                                onClick={() => setEditing(false)}
                                className="px-3 py-1 border rounded"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-3 py-1 bg-blue-500 text-white rounded"
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
