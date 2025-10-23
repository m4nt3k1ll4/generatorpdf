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

  // Divide por cada encabezado de mensaje de WhatsApp
  const blocks = content.split(/\[\d{2}\/\d{2}\/\d{2},\s*\d{1,2}:\d{2}:\d{2}/).slice(1);

  for (const block of blocks) {
    // Extraer la fecha del encabezado
    const dateMatch = block.match(/^(\d{2})\/(\d{2})\/(\d{2})/);
    const [dd, mm, yy] = dateMatch ? [dateMatch[1], dateMatch[2], dateMatch[3]] : ['00', '00', '00'];
    const parsedDate = `20${yy}-${mm}-${dd}`;

    // Extraer el nombre del cliente
    const nameMatch = block.match(/:\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)\n/);
    const nombre = nameMatch ? nameMatch[1].trim() : '';

    // Dividir líneas útiles
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);

    // Teléfono (primer número de 10 dígitos)
    const telefono = lines.find((l) => /\b3\d{9}\b/.test(l)) || '';

    // Dirección (línea con palabra típica)
    const direccion =
      lines.find((l) =>
        /(calle|cra|cl|av|transv|carrera|transversal|manzana|mz|barrio|vereda)/i.test(l)
      ) || '';

    // Ciudad y departamento (siguiente línea después de dirección)
    const cityIndex = direccion ? lines.indexOf(direccion) : -1;
    const ciudad_departamento =
      cityIndex !== -1 && lines[cityIndex + 1] ? lines[cityIndex + 1] : '';

    // Producto y cantidad
    const productoLine = lines.find((l) => /producto/i.test(l)) || '';
    let cantidad = 1;
    let producto = productoLine;

    const cantidadMatch = productoLine.match(/^(\d+)\s+/);
    if (cantidadMatch) {
      cantidad = parseInt(cantidadMatch[1], 10);
      producto = productoLine.replace(/^(\d+)\s+/, '').trim();
    }

    // Observaciones
    const obsMatch = block.match(/observaciones?:\s*(.+)$/i);
    const observaciones = obsMatch ? obsMatch[1].trim() : '';

    // Validar que existan los mínimos requeridos
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
