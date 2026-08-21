import { parseAptoCode } from './aptoParser';

export interface CSVImportRecord {
  no?: number;
  direccion: string;
  nombre: string;
  tipoDocumento?: string;
  cedula: string;
  telefono: string;
  sector?: string;
  agrupacion?: string;
  descripcion?: string;
  integrantesHogar?: number;
  prioridadEspecial?: boolean;
  fechaEntrega?: string;
  queSeEntrego?: string;
  responsable?: string;
  observaciones?: string;
}

export function parseCSVDate(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) {
    return new Date().toISOString();
  }
  const clean = dateStr.trim();

  // Try parsing DD/MM/YYYY or DD-MM-YYYY or DD/MM/YYYY HH:mm
  const slashMatch = clean.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10) - 1;
    let year = parseInt(slashMatch[3], 10);
    if (year < 100) year += 2000;
    const hour = slashMatch[4] ? parseInt(slashMatch[4], 10) : 12;
    const min = slashMatch[5] ? parseInt(slashMatch[5], 10) : 0;
    const dateObj = new Date(year, month, day, hour, min);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString();
    }
  }

  // Fallback to standard JS Date parsing
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return new Date().toISOString();
}

export function normalizeTipoDocumento(str?: string): 'CC' | 'TI' | 'CE' | 'PASAPORTE' | 'PPT' | 'OTRO' {
  if (!str) return 'CC';
  const clean = str.trim().toUpperCase();
  if (clean === 'TI' || clean.includes('TARJETA') || clean.includes('IDENTIDAD')) return 'TI';
  if (clean === 'CE' || clean.includes('EXTRANJER')) return 'CE';
  if (clean === 'PPT' || clean.includes('PROTECCION') || clean.includes('PERMISO')) return 'PPT';
  if (clean === 'PAS' || clean.includes('PASAPORTE')) return 'PASAPORTE';
  if (clean === 'CC' || clean.includes('CEDULA') || clean.includes('CIUDADANIA')) return 'CC';
  if (clean === 'OTRO' || clean.includes('S/N') || clean === 'SN') return 'OTRO';
  return 'CC';
}

