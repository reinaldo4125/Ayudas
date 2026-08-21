import { Beneficiary, InventoryItem, DeliveryRecord, SummaryStats, InventoryMovement } from '../types';
import { seedBeneficiaries } from '../data/seedBeneficiaries';
import { seedInventory } from '../data/seedInventory';
import { parseAptoCode } from './aptoParser';

const STORAGE_KEYS = {
  BENEFICIARIES: 'chiminangos_beneficiaries_v4',
  INVENTORY: 'chiminangos_inventory_v3',
  DELIVERIES: 'chiminangos_deliveries_v4',
  MOVEMENTS: 'chiminangos_movements_v2',
  INITIALIZED: 'chiminangos_db_initialized_v2',
};

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
    const raw = localStorage.getItem(STORAGE_KEYS.BENEFICIARIES);
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!raw) {
      if (isInitialized) {
        return [];
      }
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
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
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  localStorage.setItem(STORAGE_KEYS.BENEFICIARIES, JSON.stringify(data));
}

export function getStoredInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
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
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(data));
}

export function getStoredDeliveries(): DeliveryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELIVERIES);
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
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
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(data));
}

export function resetAllDataToSeed(): {
  beneficiaries: Beneficiary[];
  inventory: InventoryItem[];
  deliveries: DeliveryRecord[];
} {
  localStorage.removeItem(STORAGE_KEYS.BENEFICIARIES);
  localStorage.removeItem(STORAGE_KEYS.INVENTORY);
  localStorage.removeItem(STORAGE_KEYS.DELIVERIES);
  localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);

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

export function exportDeliveriesToCSV(deliveries: DeliveryRecord[]) {
  const headers = ['ID Entrega', 'Sector', 'Beneficiario', 'Tipo Doc.', 'Cédula', 'Dirección', 'Agrupación', 'Fecha', 'Insumos Entregados', 'Responsable', 'Estado'];
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
      new Date(d.fecha).toLocaleString(),
      `"${articulosStr}"`,
      `"${d.responsable}"`,
      d.estado
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Reporte_Entregas_Chiminangos_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportVulnerabilitiesToCSV(beneficiaries: Beneficiary[]) {
  const headers = ['#', 'Sector', 'Nombre', 'Cédula', 'Dirección', 'Teléfono', 'Tiene Niños', 'Detalle Niños (Pañales/Leche)', 'Tiene Adulto Mayor', 'Detalle Adultos (Pañales)', 'Tiene Discapacidad', 'Detalle Discapacidad'];
  const rows: string[][] = [];

  beneficiaries.forEach(b => {
    const v = b.vulnerabilidades;
    if (!v || (!v.tieneNinos && !v.tieneAdultoMayor && !v.tieneDiscapacidad)) return;

    const ninosStr = (v.ninosInfo || []).map(c => `${c.edad} ${c.requierePanales ? `(Pañal ${c.etapaPanal || 'E2'})` : ''} ${c.requiereLeche ? `(Leche ${c.tipoLeche || ''})` : ''}`).join(' ; ');
    const abuelosStr = (v.adultosMayoresInfo || []).map(s => `${s.edad} ${s.requierePanalesAdulto ? `(Pañal Talla ${s.tallaPanalAdulto || 'L'})` : ''} ${s.detalles || ''}`).join(' ; ');
    const discapStr = (v.discapacidadInfo || []).map(d => `${d.tipoDiscapacidad} ${d.requierePanales ? `(Pañal Talla ${d.tallaPanal || 'L'})` : ''} ${d.requiereAyudaTecnica ? `(Ayuda: ${d.tipoAyudaTecnica || 'Silla/Muletas'})` : ''}`).join(' ; ');

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
      `"${discapStr.replace(/"/g, '""')}"`
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
