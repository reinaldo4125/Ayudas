import { DeliveryRecord, Beneficiary } from '../types';
import { getApartmentCanonicalKey, getConsolidatedApartmentMap } from './householdUtils';

/**
 * Safely parse any date value (ISO string, YYYY-MM-DD, timestamp, Date object)
 * into a valid Date object without timezone-related day shift bugs.
 */
export function parseDateSafe(dateVal: string | number | Date | undefined | null): Date | null {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }

  const s = String(dateVal).trim();
  if (!s) return null;

  // Case 1: Pure YYYY-MM-DD or YYYY-MM-DD with time (e.g., "2026-08-24" or "2026-08-24 14:30")
  // NOTE: Plain "YYYY-MM-DD" parsed with new Date("YYYY-MM-DD") is UTC midnight,
  // which shifts 1 calendar day back in UTC-5 (Colombia) or western timezones!
  // Parsing with local parameters fixes this issue.
  const ymdMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (ymdMatch && !s.endsWith('Z') && !s.includes('+')) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const hours = ymdMatch[4] !== undefined ? parseInt(ymdMatch[4], 10) : 12;
    const minutes = ymdMatch[5] !== undefined ? parseInt(ymdMatch[5], 10) : 0;
    const seconds = ymdMatch[6] !== undefined ? parseInt(ymdMatch[6], 10) : 0;
    const localDate = new Date(year, month, day, hours, minutes, seconds);
    return isNaN(localDate.getTime()) ? null : localDate;
  }

  // Case 2: DD/MM/YYYY or DD-MM-YYYY format (e.g., "24/08/2026")
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const hours = dmyMatch[4] !== undefined ? parseInt(dmyMatch[4], 10) : 12;
    const minutes = dmyMatch[5] !== undefined ? parseInt(dmyMatch[5], 10) : 0;
    const seconds = dmyMatch[6] !== undefined ? parseInt(dmyMatch[6], 10) : 0;
    const localDate = new Date(year, month, day, hours, minutes, seconds);
    return isNaN(localDate.getTime()) ? null : localDate;
  }

  // Case 3: ISO with Z or timezone offset (e.g. "2026-08-24T18:30:00.000Z")
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
export function formatDateToYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extract YYYY-MM-DD string accurately from any date value
 */
export function extractYMD(dateVal: string | number | Date | undefined | null): string {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    const s = dateVal.trim();
    const pureYmd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (pureYmd) {
      return pureYmd[0];
    }
  }
  const d = parseDateSafe(dateVal);
  if (!d) return '';
  return formatDateToYMD(d);
}

/**
 * Format a date string or Date object for UI display in Spanish (Colombia)
 * e.g., "24 de ago de 2026"
 */
export function formatDisplayDate(dateVal: string | number | Date | undefined | null): string {
  const d = parseDateSafe(dateVal);
  if (!d) return 'Fecha no especificada';
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format time for UI display (e.g., "02:30 p. m.")
 */
export function formatDisplayTime(dateVal: string | number | Date | undefined | null): string {
  if (!dateVal) return '';
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
    return ''; // Pure date without time
  }
  const d = parseDateSafe(dateVal);
  if (!d) return '';
  return d.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format date and time for UI display (e.g., "24 ago 2026, 2:30 p. m.")
 */
export function formatDisplayDateTime(dateVal: string | number | Date | undefined | null): string {
  const d = parseDateSafe(dateVal);
  if (!d) return 'Fecha no especificada';
  const hasSpecificTime = !(typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim()));
  if (!hasSpecificTime) {
    return d.toLocaleDateString('es-CO', { dateStyle: 'medium' });
  }
  return d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Format a YYYY-MM-DD day label for timeline pills (e.g., "lun, 24 de ago")
 */
export function formatDayLabel(fechaYMD: string): string {
  const d = parseDateSafe(fechaYMD);
  if (!d) return fechaYMD;
  return d.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

export type DatePreset = 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';

export interface DateRangeState {
  preset: DatePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

/**
 * Returns the default date range dates based on preset in local calendar terms
 */
export function getPresetDateRange(preset: DatePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const todayStr = formatDateToYMD(now);

  switch (preset) {
    case 'TODAY':
      return { startDate: todayStr, endDate: todayStr };

    case 'YESTERDAY': {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0);
      const yStr = formatDateToYMD(yesterday);
      return { startDate: yStr, endDate: yStr };
    }

    case 'THIS_WEEK': {
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
      startOfWeek.setDate(diff);
      return { startDate: formatDateToYMD(startOfWeek), endDate: todayStr };
    }

    case 'LAST_7_DAYS': {
      const past7 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 12, 0, 0);
      return { startDate: formatDateToYMD(past7), endDate: todayStr };
    }

    case 'THIS_MONTH': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0);
      return { startDate: formatDateToYMD(startOfMonth), endDate: todayStr };
    }

    case 'LAST_MONTH': {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 12, 0, 0);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 12, 0, 0);
      return {
        startDate: formatDateToYMD(startOfLastMonth),
        endDate: formatDateToYMD(endOfLastMonth)
      };
    }

    case 'ALL':
    case 'CUSTOM':
    default:
      return { startDate: '', endDate: '' };
  }
}

/**
 * Checks if a delivery date falls within a given start and end date (inclusive, comparing YYYY-MM-DD)
 */
