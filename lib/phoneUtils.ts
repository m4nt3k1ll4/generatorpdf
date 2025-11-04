/**
 * Normaliza un número de celular colombiano.
 * 
 * Acepta formatos como:
 *  - 3001234567
 *  - 311 519 2748
 *  - +57 320 555 8899
 *  - 573225553344
 *  - 003573225553344
 * 
 * Retorna:
 *  - "3xxxxxxxxx" (10 dígitos) si es un celular de Colombia
 *  - null si NO es celular
 */
export function normalizeColombiaMobile(text: string): string | null {
    const digits = text.replace(/\D/g, "");

    // Si viene con prefijo internacional y empieza en 3
    if (/^00357\d+/.test(digits)) {
        const num = digits.slice(5);
        return num.length >= 10 && num.startsWith("3") ? num.slice(0, 10) : null;
    }

    // +57 o 57
    if (/^57\d+/.test(digits)) {
        const num = digits.slice(2);
        return num.length >= 10 && num.startsWith("3") ? num.slice(0, 10) : null;
    }

    // 057
    if (/^057\d+/.test(digits)) {
        const num = digits.slice(3);
        return num.length >= 10 && num.startsWith("3") ? num.slice(0, 10) : null;
    }

    // Caso normal: mínimo 10 dígitos y empieza en 3
    if (digits.startsWith("3") && digits.length >= 10) {
        return digits.slice(0, 10);
    }

    return null;
}

/** Obtiene un número de celular colombiano desde un texto dado.
 * Retorna null si no se encuentra un celular válido.
 */
export function getColombiaMobile(text: string): string | null {
    return normalizeColombiaMobile(text);
}