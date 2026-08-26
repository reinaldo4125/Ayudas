import { Beneficiary, DeliveryRecord } from '../types';
import { parseAptoCode } from './aptoParser';

export interface ConsolidatedApartmentInfo {
  key: string;
  aptoCode: string;
  direccion: string;
  sector: string;
  agrupacion: string;
  integrantesConsolidados: number;
  hasUpdatedCensus: boolean;
  primaryBeneficiaryId: string;
  primaryBeneficiaryName: string;
  beneficiaries: Beneficiary[];
}

/**
 * Returns a canonical key for an apartment / household address.
 * Standardizes representations like "3A44", "3 A 44", "Sector 1 Agrupación 3 Torre A Apto 44".
 * External users get a unique key per person.
 */
export function getApartmentCanonicalKey(direccion: string, sector?: string, fallbackId?: string): string {
  if (!direccion || !direccion.trim()) {
    return fallbackId ? `id-${fallbackId}` : 'sin-direccion';
  }

  const clean = direccion.trim();
  const lower = clean.toLowerCase();

  if (lower.includes('externo') || (sector && sector.toLowerCase().includes('externo'))) {
    return fallbackId ? `ext-${fallbackId}` : `ext-${lower}`;
  }

  const parsed = parseAptoCode(clean, sector);
  if (parsed.isParsed && parsed.descripcion) {
    return parsed.descripcion.trim().toLowerCase();
  }

  return lower;
}

/**
 * Groups beneficiaries by canonical apartment address and computes
 * a single consolidated household member count per apartment.
 *
 * Consolidation Rules:
 * 1. An apartment (e.g. 3A44) is identified canonically.
 * 2. The primary beneficiary (head of household) for the apartment holds the count.
 * 3. Secondary residents in the same apartment are linked to the primary beneficiary,
 *    preventing duplicate count entries or asking multiple residents for household size.
 */
export function getConsolidatedApartmentMap(beneficiaries: Beneficiary[]): Map<string, ConsolidatedApartmentInfo> {
  const map = new Map<string, ConsolidatedApartmentInfo>();

  beneficiaries.forEach(b => {
    const key = getApartmentCanonicalKey(b.direccion, b.sector, b.id);
    const parsed = parseAptoCode(b.direccion, b.sector);
    const aptoCode = parsed.descripcion || b.direccion || 'Sin Apto';

    if (!map.has(key)) {
      map.set(key, {
        key,
        aptoCode,
        direccion: b.direccion,
        sector: b.sector || 'Sector 1',
        agrupacion: b.agrupacion || 'Sector General',
        integrantesConsolidados: 3,
        hasUpdatedCensus: false,
        primaryBeneficiaryId: b.id,
        primaryBeneficiaryName: b.nombre,
        beneficiaries: []
      });
    }

    const info = map.get(key)!;
    info.beneficiaries.push(b);
  });

  // Calculate consolidated household size and designate primary resident for each apartment
  map.forEach(info => {
    // Sort beneficiaries by updated census first, then by lower `no`
    info.beneficiaries.sort((a, b) => {
      if (a.censoActualizado && !b.censoActualizado) return -1;
      if (!a.censoActualizado && b.censoActualizado) return 1;
      return (a.no || 0) - (b.no || 0);
    });

    const primary = info.beneficiaries[0];
    info.primaryBeneficiaryId = primary.id;
    info.primaryBeneficiaryName = primary.nombre;

    const updatedResidents = info.beneficiaries.filter(b => b.censoActualizado && (b.integrantesHogar || 0) > 0);
    info.hasUpdatedCensus = updatedResidents.length > 0;

    if (info.hasUpdatedCensus) {
      // Prioritize primary's value if updated, or the first updated resident's value
      info.integrantesConsolidados = primary.integrantesHogar || updatedResidents[0].integrantesHogar || 3;
    } else {
      info.integrantesConsolidados = primary.integrantesHogar || 3;
    }
  });

  return map;
}

/**
 * Calculates consolidated census population stats.
 * Guarantees that each apartment contributes its consolidated member count ONCE.
 */
export function calculateConsolidatedCensusStats(beneficiaries: Beneficiary[]) {
  const totalTitulares = beneficiaries.length;
  const aptMap = getConsolidatedApartmentMap(beneficiaries);

  let totalAptos = 0;
  let aptosActualizados = 0;
  let totalHabitantesActualizados = 0;

  aptMap.forEach(info => {
    totalAptos += 1;
    if (info.hasUpdatedCensus) {
      aptosActualizados += 1;
      totalHabitantesActualizados += info.integrantesConsolidados;
    }
  });

  const promedio = aptosActualizados > 0 
    ? (totalHabitantesActualizados / aptosActualizados).toFixed(1) 
    : '0';

  return {
    totalTitulares,
    totalAptos,
    aptosActualizados,
    totalHabitantes: totalHabitantesActualizados,
    promedio,
    aptMap
  };
}

/**
 * Calculates consolidated count of people fed/impacted by deliveries in a period.
 * Group deliveries by apartment and add the apartment's consolidated household count ONCE.
 */
export function calculateConsolidatedPeopleFed(
  deliveries: DeliveryRecord[], 
  beneficiaries: Beneficiary[]
): number {
  const aptMap = getConsolidatedApartmentMap(beneficiaries);
  const deliveredAptoKeys = new Set<string>();
  let totalPeopleFed = 0;

  deliveries.forEach(d => {
    const key = getApartmentCanonicalKey(
      d.beneficiarioDireccion, 
      d.sector, 
      d.beneficiarioId || d.beneficiarioCedula || d.id
    );

    if (!deliveredAptoKeys.has(key)) {
      deliveredAptoKeys.add(key);
      const knownApto = aptMap.get(key);
      if (knownApto && knownApto.integrantesConsolidados > 0) {
        totalPeopleFed += knownApto.integrantesConsolidados;
      } else if (d.integrantesHogar && d.integrantesHogar > 0) {
        totalPeopleFed += d.integrantesHogar;
      } else {
        totalPeopleFed += 3; // Default average family size
      }
    }
  });

  return totalPeopleFed;
}
