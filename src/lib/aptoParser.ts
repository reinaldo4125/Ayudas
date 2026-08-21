export interface ParsedApto {
  isParsed: boolean;
  sector: string;
  agrupacion: string;
  torre: string;
  apto: string;
  descripcion: string;
}

/**
 * Parses apartment codes like 4B42, 3E43, 2C21
 * - Default sector is "Sector 1" (supports 7 sectors: Sector 1 to Sector 7)
 * - 1st digit: Agrupación (e.g. 4 -> Agrupación 4)
 * - Letter: Torre (e.g. B -> Torre B)
 * - Last 2 digits: Apto (e.g. 42 -> Apto 42)
 * Generates full description: "Sector 1 Agrupación 4 Torre B Apto 42"
 */
export function parseAptoCode(direccion: string, customSector?: string): ParsedApto {
  let sectorToUse = customSector ? customSector.trim() : '';

  if (!direccion) {
    return {
      isParsed: false,
      sector: sectorToUse || 'Sector 1',
      agrupacion: 'Sector General',
      torre: '',
      apto: '',
      descripcion: ''
    };
  }

  const clean = direccion.trim();
  const lower = clean.toLowerCase();

  // Detect explicit sector in address text if not passed
  if (!sectorToUse) {
    const sectorMatch = lower.match(/sector[\s\-_]*([1-7])/i) || lower.match(/sec[\s\-_]*([1-7])/i);
    if (sectorMatch) {
      sectorToUse = `Sector ${sectorMatch[1]}`;
    } else {
      sectorToUse = 'Sector 1';
    }
  }

  // Detect external user / non-sector addresses
  if (lower.includes('externo') || lower.includes('fuera') || sectorToUse.toLowerCase().includes('externo')) {
    return {
      isParsed: false,
      sector: 'Usuarios Externos',
      agrupacion: 'Usuarios Externos',
      torre: 'Externo',
      apto: 'Ext',
      descripcion: 'Usuario Externo al Sector'
    };
  }

  // Match codes like 4B42, 2C15, 2 C 15, 2-C-15, etc.
  const match = clean.match(/(\d)[\s\-]*([A-Za-z])[\s\-]*(\d{1,3})/);

  if (match) {
    const agrupNum = match[1];
    const torreLetra = match[2].toUpperCase();
    const aptoNum = match[3];

    return {
      isParsed: true,
      sector: sectorToUse,
      agrupacion: `Agrupación ${agrupNum}`,
      torre: `Torre ${torreLetra}`,
      apto: `Apto ${aptoNum}`,
      descripcion: `${sectorToUse} Agrupación ${agrupNum} Torre ${torreLetra} Apto ${aptoNum}`
    };
  }

  // Match 3-digit codes like 242, 332, 544, 101, 311
  const match3Digits = clean.match(/^([1-7])(\d{2})$/);
  if (match3Digits) {
    const agrupNum = match3Digits[1];
    const aptoNum = match3Digits[2];
    return {
      isParsed: true,
      sector: sectorToUse,
      agrupacion: `Agrupación ${agrupNum}`,
      torre: 'General',
      apto: `Apto ${aptoNum}`,
      descripcion: `${sectorToUse} Agrupación ${agrupNum} Apto ${aptoNum}`
    };
  }

  return {
    isParsed: false,
    sector: sectorToUse,
    agrupacion: 'Sector General',
    torre: '',
    apto: '',
    descripcion: clean ? `${sectorToUse} - ${clean}` : sectorToUse
  };
}
