import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Message } from '@/lib/parser';

// 🧾 Genera un PDF con 9 tarjetas (3x3) por hoja
export async function generatePdfBytes(messages: Message[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const pageWidth = 595; // A4 width
  const pageHeight = 842; // A4 height
  const margin = 40;
  const cardWidth = (pageWidth - margin * 2) / 3;
  const cardHeight = (pageHeight - margin * 2) / 3;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let i = 0;

  for (const msg of messages) {
    if (i > 0 && i % 9 === 0) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
    }

    const cardIndex = i % 9;
    const row = Math.floor(cardIndex / 3);
    const col = cardIndex % 3;

    const x = margin + col * cardWidth;
    const y = pageHeight - margin - (row + 1) * cardHeight;

    // Dibujar borde de la tarjeta
    page.drawRectangle({
      x,
      y,
      width: cardWidth - 10,
      height: cardHeight - 10,
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 1,
    });

    // Texto
    const text = [
      msg.nombre,
      msg.telefono,
      msg.direccion,
      msg.ciudad_departamento,
      msg.producto,
      msg.observaciones ? `Obs: ${msg.observaciones}` : '',
    ].filter(Boolean).join('\n');

    page.drawText(text, {
      x: x + 10,
      y: y + cardHeight - 30,
      size: 10,
      font,
      color: rgb(0, 0, 0),
      lineHeight: 12,
    });

    i++;
  }

  return await pdfDoc.save();
}
