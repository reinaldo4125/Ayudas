import { Beneficiary, InventoryItem, DeliveryRecord, SummaryStats, InventoryMovement, PropertyRecord } from '../types';
import { seedBeneficiaries } from '../data/seedBeneficiaries';
import { seedInventory } from '../data/seedInventory';
import { parseAptoCode } from './aptoParser';
import { SeedCensus } from '../data/seedCensusData';

export function isDevEnv(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  const metaEnv = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
  return Boolean(metaEnv?.DEV) || host.includes('-dev-') || host.includes('localhost') || host === '127.0.0.1';
}

const BASE_KEYS = {
  BENEFICIARIES: 'chiminangos_beneficiaries_v4',
  INVENTORY: 'chiminangos_inventory_v3',
  DELIVERIES: 'chiminangos_deliveries_v4',
  MOVEMENTS: 'chiminangos_movements_v2',
  PROPERTIES: 'chiminangos_properties_v1',
  INITIALIZED: 'chiminangos_db_initialized_v2',
};

function getKey(key: keyof typeof BASE_KEYS): string {
  const base = BASE_KEYS[key];
  return isDevEnv() ? `dev_${base}` : base;
}

function cleanDirectionToAptoOnly(dir: string): string {
  if (!dir) return '';
  const trimmed = dir.trim();
  const match = trimmed.match(/^(?:Agrup(?:ación)?\s*\d+\s*-\s*)(.+)$/i);
  if (match) {
    return match[1].trim();
  }
  return trimmed;
}

// Initialize or get stored data
export function getStoredBeneficiaries(): Beneficiary[] {
  try {
    const raw = localStorage.getItem(getKey('BENEFICIARIES'));
    const isInitialized = localStorage.getItem(getKey('INITIALIZED'));
    if (!raw) {
      if (isInitialized) {
        return [];
      }
      localStorage.setItem(getKey('INITIALIZED'), 'true');
      saveBeneficiaries(seedBeneficiaries);
      return seedBeneficiaries;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 0) {
      if (isInitialized) {
        return [];
      }
      return [];
    }
    const sanitized = parsed.map((b: Beneficiary) => {
      const isExternal = (b.direccion || '').toLowerCase().includes('externo') || (b.sector || '').toLowerCase().includes('externo');
      const cleanDir = isExternal ? 'Usuario Externo' : cleanDirectionToAptoOnly(b.direccion);
      const isCensusUpdated = b.censoActualizado === true;
      const hasDeliveries = (b.historialEntregas || []).length > 0;
      return {
        ...b,
        direccion: cleanDir,
        estadoEntrega: b.estadoEntrega || (hasDeliveries ? 'ENTREGADO' : 'PENDIENTE'),
        integrantesHogar: isCensusUpdated ? (b.integrantesHogar || 0) : 0,
        censoActualizado: isCensusUpdated,
        historialEntregas: (b.historialEntregas || []).map(d => ({
          ...d,
          beneficiarioDireccion: isExternal ? 'Usuario Externo' : cleanDirectionToAptoOnly(d.beneficiarioDireccion)
        }))
      };
    });
    saveBeneficiaries(sanitized);
    return sanitized;
  } catch (err) {
    console.error('Error reading beneficiaries from storage', err);
    return [];
  }
}

export function saveBeneficiaries(data: Beneficiary[]) {
  localStorage.setItem(getKey('INITIALIZED'), 'true');
  localStorage.setItem(getKey('BENEFICIARIES'), JSON.stringify(data));
}

export function getStoredInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(getKey('INVENTORY'));
    if (!raw) {
      saveInventory(seedInventory);
      return seedInventory;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading inventory from storage', err);
    return seedInventory;
  }
}

export function saveInventory(data: InventoryItem[]) {
  localStorage.setItem(getKey('INVENTORY'), JSON.stringify(data));
}

export function getStoredDeliveries(): DeliveryRecord[] {
  try {
    const raw = localStorage.getItem(getKey('DELIVERIES'));
    const isInitialized = localStorage.getItem(getKey('INITIALIZED'));
    if (!raw) {
      if (isInitialized) return [];
      const defaultDeliveries = seedBeneficiaries.flatMap(b => b.historialEntregas || []);
      saveDeliveries(defaultDeliveries);
      return defaultDeliveries;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 0) {
      return [];
    }
    const sanitized = parsed.map((d: DeliveryRecord) => {
      const isExternal = (d.beneficiarioDireccion || '').toLowerCase().includes('externo') || (d.sector || '').toLowerCase().includes('externo');
      const cleanDir = isExternal ? 'Usuario Externo' : cleanDirectionToAptoOnly(d.beneficiarioDireccion);
      return {
        ...d,
        beneficiarioDireccion: cleanDir
      };
    });
    saveDeliveries(sanitized);
    return sanitized;
  } catch (err) {
    console.error('Error reading deliveries from storage', err);
    return [];
  }
}

