// /lib/priceCatalog.ts
import type { Message } from "@/lib/parser";

export type PriceCatalog = Record<string, number>; // COP (enteros sin decimales)

export const defaultCatalog: PriceCatalog = {
    // fill this
};

export function normalizeProductName(s: string) {
    return (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Intenta sugerir precio por catálogo en base a coincidencia parcial.
 * Si ya existe m.precio, lo respeta.
 */
export function enrichPrices(messages: Message[], catalog: PriceCatalog) {
    const entries = Object.entries(catalog).map(([k, v]) => [normalizeProductName(k), v] as const);

    return messages.map((m) => {
        if (m.precio != null) return m;
        const name = normalizeProductName(m.producto ?? "");
        const hit = entries.find(([pattern]) => name.includes(pattern));
        return hit ? { ...m, precio: hit[1] } : m;
    });
}

/** Retorna una lista de sugerencias (clave+precio) que “match” el texto del producto */
export function catalogSuggestions(producto: string, catalog: PriceCatalog) {
    const np = normalizeProductName(producto);
    return Object.entries(catalog)
        .filter(([k]) => normalizeProductName(k).split(" ").every(token => np.includes(token)))
        .map(([k, v]) => ({ label: k, value: v }));
}