export function isDeliveryInDateRange(
  deliveryDateVal: string | undefined,
  startDateStr: string,
  endDateStr: string
): boolean {
  if (!startDateStr && !endDateStr) return true;
  if (!deliveryDateVal) return false;

  const itemYMD = extractYMD(deliveryDateVal);
  if (!itemYMD) return false;

  if (startDateStr && itemYMD < startDateStr) return false;
  if (endDateStr && itemYMD > endDateStr) return false;

  return true;
}

export interface DeliveriesPeriodStats {
  totalEntregas: number;
  totalMercadosKits: number;
  totalBeneficiariosUnicos: number;
  totalPersonasAlimentadas: number;
  promedioDiario: number;
  diasConEntregas: number;
  primerFecha: string | null;
  ultimaFecha: string | null;
  porDia: { fecha: string; label: string; count: number; mercados: number; beneficiarios: number }[];
  porSector: { sector: string; count: number }[];
  porAgrupacion: { agrupacion: string; count: number }[];
}

/**
 * Calculates rich analytical statistics for a list of deliveries in a date range
 */
export function calculateDeliveriesDateStats(
  deliveries: DeliveryRecord[],
  beneficiaries?: Beneficiary[]
): DeliveriesPeriodStats {
  const uniqueBenKeys = new Set<string>();
  let totalMercadosKits = 0;

  const dayMap: Record<string, { count: number; mercados: number; beneficiaries: Set<string> }> = {};
  const sectorMap: Record<string, number> = {};
  const agrupacionMap: Record<string, number> = {};

  const sorted = [...deliveries].sort((a, b) => {
    const tA = parseDateSafe(a.fecha)?.getTime() || 0;
    const tB = parseDateSafe(b.fecha)?.getTime() || 0;
    return tA - tB;
  });

  const aptMap = beneficiaries ? getConsolidatedApartmentMap(beneficiaries) : null;
  const uniqueDeliveredAptoKeys = new Map<string, number>();

  sorted.forEach(d => {
    const benKey = d.beneficiarioId || d.beneficiarioCedula || d.beneficiarioDireccion || d.beneficiarioNombre;
    if (benKey) uniqueBenKeys.add(benKey);

    // Sum markets kits: look for articulos or default to 1
    const kits = (d.articulos || []).reduce((sum, item) => sum + (item.cantidad || 0), 0) || 1;
    totalMercadosKits += kits;

    // Track apartment consolidation for totalPersonas
    const aptKey = getApartmentCanonicalKey(d.beneficiarioDireccion, d.sector, d.beneficiarioId || d.beneficiarioCedula || d.id);
    let sizeForApto = 3;
    if (aptMap && aptMap.has(aptKey)) {
      sizeForApto = aptMap.get(aptKey)!.integrantesConsolidados;
    } else if (d.integrantesHogar && d.integrantesHogar > 0) {
      sizeForApto = d.integrantesHogar;
    }

    const prev = uniqueDeliveredAptoKeys.get(aptKey) || 0;
    if (sizeForApto > prev) {
      uniqueDeliveredAptoKeys.set(aptKey, sizeForApto);
    }

    // Day grouping
    const dayKey = extractYMD(d.fecha) || 'Fecha no especificada';

    if (!dayMap[dayKey]) {
      dayMap[dayKey] = { count: 0, mercados: 0, beneficiaries: new Set<string>() };
    }
    dayMap[dayKey].count += 1;
    dayMap[dayKey].mercados += kits;
    if (benKey) dayMap[dayKey].beneficiaries.add(benKey);

    // Sector & Agrupación
    const sec = d.sector || 'Sector 1';
    sectorMap[sec] = (sectorMap[sec] || 0) + 1;

    const ag = d.agrupacion || 'Sector General';
    agrupacionMap[ag] = (agrupacionMap[ag] || 0) + 1;
  });

  // Sum unique apartment household sizes ONCE to prevent double counting
  let totalPersonas = 0;
  uniqueDeliveredAptoKeys.forEach(count => {
    totalPersonas += count;
  });

  const daysEntries = Object.entries(dayMap).sort((a, b) => a[0].localeCompare(b[0]));
  const diasConEntregas = daysEntries.length;
  const promedioDiario = diasConEntregas > 0 ? Number((deliveries.length / diasConEntregas).toFixed(1)) : 0;

  const porDia = daysEntries.map(([fecha, val]) => {
    let label = fecha;
    if (fecha !== 'Fecha no especificada') {
      label = formatDayLabel(fecha);
    }
    return {
      fecha,
      label,
      count: val.count,
      mercados: val.mercados,
      beneficiarios: val.beneficiaries.size
    };
  });

  const primerFecha = sorted.length > 0 && sorted[0].fecha ? sorted[0].fecha : null;
  const ultimaFecha = sorted.length > 0 && sorted[sorted.length - 1].fecha ? sorted[sorted.length - 1].fecha : null;

  const porSector = Object.entries(sectorMap).map(([sector, count]) => ({ sector, count }));
  const porAgrupacion = Object.entries(agrupacionMap).map(([agrupacion, count]) => ({ agrupacion, count }));

  return {
    totalEntregas: deliveries.length,
    totalMercadosKits,
    totalBeneficiariosUnicos: uniqueBenKeys.size,
    totalPersonasAlimentadas: totalPersonas,
    promedioDiario,
    diasConEntregas,
    primerFecha,
    ultimaFecha,
    porDia,
    porSector,
    porAgrupacion
  };
}
