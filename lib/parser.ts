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
    const results: Message[] = [];

    const blocks = content.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);

    for (const block of blocks) {
        const lines = block
            .split(/\n+/)
            .map(l => l.trim())
            .filter(l => l.length > 0);

        if (lines.length < 4) continue;

        let nombre = '';
        let telefono = '';
        let direccion = '';
        let ciudad_departamento = '';
        let producto = '';
        let observaciones = '';
        let fecha = targetDate;

        for (const line of lines) {
            if (/observaciones?/i.test(line)) {
                observaciones = line.replace(/observaciones?:?/i, '').trim();
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(line)) {
                fecha = line;
            } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(line)) {
                const [dd, mm, yyyy] = line.split('/');
                fecha = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
            }
        }

        nombre = nombre || lines[0];
        telefono = telefono || lines[1] || '';
        direccion = direccion || lines[2] || '';
        ciudad_departamento = ciudad_departamento || lines[3] || '';
        producto = producto || lines[4] || '';

        if (!nombre || !telefono || !direccion || !ciudad_departamento || !producto)
            continue;

        results.push({
            date: fecha,
            nombre,
            telefono,
            direccion,
            ciudad_departamento,
            producto,
            observaciones,
        });
    }

    return results;
}