export function parseBeneficiariesCSV(csvText: string): CSVImportRecord[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse row supporting quotes and commas/semicolons/tabs
  const parseRow = (rowStr: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    // Auto-detect delimiter from first row if needed
    const delimiter = (rowStr.includes(';') && !rowStr.includes(',')) ? ';' : 
                      (rowStr.includes('\t') && !rowStr.includes(',')) ? '\t' : ',';

    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const rawHeaders = parseRow(lines[0]);
  const headers = rawHeaders.map(h => 
    h.toLowerCase()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .trim()
  );

  let noIndex = headers.findIndex(h => h === 'item' || h === 'no' || h === '#' || h === 'item_no' || h.includes('consecutivo') || h.includes('orden') || h.includes('id'));
  let dirIndex = headers.findIndex(h => h.includes('direccion') || h.includes('apto') || h.includes('apartamento') || h.includes('ubicacion'));
  let nameIndex = headers.findIndex(h => h.includes('nombre') || h.includes('beneficiario') || h.includes('persona'));
  let tipoDocIndex = headers.findIndex(h => h.includes('tipo_doc') || h.includes('tipo doc') || h.includes('tipodoc') || h.includes('tipo_identificacion') || h.includes('tipo id') || (h.includes('tipo') && !h.includes('entrego')));
  let cedulaIndex = headers.findIndex(h => h.includes('cedula') || h.includes('cc') || h.includes('identificacion') || h.includes('documento') || h.includes('numero'));
  let phoneIndex = headers.findIndex(h => h.includes('telefono') || h.includes('celular') || h.includes('contacto'));
  let sectorIndex = headers.findIndex(h => h.includes('sector') || h.includes('sec'));

  let dateIndex = headers.findIndex(h => h.includes('fecha') || h.includes('date') || h.includes('dia') || h.includes('hora'));
  let itemIndex = headers.findIndex(h => h.includes('entrego') || h.includes('entregado') || h.includes('articulo') || h.includes('insumo') || h.includes('mercado') || h.includes('producto') || h.includes('detalle') || h.includes('item_entregado'));
  let respIndex = headers.findIndex(h => h.includes('responsable') || h.includes('quien') || h.includes('operador') || h.includes('firmado'));
  let obsIndex = headers.findIndex(h => h.includes('observacion') || h.includes('observaciones') || h.includes('nota') || h.includes('comentario'));

  // Fallbacks based on standard column position [ITEM, Sector, Dirección, Nombre, Tipo Documento, Cédula, Teléfono, Fecha Entrega, Que se entrego, Observaciones]
  if (dirIndex === -1) {
    if (headers.length >= 2) dirIndex = 1;
    else if (headers.length >= 1) dirIndex = 0;
  }
  if (nameIndex === -1) {
    if (headers.length >= 3) nameIndex = 2;
    else if (headers.length >= 2) nameIndex = 1;
  }
  if (cedulaIndex === -1) {
    if (headers.length >= 5) cedulaIndex = 4;
    else if (headers.length >= 4) cedulaIndex = 3;
    else if (headers.length >= 3) cedulaIndex = 2;
  }
  if (phoneIndex === -1) {
    if (headers.length >= 6) phoneIndex = 5;
    else if (headers.length >= 5) phoneIndex = 4;
  }

  const results: CSVImportRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (row.length === 0 || row.every(cell => !cell || cell.trim() === '')) continue;

    let rawItemNo = noIndex !== -1 ? parseInt((row[noIndex] || '').trim(), 10) : NaN;
    let itemNo = !isNaN(rawItemNo) && rawItemNo > 0 ? rawItemNo : undefined;

    let direccion = (row[dirIndex] || `Apto ${i}`).trim();
    let nombre = (row[nameIndex] || 'Beneficiario').trim();
    let rawTipoDoc = tipoDocIndex !== -1 ? (row[tipoDocIndex] || '').trim() : '';
    let rawCedula = (row[cedulaIndex] || '').trim();
    let telefono = (row[phoneIndex] || '').trim();
    let rawSector = sectorIndex !== -1 ? (row[sectorIndex] || '').trim() : '';

    let sectorVal = 'Sector 1';
    if (rawSector) {
      if (/^[1-7]$/.test(rawSector)) {
        sectorVal = `Sector ${rawSector}`;
      } else if (rawSector.toLowerCase().includes('sector')) {
        sectorVal = rawSector;
      } else {
        sectorVal = rawSector;
      }
    }

    let tipoDocumento: string = 'CC';
    if (rawTipoDoc) {
      tipoDocumento = normalizeTipoDocumento(rawTipoDoc);
    } else if (rawCedula) {
      const prefixMatch = rawCedula.match(/^(CC|C\.C\.|TI|T\.I\.|CE|C\.E\.|PPT|PASAPORTE|PAS|OTRO)[\s\-:]*(.*)$/i);
      if (prefixMatch) {
        tipoDocumento = normalizeTipoDocumento(prefixMatch[1]);
        rawCedula = prefixMatch[2].trim();
      }
    }

    // Clean up Cédula: If rawCedula says "Usuario externo", "ext", or matches direccion, or is non-numeric text
    let cedula = rawCedula;
    const isCedulaExternal = !rawCedula || 
      rawCedula.toLowerCase().includes('externo') || 
      rawCedula.toLowerCase().includes('ext') ||
      rawCedula.toLowerCase() === direccion.toLowerCase();

    if (isCedulaExternal) {
      // Look for a numeric ID in another cell of this row (e.g., 6 to 11 digits)
      const numericCell = row.find(cell => /^\d{6,11}$/.test(cell.trim()));
      if (numericCell) {
        cedula = numericCell.trim();
      } else {
        cedula = 'S/N';
        if (!rawTipoDoc) tipoDocumento = 'OTRO';
      }
    }

    const fechaEntrega = dateIndex !== -1 ? (row[dateIndex] || '').trim() : undefined;
    const queSeEntrego = itemIndex !== -1 ? (row[itemIndex] || '').trim() : undefined;
    const responsable = respIndex !== -1 ? (row[respIndex] || '').trim() : undefined;
    const observaciones = obsIndex !== -1 ? (row[obsIndex] || '').trim() : undefined;

    const isExternalDir = direccion.toLowerCase().includes('externo') || direccion.toLowerCase().includes('fuera') || sectorVal.toLowerCase().includes('externo');
    if (isExternalDir) {
      direccion = 'Usuario Externo';
      sectorVal = 'Usuarios Externos';
    }

    const parsed = parseAptoCode(direccion, sectorVal);

    results.push({
      no: itemNo,
      direccion,
      nombre,
      tipoDocumento,
      cedula,
      telefono,
      sector: isExternalDir ? 'Usuarios Externos' : parsed.sector,
      agrupacion: isExternalDir ? 'Usuarios Externos' : parsed.agrupacion,
      descripcion: isExternalDir ? 'Usuario Externo al Sector' : parsed.descripcion,
      integrantesHogar: 1,
      prioridadEspecial: false,
      fechaEntrega,
      queSeEntrego,
      responsable,
      observaciones
    });
  }

  return results;
}

export function downloadCSVTemplate() {
  const content = `ITEM,Sector,Dirección,Nombre,Tipo Documento,Cédula,Teléfono,Fecha Entrega,Que se entrego,Observaciones
1,Sector 1,4B42,María Pérez,CC,1130608151,3150000000,2026-08-20 09:30,Mercado Familiar de Alimentos,Entregado completo en recepción
2,Sector 1,3E43,Carlos Rodríguez,TI,1020304050,3180000000,2026-08-20 10:15,Mercado + Kit de Aseo,Retirado por persona autorizada
3,Sector 2,2C21,Ana Gómez,CC,1130608153,3000000000,,,Pendiente por entregar mercado (Sector 2)
4,Usuarios Externos,Usuario Externo,Flor Eliza,CE,987654321,3150000000,,,Usuario fuera del sector (no pertenece a ningún apto)
5,Sector 3,1A11,Jean Pierre,PPT,554433221,3110000000,,,Sector 3 Residente`;

  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Plantilla_Censo_Entregas_Mercado.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

