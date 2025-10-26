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
 * Parser robusto para archivos de WhatsApp con soporte extendido:
 * ✅ Acepta ambos formatos:
 * [22/10/25, 8:41:55 a.m.] Daniel Jimenez: Nombre...
 * [22/10/25, 8:41:55 a.m.] Daniel Jimenez: Nombre...
 * 
 * Permite:
 * - Teléfonos con espacios o puntos.
 * - Ciudades sin coma (Bogota cundinamarca).
 * - Productos sin palabra "PRODUCTO".
 * - Formato con líneas extra (como ID o cédula).
 * - Campos opcionales (observaciones).
 */
export function parseTextFile(content: string): Message[] {
  const results: Message[] = [];

  // 🔍 Divide los mensajes por encabezados de WhatsApp
  const blocks = content
    .split(/\[\d{2}\/\d{2}\/\d{2},\s*\d{1,2}:\d{2}:\d{2}.*?\]/)
    .map(b => b.trim())
    .filter(Boolean);

  for (const block of blocks) {
    // 🗓️ Buscar fecha dentro del bloque
    const dateMatch = block.match(/(\d{2})\/(\d{2})\/(\d{2})/);
    let parsedDate = new Date().toISOString().slice(0, 10);

    if (dateMatch) {
      const [, dd, mm, yy] = dateMatch;
      if (parseInt(mm) >= 1 && parseInt(mm) <= 12 && parseInt(dd) >= 1 && parseInt(dd) <= 31) {
        parsedDate = `20${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      }
    }

    // 🧠 Separar líneas limpias
    const lines = block
      .split(/\n+/)
      .map(l => l.trim().replace(/\s+/g, ' '))
      .filter(Boolean);

    if (lines.length < 3) continue;

    // 👤 Nombre (después de “: ” si existe)
    const nameMatch = block.match(/:\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s.]+)\n/);
    const nombre = nameMatch ? nameMatch[1].trim() : lines[0];

    // 📞 Teléfono — acepta espacios o puntos dentro
    const telefonoMatch = block.match(/\b3[\d\s.]{7,}\b/);
    const telefono = telefonoMatch
      ? telefonoMatch[0].replace(/[^\d]/g, '') // limpia espacios y puntos
      : '';

    // 📍 Dirección
    const direccion =
      lines.find((l) =>
        /(calle|cra|cl|av|transv|carrera|transversal|mz|barrio|vereda|oficina)/i.test(l)
      ) || '';

    // 🏙️ Ciudad y departamento
    let ciudad_departamento = '';
    const cityIndex = direccion ? lines.indexOf(direccion) : -1;
    if (cityIndex !== -1) {
      const possibleCity = lines[cityIndex + 1] || '';
      ciudad_departamento = possibleCity
        .replace(/\./g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // 💊 Producto
    let productoLine =
      lines.find((l) => /(producto|combo|shilajit|suplemento|kit)/i.test(l)) || '';
    let cantidad = 1;
    let producto = productoLine;

    // Si no se encontró “PRODUCTO”, intenta la última línea como producto
    if (!productoLine && lines.length >= 3) {
      productoLine = lines[lines.length - 1];
      producto = productoLine;
    }

    // Detectar cantidad al inicio o al final (ej. “2 PRODUCTO N1”, “SHILAJIT X2”)
    const cantidadMatch = productoLine.match(/^(\d+)\s+/) || productoLine.match(/x(\d+)$/i);
    if (cantidadMatch) {
      cantidad = parseInt(cantidadMatch[1], 10);
      producto = producto.replace(/(\d+\s+|x\d+)$/i, '').trim();
    }

    // 📝 Observaciones (si existen)
    const obsMatch = block.match(/observaciones?:\s*(.+)$/i);
    const observaciones = obsMatch ? obsMatch[1].trim() : '';

    // ✅ Validación mínima
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
