import { format } from "date-fns";
import { getColombiaMobile } from "./phoneUtils";

export type Message = {
  date: string;
  nombre: string;
  cedula?: string;
  telefono: string;
  direccion: string;
  ciudad_departamento: string;
  producto: string;
  cantidad?: number;
  observaciones?: string;
};

const whatsappHeaderRegex = /\[\d{2}\/\d{2}\/\d{2},.*?\]/;

/* --- Helpers --- */
function splitBlocks(content: string) {
  return content
    .split(whatsappHeaderRegex) // Dividir por encabezados de WhatsApp
    .map(b => b.trim()) // Eliminar espacios en blanco
    .filter(b => b.length > 0); // Filtrar bloques vacíos
}

function splitLines(block: string) {
  return block
    .split(/\n+/) // Dividir por saltos de línea
    .map(l => l.trim()) // Eliminar espacios en blanco
    .filter(Boolean); // Filtrar líneas vacías
}

function parseName(line: string) {
  // El formato es "Nombre: Juan Pérez"
  return line
    .split(":")[1]?.trim() ?? ""; // Extraer el nombre después de ":" y eliminar espacios adicionales
}

// Elimina todos los caracteres que no son numéricos
function removeNonNumeric(str: string) {
  return str.replace(/\D/g, "");
}

// Retorna teléfono móvil colombiano o undefined
function parsePhoneOrCedula(lines: string[]) {
  let telefono = getColombiaMobile(lines[1]);
  let cedula = "";
  let indexStart = 2;

  if (!telefono) {
    cedula = lines[1];
    telefono = lines[2];
    indexStart = 3;
  }

  return {
    indexStart,
    telefono: removeNonNumeric(telefono),
    cedula: removeNonNumeric(cedula)
  };
}

// Extrae solo números de la cadena y la convierte a número
function parseCantidad(producto: string) {
  return Number(producto.replace(/[^0-9]/g, "")) || undefined;
}

// Parsea el cuerpo restante del mensaje a partir de la línea de inicio
function parseBody(lines: string[], startIndex: number) {
  let i = startIndex;
  const direccion = lines[i++];
  const ciudad_departamento = lines[i++];
  const producto = lines[i++];
  const cantidad = parseCantidad(producto);
  const observaciones = lines.slice(i).join(" ") || undefined;

  return { direccion, ciudad_departamento, producto, cantidad, observaciones };
}

// Retorna la fecha actual en formato "yyyy-MM-dd" usando date-fns
function today() {
  return format(new Date(), "yyyy-MM-dd");
}

/* --- Main parser --- */
export function parseTextFile(content: string): Message[] {
  const results: Message[] = [];
  const blocks = splitBlocks(content);

  for (const block of blocks) {
    const lines = splitLines(block);
    const nombre = parseName(lines[0]);

    const { telefono, cedula, indexStart } = parsePhoneOrCedula(lines);
    const { direccion, ciudad_departamento, producto, cantidad, observaciones } =
      parseBody(lines, indexStart);

    results.push({
      date: today(),
      nombre,
      cedula,
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
