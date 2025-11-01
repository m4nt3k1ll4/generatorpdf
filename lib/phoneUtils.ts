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
    // Quitar todo lo que no sea dígito
    const digits = text.replace(/\D/g, "");

    // Formato estándar: 10 dígitos y empieza por 3
    const isTenDigitsMobile = /^3\d{9}$/.test(digits);
    if (isTenDigitsMobile) {
        return digits; // ya está normalizado
    }

    // Formato con prefijo 57 (ej: 573001234567)
    const isPrefixedMobile57 = /^573\d{9}$/.test(digits);
    if (isPrefixedMobile57) {
        return digits.slice(2); // quitar "57"
    }

    // Formato con 057 (ej: 0573001234567)
    const isPrefixedMobile057 = /^0573\d{9}$/.test(digits);
    if (isPrefixedMobile057) {
        return digits.slice(3); // quitar "057"
    }

    // Formato internacional con 00357 (ej: 003573001234567)
    const isInternational = /^003573\d{9}$/.test(digits);
    if (isInternational) {
        return digits.slice(4); // quitar "00357"
    }

    // Si no cumple, no es celular
    return null;
}

/** Obtiene un número de celular colombiano desde un texto dado.
 * Retorna null si no se encuentra un celular válido.
 */
export function getColombiaMobile(text: string): string | null {
    return normalizeColombiaMobile(text);
}