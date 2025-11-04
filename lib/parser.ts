import { getColombiaMobile } from "./phoneUtils";

export type Message = {
  id?: string;
  date: string;
  nombre: string;
  cedula?: string;
  telefono: string;
  direccion: string;
  ciudad_departamento: string;
  producto: string;
  cantidad?: number;
  observaciones?: string;
  created_at?: string;
};

export type PedidosSection = {
  maxDate?: string | null;
  dia: string | null;
  titulo: string;
  raw: string;
  messages: Message[];
};

// Encabezado de WhatsApp (formato nuevo) con grupos para fecha/hora/AMPM/nombre
const WH_HEADER_RE = /(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap])\.?\s*\.? ?m\.?\s*-\s*([^:]+):/gim;
const pedidosSectionRegex = /((?:[🛑🚨⚠️❗️]\s*)?\*?PEDIDOS\s+(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|fin\s+de\s+semana)\*?)([\s\S]*?)(?=(?:[🛑🚨⚠️❗️]\s*)?\*?PEDIDOS\s+(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|fin\s+de\s+semana)\*?|$)/gi;

/* ---------------- Line helpers ---------------- */
function splitParas(text: string) {
  return text
    .split(/\n\s*\n/) // ← dos saltos de línea (o más) = nuevo campo
    .map(p => p.trim())
    .filter(Boolean);
}

function removeNonNumeric(str: string) {
  return str.replace(/\D/g, "");
}

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
    cedula: removeNonNumeric(cedula),
  };
}

function parseCantidad(producto: string) {
  if (!producto) return undefined;
  return Number(producto.replace(/[^0-9]/g, "")) || undefined;
}

function parseBody(lines: string[], startIndex: number) {
  let i = startIndex;
  const direccion = lines[i++];
  const ciudad_departamento = lines[i++];
  const producto = lines[i++];
  const cantidad = parseCantidad(producto);
  const observaciones = lines.slice(i).join(" ") || undefined;

  return { direccion, ciudad_departamento, producto, cantidad, observaciones };
}

export function splitByPedidos(content: string) {
  const ids = new Set<string>();
  const sections = [];
  const matches = content.matchAll(pedidosSectionRegex);

  for (const m of matches) {
    const titulo = m[1]?.trim() ?? "";
    const dia = m[2]?.toLowerCase() ?? "";
    const body = m[3]?.trim() ?? "";
    const raw = titulo + "\n" + body.replaceAll('<Se editó este mensaje.>', '');
    const messages: Message[] = [];
    const results = extractWhatsappMessages(raw);

    for (const block of results) {
      const lines = splitParas(block.text);
      if (lines.length < 4) continue; // mínimo nombre + teléfono + dirección + ciudad
      const nombre = lines[0];

      const date = block.date;
      let { telefono, cedula, indexStart } = parsePhoneOrCedula(lines);
      let { direccion, ciudad_departamento, producto, cantidad, observaciones } =
        parseBody(lines, indexStart);

      producto = producto || lines[lines.length - 1] || "SIN PRODUCTO";
      telefono = telefono || "0000000000";
      cedula = cedula || "";
      direccion = direccion || "SIN DIRECCIÓN";
      ciudad_departamento = ciudad_departamento || "SIN CIUDAD";
      producto = producto || "SIN PRODUCTO";
      cantidad = cantidad || 0;
      observaciones = observaciones || "";

      // Usa la fecha del header (Colombia) formateada a "yyyy-MM-dd"    
      const id = buildMessageId(date, nombre, telefono, producto);
      if (ids.has(id)) continue; // evitar duplicados
      ids.add(id);

      messages.push({
        id,
        date,
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

    sections.push({
      dia,
      titulo,
      raw,
      messages
    });
  }

  return sections;
}

/**
 * Parte el texto por cada encabezado y devuelve bloques con:
 * - date: "YYYY-MM-DD"
 * - datetime: "YYYY-MM-DD HH:mm:ss" (local)
 * - name: remitente del encabezado
 * - text: contenido del mensaje hasta el siguiente encabezado
 */
export function extractWhatsappMessages(raw: string) {
  const text = (raw || "").replace(/\u202F/g, " "); // normaliza espacios finos
  const matches = [...text.matchAll(WH_HEADER_RE)];
  const out: { date: string; datetime: string; name: string; text: string }[] = [];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const nextStart = matches[i + 1]?.index ?? text.length;

    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);
    let H = Number(m[4]);
    const Min = Number(m[5]);
    const Sec = m[6] ? Number(m[6]) : 0;
    const ap = (m[7] || "").toLowerCase(); // 'a' o 'p'
    const name = m[8].trim();

    // AM/PM → 24h
    if (ap === "p" && H !== 12) H += 12;
    if (ap === "a" && H === 12) H = 0;

    // índice donde termina el header
    const headerEnd = (m.index ?? 0) + m[0].length;
    const body = text.slice(headerEnd, nextStart).trim();

    // yyyy-mm-dd y hh:mm:ss
    const yyyy = y.toString().padStart(4, "0");
    const mm = mo.toString().padStart(2, "0");
    const dd = d.toString().padStart(2, "0");
    const HH = H.toString().padStart(2, "0");
    const MM = Min.toString().padStart(2, "0");
    const SS = Sec.toString().padStart(2, "0");

    out.push({
      date: `${yyyy}-${mm}-${dd}`,
      datetime: `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`,
      name,
      text: body,
    });
  }

  return out;
}

/* ---------------- Main parser ---------------- */
export function getMessages(content: string): Message[] {
  const sections = splitByPedidos(content);
  return sections.map(s => s.messages).flat();
}

export function buildMessageId(date: string, nombre: string, telefono: string, producto: string): string {
  return `${date}|${nombre}|${telefono}|${producto}`;
}
