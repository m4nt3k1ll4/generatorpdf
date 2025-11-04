import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import { Message } from '@/lib/parser';

/**
 * Genera un PDF con 9 tarjetas (3x3) por hoja, con wrap de texto y sin usar "\n".
 *
 * @param messages Array de mensajes
 * @param opts Opciones opcionales: { ttfUrl?: string } para fuente Unicode
 * @returns bytes del PDF
 */
export async function generatePdfBytes(
  messages: Message[],
  opts?: { ttfUrl?: string } // opcional: pasa /fonts/DejaVuSans.ttf o similar
): Promise<Uint8Array> {
  // --- Parámetros de layout ---
  const pageWidth = 595;  // A4 width (pt)
  const pageHeight = 842; // A4 height (pt)
  const margin = 40;
  const cols = 3;
  const rows = 3;
  const gap = 10;         // margen interno de tarjeta
  const cardWidth = (pageWidth - margin * 2) / cols;
  const cardHeight = (pageHeight - margin * 2) / rows;

  const fontSize = 12;
  const lineHeight = 16;

  // --- Utilidades de texto ---
  const sanitize = (s: string) =>
    (s ?? '')
      .replace(/[\u0000-\u001F]/g, ' ') // quita caracteres de control
      .replace(/\s+/g, ' ')             // compacta espacios múltiples
      .trim();

  const splitByNewlines = (s: string) =>
    (s ?? '').split(/\r?\n/).map(part => part.trim()).filter(Boolean);

  // Parte palabras MUY largas (URLs, referencias) para que quepan
  const breakLongToken = (
    token: string,
    font: PDFFont,
    maxWidth: number,
    size: number
  ): string[] => {
    if (font.widthOfTextAtSize(token, size) <= maxWidth) return [token];
    const chars = [...token];
    const parts: string[] = [];
    let curr = '';
    for (const ch of chars) {
      const test = curr + ch;
      if (font.widthOfTextAtSize(test, size) > maxWidth) {
        if (curr.length === 0) {
          // carácter aislado excede (fuente gigante) — fuerza avance
          parts.push(ch);
        } else {
          parts.push(curr);
          curr = ch;
        }
      } else {
        curr = test;
      }
    }
    if (curr) parts.push(curr);
    return parts;
  };

  // Word-wrap que respeta ancho y también corta tokens largos
  const wrapLine = (
    text: string,
    font: PDFFont,
    maxWidth: number,
    size: number
  ): string[] => {
    const tokens = text.split(' ').filter(Boolean);
    const out: string[] = [];
    let current = '';

    const pushCurrent = () => {
      if (current) {
        out.push(current);
        current = '';
      }
    };

    for (const tok of tokens) {
      // Si el token es demasiado ancho, partirlo en sub-tokens
      const subtokens = breakLongToken(tok, font, maxWidth, size);
      for (const sub of subtokens) {
        const test = current ? `${current} ${sub}` : sub;
        if (font.widthOfTextAtSize(test, size) > maxWidth) {
          pushCurrent();
          current = sub;
        } else {
          current = test;
        }
      }
    }
    pushCurrent();
    return out;
  };

  // Crea el bloque de líneas envuelto (considera \n como “nueva línea dura”)
  const makeWrappedBlock = (
    raw: string,
    font: PDFFont,
    maxWidth: number,
    size: number
  ): string[] => {
    const clean = sanitize(raw);
    if (!clean) return [];
    const hardLines = splitByNewlines(clean);
    const final: string[] = [];
    for (const hl of hardLines) {
      final.push(...wrapLine(hl, font, maxWidth, size));
    }
    return final;
  };

  // --- PDF ---
  const pdfDoc = await PDFDocument.create();

  // Fuente:
  //  A) Simple: Helvetica (WinAnsi). Úsala si NO hay emojis/símbolos raros.
  //  B) Unicode: pasa opts.ttfUrl (p.ej. "/fonts/DejaVuSans.ttf") para soportar todo.
  let bodyFont: PDFFont;
  let boldFont: PDFFont;

  if (opts?.ttfUrl) {
    // Fuente Unicode (recomendado si hay emojis o comillas “tipográficas”)
    const fontBytes = await fetch(opts.ttfUrl).then(r => r.arrayBuffer());
    bodyFont = await pdfDoc.embedFont(fontBytes as ArrayBuffer);
    // Si quieres un bold real, usa otra TTF bold; si no, reutilizamos la misma
    boldFont = bodyFont;
  } else {
    // Helvetica estándar (no Unicode). No admite emojis ni ciertos símbolos.
    bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let i = 0;

  for (const msg of messages) {
    // Nueva página cada 9 tarjetas
    if (i > 0 && i % (rows * cols) === 0) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
    }

    const cardIndex = i % (rows * cols);
    const row = Math.floor(cardIndex / cols);
    const col = cardIndex % cols;

    const x = margin + col * cardWidth;
    const y = pageHeight - margin - (row + 1) * cardHeight;

    // Marco de la tarjeta
    page.drawRectangle({
      x,
      y,
      width: cardWidth - gap,
      height: cardHeight - gap,
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 1,
    });

    // Contenido de la tarjeta
    const fields: Array<string> = [
      msg?.nombre || '',
      msg?.cedula || '',
      msg?.telefono || '',
      msg?.direccion || '',
      msg?.ciudad_departamento || '',
      msg?.producto || '',
      msg?.observaciones || '',
    ].filter(Boolean);

    const textX = x + 10;
    const usableWidth = cardWidth - gap - 15;
    let cursorY = y + cardHeight - 25; // inicio alto de la tarjeta
    const minY = y + 10; // margen inferior de seguridad

    for (const raw of fields) {
      // Genera las líneas envueltas (sin \n)
      const wrapped = makeWrappedBlock(raw, bodyFont, usableWidth, fontSize);

      for (const line of wrapped) {
        // Si no hay espacio vertical, corta con "…" y sigue a la siguiente tarjeta
        if (cursorY < minY) {
          // Reemplaza la última línea escrita por una con “…” si se desea. Aquí, solo cortamos.
          // (Opcional: dibuja una línea con “…”.)
          break;
        }
        page.drawText(line, {
          x: textX,
          y: cursorY,
          size: fontSize,
          font: bodyFont,
        });
        cursorY -= lineHeight;
      }

      // Si ya no hay espacio, no intentes escribir más campos
      if (cursorY < minY) break;
    }

    i++;
  }

  return await pdfDoc.save();
}
