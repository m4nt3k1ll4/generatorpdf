import type { NextApiRequest, NextApiResponse } from 'next';
import { generatePdfBytes } from '@/lib/pdfGenerator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();
    try {
        const { messages } = req.body;
        if (!Array.isArray(messages)) {
            return res.status(400).json({ error: 'messages array required' });
        }

        const pdfBytes = await generatePdfBytes(messages);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=rotulos.pdf');
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error generando PDF' });
    }
}
