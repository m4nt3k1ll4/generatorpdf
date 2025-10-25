export type Message = {
    date: string;
    nombre: string;
    telefono: string;
    direccion: string;
    ciudad_departamento: string;
    producto: string;
    cantidad?: number;
    observaciones?: string;
};

/**
 * Parser robusto para archivos de WhatsApp con formato:
 * [22/10/25, 8:41:55 a.m.] Daniel Jimenez: Nombre
 * 3100000000
 * Dirección
 * Ciudad, Departamento
 * (Cantidad) PRODUCTO Nx
 * Observaciones: ...
 */
export function parseTextFile(content: string): Message[] {
  const results: Message[] = [];

  // Divide correctamente cada mensaje con encabezado tipo [22/10/25, 8:41:55 a.m.]
  const blocks = content.split(/\[(\d{2})\/(\d{2})\/(\d{2}),\s*\d{1,2}:\d{2}:\d{2}/);

  for (let i = 1; i < blocks.length; i += 4) {
    // 🗓️ Extraer día, mes, año del encabezado capturado
    const dd = blocks[i];
    const mm = blocks[i + 1];
    const yy = blocks[i + 2];
    const body = blocks[i + 3] || '';

    // Validar fecha (evita "00-00-00")
    let parsedDate = new Date().toISOString().slice(0, 10);
    if (dd && mm && yy && parseInt(dd) >= 1 && parseInt(mm) >= 1) {
      parsedDate = `20${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }

    // Extraer nombre
    const nameMatch = body.match(/:\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)\n/);
    const nombre = nameMatch ? nameMatch[1].trim() : '';

    // Dividir en líneas limpias
    const lines = body.split('\n').map(l => l.trim()).filter(Boolean);

    // Teléfono
    const telefono = lines.find(l => /\b3\d{9}\b/.test(l)) || '';

    // Dirección
    const direccion = lines.find(l =>
      /(calle|cra|cl|av|transv|carrera|transversal|manzana|mz|barrio|vereda)/i.test(l)
    ) || '';

    // Ciudad + departamento
    const cityIndex = direccion ? lines.indexOf(direccion) : -1;
    const ciudad_departamento =
      cityIndex !== -1 && lines[cityIndex + 1] ? lines[cityIndex + 1] : '';

    // Producto y cantidad
    const productoLine = lines.find(l => /producto/i.test(l)) || '';
    let cantidad = 1;
    let producto = productoLine;
    const cantidadMatch = productoLine.match(/^(\d+)\s+/);
    if (cantidadMatch) {
      cantidad = parseInt(cantidadMatch[1], 10);
      producto = productoLine.replace(/^(\d+)\s+/, '').trim();
    }

    // Observaciones
    const obsMatch = body.match(/observaciones?:\s*(.+)$/i);
    const observaciones = obsMatch ? obsMatch[1].trim() : '';

    // Solo agregar registros válidos
    if (nombre && telefono && direccion && ciudad_departamento && producto) {
      results.push({
        date: parsedDate,
        nombre,
        telefono,
        direccion,
        ciudad_departamento,
        producto,
        cantidad,
        observaciones,
      });
    }
  }

  return results;
}