export function saveDeliveries(data: DeliveryRecord[]) {
  localStorage.setItem(getKey('INITIALIZED'), 'true');
  localStorage.setItem(getKey('DELIVERIES'), JSON.stringify(data));
}

export function resetAllDataToSeed(): {
  beneficiaries: Beneficiary[];
  inventory: InventoryItem[];
  deliveries: DeliveryRecord[];
} {
  localStorage.removeItem(getKey('BENEFICIARIES'));
  localStorage.removeItem(getKey('INVENTORY'));
  localStorage.removeItem(getKey('DELIVERIES'));
  localStorage.removeItem(getKey('MOVEMENTS'));

  const beneficiaries = getStoredBeneficiaries();
  const inventory = getStoredInventory();
  const deliveries = getStoredDeliveries();

  return { beneficiaries, inventory, deliveries };
}

export function clearBeneficiariesAndDeliveries(): {
  beneficiaries: Beneficiary[];
  deliveries: DeliveryRecord[];
  inventory: InventoryItem[];
} {
  saveBeneficiaries([]);
  saveDeliveries([]);

  const currentInventory = getStoredInventory();
  const resetInventory = currentInventory.map(item => ({
    ...item,
    stockEntregado: 0,
    stockActual: item.stockInicial > 0 ? item.stockInicial : (item.stockActual + item.stockEntregado)
  }));
  saveInventory(resetInventory);

  return {
    beneficiaries: [],
    deliveries: [],
    inventory: resetInventory
  };
}

export function calculateSummaryStats(
  beneficiaries: Beneficiary[],
  inventory: InventoryItem[],
  deliveries: DeliveryRecord[]
): SummaryStats {
  const totalBeneficiarios = beneficiaries.length;

  const entregasResidentes = deliveries.filter(d => {
    const dir = (d.beneficiarioDireccion || '').toLowerCase();
    const sec = (d.sector || '').toLowerCase();
    return !dir.includes('externo') && !sec.includes('externo');
  }).length;

  const entregasExternos = deliveries.filter(d => {
    const dir = (d.beneficiarioDireccion || '').toLowerCase();
    const sec = (d.sector || '').toLowerCase();
    return dir.includes('externo') || sec.includes('externo');
  }).length;

  // Group beneficiaries and deliveries by unique apartment key (excluding external)
  const aptMap = new Map<string, {
    direccion: string;
    descripcion: string;
    sector: string;
    agrupacion: string;
    deliveriesCount: number;
    residentsCount: number;
  }>();

  beneficiaries.forEach(b => {
    const isExternal = b.direccion.toLowerCase().includes('externo') || 
                       b.agrupacion?.toLowerCase().includes('externo') ||
                       (b.sector || '').toLowerCase().includes('externo');
    if (isExternal) return;

    const parsed = parseAptoCode(b.direccion, b.sector);
    const key = (parsed.descripcion || b.direccion).trim().toLowerCase();

    if (!aptMap.has(key)) {
      aptMap.set(key, {
        direccion: b.direccion,
        descripcion: parsed.descripcion || b.direccion,
        sector: b.sector || 'Sector 1',
        agrupacion: b.agrupacion || parsed.agrupacion || 'Sector General',
        deliveriesCount: 0,
        residentsCount: 0
      });
    }

    const apt = aptMap.get(key)!;
    apt.residentsCount += 1;
  });

  // Calculate deliveries for each apartment key
  aptMap.forEach((apt, key) => {
    const aptDeliveries = deliveries.filter(d => {
      const isExt = d.beneficiarioDireccion.toLowerCase().includes('externo') || (d.sector || '').toLowerCase().includes('externo');
      if (isExt) return false;
      const dParsed = parseAptoCode(d.beneficiarioDireccion, d.sector);
      const dKey = (dParsed.descripcion || d.beneficiarioDireccion).trim().toLowerCase();
      return dKey === key || d.beneficiarioDireccion.trim().toLowerCase() === apt.direccion.trim().toLowerCase();
    });
    apt.deliveriesCount = aptDeliveries.length;
  });

  const totalAptosUnicos = aptMap.size;
  const aptosConEntrega = Array.from(aptMap.values()).filter(a => a.deliveriesCount > 0).length;
  const aptosConMultiplesEntregas = Array.from(aptMap.values()).filter(a => a.deliveriesCount > 1).length;

  const totalMercadosEntregados = deliveries.length;
  const beneficiariosEntregados = beneficiaries.filter(b => b.estadoEntrega === 'ENTREGADO').length;
  const beneficiariosPendientes = beneficiaries.filter(b => b.estadoEntrega === 'PENDIENTE').length;

  const porcentajeCobertura = totalAptosUnicos > 0
    ? Math.round((aptosConEntrega / totalAptosUnicos) * 100)
    : 0;

  const totalInsumosEntregados = inventory.reduce((acc, curr) => acc + curr.stockEntregado, 0);
  const totalStockDisponible = inventory.reduce((acc, curr) => acc + curr.stockActual, 0);
  const itemsStockBajo = inventory.filter(item => item.stockActual <= item.stockMinimoAlerta).length;

  return {
    totalBeneficiarios,
    totalAptosUnicos,
    aptosConEntrega,
    aptosConMultiplesEntregas,
    totalMercadosEntregados,
    entregasResidentes,
    entregasExternos,
    beneficiariosEntregados,
    beneficiariosPendientes,
    porcentajeCobertura,
    totalInsumosEntregados,
    totalStockDisponible,
    itemsStockBajo
  };
}

