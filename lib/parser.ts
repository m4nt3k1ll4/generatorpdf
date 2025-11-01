import { format } from "date-fns";
import { getColombiaMobile } from "./phoneUtils";

export type Message = {
  date: string;
  nombre: string;
  telefono: string;
  direccion: string;
  ciudad_departamento: string;
  producto: string;
  cantidad?: number;
  observaciones?: string;
};

/**
 * Parser robusto para archivos de WhatsApp con soporte extendido:
 * ✅ Acepta ambos formatos:
 * [22/10/25, 8:41:55 a.m.] Daniel Jimenez: Nombre...
 * [22/10/25, 8:41:55 a.m.] Daniel Jimenez: Nombre...
 * 
 * Permite:
 * - Teléfonos con espacios o puntos.
 * - Ciudades sin coma (Bogota cundinamarca).
 * - Productos sin palabra "PRODUCTO".
 * - Formato con líneas extra (como ID o cédula).
 * - Campos opcionales (observaciones).
 */
export function parseTextFile(content: string): Message[] {
  const results: Message[] = [];
  // Regex para detectar el encabezado de mensaje de WhatsApp tipo: [21/10/25, 9:27 a.m.]
  const whatsappHeaderRegex = /\[\d{2}\/\d{2}\/\d{2},.*?\]/;

  // Dividir el texto usando cada encabezado como separador y limpiar resultados vacíos
  const blocks = content
    .split(whatsappHeaderRegex)  // Separa cada bloque por fecha/hora
    .map(b => b.trim())          // Elimina espacios al inicio/fin
    .filter(b => b.length > 0);  // Elimina líneas vacías

  for (const block of blocks) {
    // Convertir el bloque en líneas limpias
    const lines = block
      .split(/\n+/)
      .map(l => l.trim())
      .filter(Boolean);

    let cedula = '';
    const nombre = lines[0].split(':')[1].trim();
    let telefono = getColombiaMobile(lines[1]);
    if (!telefono) {
      cedula = lines[1];
      telefono = lines[2];
    }
    let index = cedula ? 3 : 2;
    const direccion = lines[index++];
    const ciudad_departamento = lines[index++];
    const producto = lines[index++];
    const cantidad = Number(producto.replace(/[^0-9]/g, ""));
    const observaciones = lines.slice(index).join(' ');
    const date = format(new Date(), "yyyy-MM-dd");

    results.push({
      date,
      nombre,
      telefono,
      direccion,
      ciudad_departamento,
      producto,
      cantidad,
      observaciones,
    });
  }

  return results;
}
