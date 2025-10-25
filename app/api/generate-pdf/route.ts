import { NextResponse } from 'next/server';
import { generatePdfBytes } from '@/lib/pdfGenerator';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    const pdfBytes = await generatePdfBytes(messages);

    // ✅ Envolver en un Blob (tipo válido para NextResponse)
    return new NextResponse(new Blob([pdfBytes], { type: 'application/pdf' }), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="rotulos.pdf"',
      },
    });
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 });
  }
}
