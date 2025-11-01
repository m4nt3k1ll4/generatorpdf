import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Message } from '@/lib/parser';

// 🧾 Genera un PDF con 9 tarjetas (3x3) por hoja con formato limpio
export async function generatePdfBytes(messages: Message[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const pageWidth = 595; // A4 width
  const pageHeight = 842; // A4 height
  const margin = 40;
  const cardWidth = (pageWidth - margin * 2) / 3;
  const cardHeight = (pageHeight - margin * 2) / 3;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let i = 0;

  for (const msg of messages) {
    // Crear nueva página cada 9 tarjetas
    if (i > 0 && i % 9 === 0) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
    }

    const cardIndex = i % 9;
    const row = Math.floor(cardIndex / 3);
    const col = cardIndex % 3;

    const x = margin + col * cardWidth;
    const y = pageHeight - margin - (row + 1) * cardHeight;

    // 🟦 Dibujar borde de la tarjeta
    page.drawRectangle({
      x,
      y,
      width: cardWidth - 10,
      height: cardHeight - 10,
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 1,
    });

    // 📄 Preparar texto con formato
    const lines = [
      msg.nombre,
      msg.cedula,
      msg.telefono,
      msg.direccion,
      msg.ciudad_departamento,
      msg.producto,
      msg.observaciones ? `Obs: ${msg.observaciones}` : '',
    ].filter(Boolean);

    // ✏️ Coordenadas iniciales de texto
    let textY = y + cardHeight - 25;
    const lineHeight = 12;
    const fontSize = 10;
    const textX = x + 10;
    const maxWidth = cardWidth - 25;

    for (const line of lines) {
      if (!line) continue;
      const words = line.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth) {
          page.drawText(currentLine, { x: textX, y: textY, size: fontSize, font });
          textY -= lineHeight;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      // Dibujar la última línea del bloque
      if (currentLine) {
        page.drawText(currentLine, { x: textX, y: textY, size: fontSize, font });
        textY -= lineHeight;
      }
    }

    i++;
  }

  return await pdfDoc.save();
}