// Export data to CSV
export function exportBeneficiariesToCSV(beneficiaries: Beneficiary[]) {
  const headers = ['#', 'Sector', 'Nombre', 'Tipo Documento', 'Cédula', 'Dirección', 'Agrupación', 'Teléfono', 'Integrantes', 'Estado Entrega', 'Fecha Entrega', 'Observaciones'];
  const rows = beneficiaries.map(b => [
    b.no,
    `"${b.sector || 'Sector 1'}"`,
    `"${b.nombre.replace(/"/g, '""')}"`,
    `"${b.tipoDocumento || 'CC'}"`,
    `"${b.cedula}"`,
    `"${b.direccion.replace(/"/g, '""')}"`,
    `"${b.agrupacion}"`,
    `"${b.telefono}"`,
    b.integrantesHogar,
    b.estadoEntrega,
    b.fechaUltimaEntrega ? new Date(b.fechaUltimaEntrega).toLocaleString() : 'N/A',
    `"${(b.observaciones || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Beneficiarios_Chiminangos_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportDeliveriesToCSV(deliveries: DeliveryRecord[], customFilename?: string) {
  const headers = ['ID Entrega', 'Sector', 'Beneficiario', 'Tipo Doc.', 'Cédula', 'Dirección', 'Agrupación', 'Fecha', 'Insumos Entregados', 'Integrantes Hogar', 'Responsable', 'Estado'];
  const rows = deliveries.map(d => {
    const articulosStr = d.articulos.map(a => `${a.cantidad}x ${a.itemNombre}`).join(' | ');
    return [
      `"${d.id}"`,
      `"${d.sector || 'Sector 1'}"`,
      `"${d.beneficiarioNombre.replace(/"/g, '""')}"`,
      `"${d.beneficiarioTipoDocumento || 'CC'}"`,
      `"${d.beneficiarioCedula}"`,
      `"${d.beneficiarioDireccion.replace(/"/g, '""')}"`,
      `"${d.agrupacion}"`,
      new Date(d.fecha).toLocaleString('es-CO'),
      `"${articulosStr}"`,
      (d.integrantesHogar || 3).toString(),
      `"${d.responsable}"`,
      d.estado
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', customFilename || `Reporte_Entregas_Chiminangos_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportVulnerabilitiesToCSV(beneficiaries: Beneficiary[]) {
  const headers = [
    '#',
    'Sector',
    'Nombre',
    'Cédula',
    'Dirección',
    'Teléfono',
    'Tiene Niños',
    'Detalle Niños (Pañales/Leche)',
    'Tiene Adulto Mayor',
    'Detalle Adultos (Pañales)',
    'Tiene Discapacidad',
    'Detalle Discapacidad',
    'Tiene Mascotas',
    'Censo de Mascotas (Alimento)'
  ];
  const rows: string[][] = [];

  beneficiaries.forEach(b => {
    const v = b.vulnerabilidades;
    if (!v || (!v.tieneNinos && !v.tieneAdultoMayor && !v.tieneDiscapacidad && !v.tieneMascotas)) return;

    const ninosStr = (v.ninosInfo || []).map(c => `${c.edad} ${c.requierePanales ? `(Pañal ${c.etapaPanal || 'E2'})` : ''} ${c.requiereLeche ? `(Leche ${c.tipoLeche || ''})` : ''}`).join(' ; ');
    const abuelosStr = (v.adultosMayoresInfo || []).map(s => `${s.edad} ${s.requierePanalesAdulto ? `(Pañal Talla ${s.tallaPanalAdulto || 'L'})` : ''} ${s.detalles || ''}`).join(' ; ');
    const discapStr = (v.discapacidadInfo || []).map(d => `${d.tipoDiscapacidad} ${d.requierePanales ? `(Pañal Talla ${d.tallaPanal || 'L'})` : ''} ${d.requiereAyudaTecnica ? `(Ayuda: ${d.tipoAyudaTecnica || 'Silla/Muletas'})` : ''}`).join(' ; ');
    const mascotasStr = (v.mascotasInfo || []).map(p => `${p.cantidad} ${p.tipo}${p.requiereAlimento ? ' (Requiere Alimento)' : ''}${p.detalles ? ` [${p.detalles}]` : ''}`).join(' ; ');

    rows.push([
      b.no.toString(),
      `"${b.sector || 'Sector 1'}"`,
      `"${b.nombre.replace(/"/g, '""')}"`,
      `"${b.cedula}"`,
      `"${b.direccion.replace(/"/g, '""')}"`,
      `"${b.telefono}"`,
      v.tieneNinos ? 'SI' : 'NO',
      `"${ninosStr.replace(/"/g, '""')}"`,
      v.tieneAdultoMayor ? 'SI' : 'NO',
      `"${abuelosStr.replace(/"/g, '""')}"`,
      v.tieneDiscapacidad ? 'SI' : 'NO',
      `"${discapStr.replace(/"/g, '""')}"`,
      v.tieneMascotas ? 'SI' : 'NO',
      `"${mascotasStr.replace(/"/g, '""')}"`
    ]);
  });

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Reporte_Necesidades_Especiales_Chiminangos_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate all 600 apartments for Sector 1 (5 Agrupaciones x 6 Torres x 5 Pisos x 4 Aptos)
export function generateAllPropertiesSector1(existingBeneficiaries?: Beneficiary[]): PropertyRecord[] {
  const properties: PropertyRecord[] = [];
  const torres = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Map audited census seed records
  const censusMap = new Map(SeedCensus.records.map(r => [r.aptoCode.toUpperCase(), r]));

  // Map existing beneficiaries by cleaned apto code for pre-populating known data
  const benMap = new Map<string, Beneficiary>();
  if (existingBeneficiaries) {
    existingBeneficiaries.forEach(b => {
      const parsed = parseAptoCode(b.direccion, b.sector);
      if (parsed.isParsed && parsed.torre && parsed.apto) {
        const matchAgrup = parsed.agrupacion.match(/\d+/);
        const agrupNum = matchAgrup ? matchAgrup[0] : '1';
        const code = `${agrupNum}${parsed.torre}${parsed.apto}`;
        benMap.set(code.toUpperCase(), b);
      }
    });
  }

  for (let agrup = 1; agrup <= 5; agrup++) {
    for (const torre of torres) {
      for (let piso = 1; piso <= 5; piso++) {
        for (let aptoNum = 1; aptoNum <= 4; aptoNum++) {
          const aptoCode = `${agrup}${torre}${piso}${aptoNum}`;
          const id = `prop_${aptoCode}`;

          // Check if we have an audited census record for this apto code
          const seedCensus = censusMap.get(aptoCode.toUpperCase());
          // Check if we have a beneficiary matching this apto code
          const matchedBen = benMap.get(aptoCode.toUpperCase());

          const ownerNombre = seedCensus?.propietario?.nombre || matchedBen?.nombre || '';
          const ownerCedula = seedCensus?.propietario?.cedula || matchedBen?.cedula || '';
          const ownerTel = seedCensus?.propietario?.telefono || matchedBen?.telefono || '';
          const obs = seedCensus?.observaciones || matchedBen?.observaciones || '';

          const prop: PropertyRecord = {
            id,
            aptoCode,
            sector: 'Sector 1',
            agrupacion: `Agrupación ${agrup}`,
            torre: `Torre ${torre}`,
            piso,
            aptoNumero: aptoNum,
            estadoHabitabilidad: 'HABITADO',
            tipoOcupante: seedCensus?.tipoOcupante || 'DUEÑO',
            propietario: {
              nombre: ownerNombre,
              tipoDocumento: matchedBen?.tipoDocumento || 'CC',
              cedula: ownerCedula,
              telefono: ownerTel,
              email: seedCensus?.propietario?.email || '',
              resideEnApto: true
            },
            personasAdicionales: seedCensus?.personasAdicionales || [],
            observaciones: obs
          };

          properties.push(prop);
        }
      }
    }
  }

  return properties;
}

export function getStoredProperties(existingBeneficiaries?: Beneficiary[]): PropertyRecord[] {
  try {
    const raw = localStorage.getItem(getKey('PROPERTIES'));
    const censusMap = new Map(SeedCensus.records.map(r => [r.aptoCode.toUpperCase(), r]));

    if (!raw) {
      const initial = generateAllPropertiesSector1(existingBeneficiaries);
      saveProperties(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = generateAllPropertiesSector1(existingBeneficiaries);
      saveProperties(initial);
      return initial;
    }

    // Merge audited SeedCensus records into parsed storage if missing owner or personas
    let updated = false;
    const mergedList: PropertyRecord[] = parsed.map((p: PropertyRecord) => {
      const seedCensus = censusMap.get(p.aptoCode.toUpperCase());
      if (seedCensus) {
        const needsUpdate = !p.propietario?.nombre || (seedCensus.personasAdicionales && (!p.personasAdicionales || p.personasAdicionales.length === 0));
        if (needsUpdate) {
          updated = true;
          return {
            ...p,
            propietario: {
              ...p.propietario,
              nombre: p.propietario?.nombre || seedCensus.propietario.nombre,
              cedula: p.propietario?.cedula || seedCensus.propietario.cedula,
              telefono: p.propietario?.telefono || seedCensus.propietario.telefono,
              email: p.propietario?.email || seedCensus.propietario.email || ''
            },
            personasAdicionales: p.personasAdicionales && p.personasAdicionales.length > 0 ? p.personasAdicionales : (seedCensus.personasAdicionales || []),
            observaciones: p.observaciones || seedCensus.observaciones || ''
          };
        }
      }
      return p;
    });

    if (updated) {
      saveProperties(mergedList);
    }

    return mergedList;
  } catch (err) {
    console.error('Error reading properties from storage', err);
    return generateAllPropertiesSector1(existingBeneficiaries);
  }
}

export function saveProperties(data: PropertyRecord[]) {
  localStorage.setItem(getKey('PROPERTIES'), JSON.stringify(data));
}

export function exportPropertiesToCSV(properties: PropertyRecord[]) {
  const headers = [
    'Código Apto',
    'Sector',
    'Agrupación',
    'Torre',
    'Piso',
    'Apto #',
    'Estado Habitabilidad',
    'Tipo Ocupante',
    'Propietario Nombre',
    'Propietario Cédula',
    'Propietario Teléfono',
    'Propietario Correo (Email)',
    'Reside en Apto',
    'Arrendatario Nombre',
    'Arrendatario Teléfono',
    'Personas Adicionales / Copropietarios',
    'Observaciones'
  ];

  const rows = properties.map(p => {
    const persStr = (p.personasAdicionales || [])
      .map(per => `${per.nombre} [${per.rol}] (CC: ${per.cedula || 'N/A'}, Tel: ${per.telefono || 'N/A'})`)
      .join('; ');

    return [
      `"${p.aptoCode}"`,
      `"${p.sector || 'Sector 1'}"`,
      `"${p.agrupacion}"`,
      `"${p.torre}"`,
      p.piso,
      p.aptoNumero,
      `"${p.estadoHabitabilidad}"`,
      `"${p.tipoOcupante}"`,
      `"${(p.propietario?.nombre || '').replace(/"/g, '""')}"`,
      `"${p.propietario?.cedula || ''}"`,
      `"${p.propietario?.telefono || ''}"`,
      `"${p.propietario?.email || ''}"`,
      p.propietario?.resideEnApto ? 'SI' : 'NO',
      `"${(p.arrendatario?.nombre || '').replace(/"/g, '""')}"`,
      `"${p.arrendatario?.telefono || ''}"`,
      `"${persStr.replace(/"/g, '""')}"`,
      `"${(p.observaciones || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Censo_Propietarios_Chiminangos_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
