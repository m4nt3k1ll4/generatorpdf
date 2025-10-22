import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Message } from '@/lib/parser';

export async function generatePdfBytes(messages: Message[]) {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);

    const pageWidth = 595;
    const pageHeight = 842;
    const cols = 3;
    const rows = 3;
    const margin = 20;
    const cellW = (pageWidth - margin * 2) / cols;
    const cellH = (pageHeight - margin * 2) / rows;

    for (let i = 0; i < messages.length; i += cols * rows) {
        const page = doc.addPage([pageWidth, pageHeight]);

        for (let j = 0; j < cols * rows; j++) {
            const msg = messages[i + j];
            if (!msg) break;

            const col = j % cols;
            const row = Math.floor(j / cols);
            const x = margin + col * cellW;
            const y = pageHeight - margin - (row + 1) * cellH;

            page.drawRectangle({ x, y, width: cellW, height: cellH, borderWidth: 0.5 });

            const lines = [
                `Nombre: ${msg.nombre}`,
                `Tel: ${msg.telefono}`,
                `Dir: ${msg.direccion}`,
                `Ciudad: ${msg.ciudad_departamento}`,
                `Prod: ${msg.producto}`,
                msg.observaciones ? `Obs: ${msg.observaciones}` : '',
            ].filter(Boolean);

            let textY = y + cellH - 20;
            for (const line of lines) {
                page.drawText(line, { x: x + 10, y: textY, size: 9, font });
                textY -= 12;
            }
        }
    }

    return await doc.save();
}
