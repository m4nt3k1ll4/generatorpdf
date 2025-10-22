export type Message = {
    date: string;
    nombre: string;
    telefono: string;
    direccion: string;
    ciudad_departamento: string;
    producto: string;
    observaciones?: string;
    };

    export function parseTextFile(content: string, targetDate: string): Message[] {
    const blocks = content.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
    const results: Message[] = [];

    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 5) continue;
        const [nombre, telefono, direccion, ciudad_departamento, producto, ...rest] = lines;

        const dateMatch = block.match(/\b(\d{4}-\d{2}-\d{2})\b/) ?? block.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
        let parsedDate = targetDate;
        if (dateMatch) {
        const d = dateMatch[1];
        if (d.includes('/')) {
            const [dd, mm, yyyy] = d.split('/');
            parsedDate = `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
        } else parsedDate = d;
        }
        if (targetDate && parsedDate !== targetDate) continue;

        results.push({
        date: parsedDate,
        nombre,
        telefono,
        direccion,
        ciudad_departamento,
        producto,
        observaciones: rest.length ? rest.join(' ') : ''
        });
    }
    return results;
}
