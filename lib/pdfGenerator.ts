import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import type { Message } from '@/lib/parser';

/** PDF 3x3 con diseño simple, espaciado afinado y centrado vertical del contenido */
export async function generatePdfBytes(messages: Message[]): Promise<Uint8Array> {
  // --- Página y grilla ---
  const pageWidth = 595, pageHeight = 842;      // A4 en puntos
  const margin = 36, cols = 3, rows = 3;
  const gapX = 12, gapY = 12;

  const cardWidth = (pageWidth - margin * 2 - gapX * (cols - 1)) / cols;
  const cardHeight = (pageHeight - margin * 2 - gapY * (rows - 1)) / rows;

  // --- Padding interior del rectángulo ---
  const padX = 16;     // un poco más que antes para equilibrio visual
  const padY = 16;

  // --- Tipografías / jerarquía ---
  const nameFontSize = 12.6;   // nombre (negrita)
  const bodyFontSize = 11.8;   // resto
  const nameLine = 18;         // line-height del nombre
  const bodyLine = 16;         // line-height del cuerpo

  // Separación entre bloques (nombre/teléfono/dirección/etc.)
  const blockGap = 3;          // espacio consistente entre bloques

  // ---------- Helpers de texto (nunca pasar \n a drawText) ----------
  const sanitize = (s: string) =>
    (s ?? '').replace(/[\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim();

  const splitByNewlines = (s: string) =>
    (s ?? '').split(/\r?\n/).map(t => t.trim()).filter(Boolean);

  const breakLongToken = (
    token: string, font: PDFFont, maxWidth: number, size: number
  ) => {
    if (font.widthOfTextAtSize(token, size) <= maxWidth) return [token];
    const out: string[] = []; let buf = '';
    for (const ch of [...token]) {
      const test = buf + ch;
      if (font.widthOfTextAtSize(test, size) > maxWidth) { if (buf) out.push(buf); buf = ch; }
      else { buf = test; }
    }
    if (buf) out.push(buf);
    return out;
  };

  const wrapLine = (
    text: string, font: PDFFont, maxWidth: number, size: number
  ) => {
    const tokens = text.split(' ').filter(Boolean);
    const lines: string[] = []; let curr = '';
    const push = () => { if (curr) { lines.push(curr); curr = ''; } };
    for (const tok of tokens) {
      for (const p of breakLongToken(tok, font, maxWidth, size)) {
        const test = curr ? `${curr} ${p}` : p;
        if (font.widthOfTextAtSize(test, size) > maxWidth) { push(); curr = p; }
        else { curr = test; }
      }
    }
    push();
    return lines;
  };

  const makeWrappedBlock = (
    raw: string, font: PDFFont, maxWidth: number, size: number
  ) => {
    const clean = sanitize(raw); if (!clean) return [] as string[];
    const out: string[] = [];
    for (const h of splitByNewlines(clean)) out.push(...wrapLine(h, font, maxWidth, size));
    return out;
  };

  // --- Documento + fuentes estándar (Helvetica) ---
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let i = 0;

  for (const msg of messages) {
    if (i > 0 && i % (rows * cols) === 0) page = pdfDoc.addPage([pageWidth, pageHeight]);

    const slot = i % (rows * cols);
    const row = Math.floor(slot / cols), col = slot % cols;
    const x = margin + col * (cardWidth + gapX);
    const y = pageHeight - margin - (row + 1) * cardHeight - row * gapY;

    // Marco (diseño original)
    page.drawRectangle({
      x, y, width: cardWidth, height: cardHeight,
      borderColor: rgb(0.78, 0.78, 0.80), borderWidth: 1
    });

    // Área interna y medidas
    const innerLeft = x + padX;
    const innerRight = x + cardWidth - padX;
    const innerTop = y + cardHeight - padY;
    const innerBottom = y + padY;
    const maxWidth = innerRight - innerLeft;
    const availableH = innerTop - innerBottom;

    // Orden de campos (sin labels) con nombre y producto en negrita
    const rawFields: Array<{ text?: string | null; bold?: boolean; size?: number; line?: number }> = [
      { text: msg?.nombre, bold: true, size: nameFontSize, line: nameLine },
      { text: msg?.telefono, bold: false, size: bodyFontSize, line: bodyLine },
      { text: msg?.direccion, bold: false, size: bodyFontSize, line: bodyLine },
      { text: msg?.ciudad_departamento, bold: false, size: bodyFontSize, line: bodyLine },
      { text: msg?.observaciones, bold: false, size: bodyFontSize, line: bodyLine },
      { text: msg?.producto, bold: true, size: bodyFontSize, line: bodyLine }, // producto al final en bold
    ].filter(f => !!f.text);

    // 1) PREPARAR LAYOUT: envolver y medir todo para centrar verticalmente
    type Block = { lines: string[]; font: PDFFont; size: number; lineH: number };
    const blocks: Block[] = [];

    for (const f of rawFields) {
      const font = f.bold ? bold : regular;
      const size = f.size ?? bodyFontSize;
      const lineH = f.line ?? bodyLine;
      const lines = makeWrappedBlock(String(f.text), font, maxWidth, size);
      if (lines.length > 0) blocks.push({ lines, font, size, lineH });
    }

    // Alto total del contenido (líneas + gaps entre bloques)
    const totalHeight = blocks.reduce((acc, b, idx) => {
      const linesH = b.lines.length * b.lineH;
      const gap = idx === blocks.length - 1 ? 0 : blockGap;
      return acc + linesH + gap;
    }, 0);

    // 2) CALCULAR Y DEJAR CENTRADO VERTICAL (si cabe); si no, pegado arriba
    let startY: number;
    if (totalHeight <= availableH) {
      // centrado dentro del área útil
      const free = availableH - totalHeight;
      startY = innerTop - free / 2; // mismo respiro arriba y abajo
    } else {
      // no cabe → empezar arriba y dejar que recorte al fondo
      startY = innerTop;
    }

    // 3) PINTAR
    let cursorY = startY;
    for (const b of blocks) {
      for (const line of b.lines) {
        if (cursorY < innerBottom) break; // evita overflow
        page.drawText(line, {
          x: innerLeft,
          y: cursorY,
          size: b.size,
          font: b.font,
          color: rgb(0.1, 0.1, 0.12)
        });
        cursorY -= b.lineH;
      }
      cursorY -= blockGap;
      if (cursorY < innerBottom) break;
    }

    i++;
  }

  return await pdfDoc.save();
}
