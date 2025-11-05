import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import type { Message } from '@/lib/parser';

/** PDF 3x3 con diseño simple, con “Producto” y “Total” al final y anti-overflow para reservarlos. */
export async function generatePdfBytes(messages: Message[]): Promise<Uint8Array> {
  // --- Página y grilla ---
  const pageWidth = 595, pageHeight = 842;      // A4 en puntos
  const margin = 36, cols = 3, rows = 3;
  const gapX = 12, gapY = 12;

  const cardWidth = (pageWidth - margin * 2 - gapX * (cols - 1)) / cols;
  const cardHeight = (pageHeight - margin * 2 - gapY * (rows - 1)) / rows;

  // --- Padding interior del rectángulo ---
  const padX = 16;
  const padY = 16;

  // --- Tipografías / jerarquía ---
  const nameFontSize = 12.6;   // nombre (negrita)
  const bodyFontSize = 11.8;   // resto
  const priceFontSize = 12.2;  // precio (levemente más grande)
  const nameLine = 18;         // line-height del nombre
  const bodyLine = 16;         // line-height del cuerpo
  const priceLine = 17;        // line-height del precio

  // Separación entre bloques
  const blockGap = 3;

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

  // Dinero COP
  const money = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

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

    // Orden de campos (sin labels). “Producto” y “Total” al final.
    const hasPrice = typeof msg?.precio === 'number';
    const priceText = hasPrice ? `${money(msg!.precio as number)}` : '';

    const rawFields: Array<{ text?: string | null; bold?: boolean; size?: number; line?: number; isTail?: boolean }> = [
      { text: msg?.nombre, bold: true, size: nameFontSize, line: nameLine, isTail: false },
      { text: msg?.telefono, bold: false, size: bodyFontSize, line: bodyLine, isTail: false },
      { text: msg?.direccion, bold: false, size: bodyFontSize, line: bodyLine, isTail: false },
      { text: msg?.ciudad_departamento, bold: false, size: bodyFontSize, line: bodyLine, isTail: false },
      { text: msg?.observaciones, bold: false, size: bodyFontSize, line: bodyLine, isTail: false },

      // TAIL (siempre deben verse):
      { text: msg?.producto, bold: true, size: bodyFontSize, line: bodyLine, isTail: true },
      ...(hasPrice ? [{ text: priceText, bold: true, size: priceFontSize, line: priceLine, isTail: true }] : []),
    ].filter(f => !!f.text);

    // 1) PREPARAR LAYOUT: envolver y medir todo
    type Block = { lines: string[]; font: PDFFont; size: number; lineH: number; isTail: boolean };
    const blocks: Block[] = [];

    for (const f of rawFields) {
      const font = f.bold ? bold : regular;
      const size = f.size ?? bodyFontSize;
      const lineH = f.line ?? bodyLine;
      const lines = makeWrappedBlock(String(f.text), font, maxWidth, size);
      if (lines.length > 0) blocks.push({ lines, font, size, lineH, isTail: !!f.isTail });
    }

    // Alto total con gaps
    const totalHeight = blocks.reduce((acc, b, idx) => {
      const linesH = b.lines.length * b.lineH;
      const gap = idx === blocks.length - 1 ? 0 : blockGap;
      return acc + linesH + gap;
    }, 0);

    // 2) Si no cabe, recorta arriba para reservar TAIL (producto + precio)
    if (totalHeight > availableH) {
      // Altura mínima a reservar para los bloques de cola (TAIL)
      const tailBlocks = [...blocks].reverse().filter(b => b.isTail).reverse(); // en orden natural
      const tailHeight = tailBlocks.reduce((acc, b, idx) => {
        const linesH = b.lines.length * b.lineH;
        const gap = idx === tailBlocks.length - 1 ? 0 : blockGap;
        return acc + linesH + gap;
      }, 0);

      // Altura disponible para la "cabeza"
      const headAvailable = Math.max(0, availableH - tailHeight);
      // Índice del primer tail en la lista blocks
      const firstTailIndex = blocks.findIndex(b => b.isTail);
      const headBlocks = blocks.slice(0, firstTailIndex); // solo los NO tail
      const tailAndAfter = blocks.slice(firstTailIndex);

      // Altura actual de la cabeza
      const headHeight = headBlocks.reduce((acc, b, idx) => {
        const linesH = b.lines.length * b.lineH;
        const gap = headBlocks.length && idx === headBlocks.length - 1 ? blockGap : blockGap; // gap estándar
        return acc + linesH + (idx === headBlocks.length - 1 ? 0 : gap);
      }, 0);

      if (headHeight > headAvailable) {
        // Recortamos líneas desde el último head hacia atrás hasta que quepa
        let needReduce = headHeight - headAvailable;

        for (let hi = headBlocks.length - 1; hi >= 0 && needReduce > 0; hi--) {
          const b = headBlocks[hi];
          while (b.lines.length > 0 && needReduce > 0) {
            b.lines.pop();
            needReduce -= b.lineH;
          }
          // Si el bloque quedó vacío, también “recupera” un gap (aprox) quitado
          if (b.lines.length === 0 && hi < headBlocks.length - 1) {
            needReduce -= blockGap;
          }
        }
      }

      // Reconstruir blocks con head recortada + tail intacta
      const newHead = headBlocks.filter(b => b.lines.length > 0);
      const newBlocks = [...newHead, ...tailAndAfter];
      blocks.splice(0, blocks.length, ...newBlocks);
    }

    // 3) Calcular punto de inicio (centrado si cabe)
    const newTotalHeight = blocks.reduce((acc, b, idx) => {
      const linesH = b.lines.length * b.lineH;
      const gap = idx === blocks.length - 1 ? 0 : blockGap;
      return acc + linesH + gap;
    }, 0);

    let startY: number;
    if (newTotalHeight <= availableH) {
      const free = availableH - newTotalHeight;
      startY = innerTop - free / 2;
    } else {
      startY = innerTop;
    }

    // 4) Pintar
    let cursorY = startY;
    for (const b of blocks) {
      for (const line of b.lines) {
        if (cursorY < innerBottom) break;
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
