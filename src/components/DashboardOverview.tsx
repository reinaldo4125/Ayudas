import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  ArrowRight, 
  Layers, 
  FileSpreadsheet, 
  Home, 
  Search, 
  Building2, 
  PackageCheck, 
  Filter, 
  Baby, 
  Accessibility, 
  HeartHandshake, 
  UserCheck, 
  Dog, 
  Calendar,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { Beneficiary, InventoryItem, DeliveryRecord, SummaryStats } from '../types';
import { parseAptoCode } from '../lib/aptoParser';
import { 
  DatePreset, 
  getPresetDateRange, 
  isDeliveryInDateRange, 
  calculateDeliveriesDateStats,
  formatDisplayDate,
  formatDisplayTime,
  formatDateToYMD
} from '../lib/dateUtils';
import { calculateConsolidatedCensusStats, getConsolidatedApartmentMap } from '../lib/householdUtils';

interface DashboardOverviewProps {
  stats: SummaryStats;
  beneficiaries: Beneficiary[];
  inventory: InventoryItem[];
  deliveries: DeliveryRecord[];
  onOpenNewDelivery: () => void;
  onNavigateTab: (tab: 'simple' | 'dashboard' | 'owners' | 'beneficiaries' | 'inventory' | 'reports' | 'ai') => void;
  onSelectBeneficiaryForDelivery: (beneficiary: Beneficiary) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  beneficiaries,
  inventory,
  deliveries,
  onOpenNewDelivery,
  onNavigateTab,
  onSelectBeneficiaryForDelivery
}) => {
  // Mode toggle for Apartment table: Date Filtered vs Full Historic Census
  const [aptViewMode, setAptViewMode] = useState<'DATE_FILTERED' | 'HISTORIC_ALL'>('DATE_FILTERED');
  const [aptSearchQuery, setAptSearchQuery] = useState('');
  const [aptFilter, setAptFilter] = useState<'ALL' | 'MULTIPLE' | 'SINGLE' | 'PENDING'>('ALL');

  // Date Filtering State for Overview (Default to Yesterday as primary filter view)
  const [overviewDatePreset, setOverviewDatePreset] = useState<DatePreset>('YESTERDAY');
  const [overviewStartDate, setOverviewStartDate] = useState<string>(() => getPresetDateRange('YESTERDAY').startDate);
  const [overviewEndDate, setOverviewEndDate] = useState<string>(() => getPresetDateRange('YESTERDAY').endDate);

  const handleOverviewPreset = (preset: DatePreset) => {
    setOverviewDatePreset(preset);
    if (preset === 'ALL') {
      setOverviewStartDate('');
      setOverviewEndDate('');
    } else {
      const r = getPresetDateRange(preset);
      setOverviewStartDate(r.startDate);
      setOverviewEndDate(r.endDate);
    }
  };

  // Deliveries filtered by date range
  const filteredOverviewDeliveries = useMemo(() => {
    return deliveries.filter(d => isDeliveryInDateRange(d.fecha, overviewStartDate, overviewEndDate));
  }, [deliveries, overviewStartDate, overviewEndDate]);

  // Analytical stats for the selected date range (with apartment consolidation)
  const overviewDateStats = useMemo(() => {
    return calculateDeliveriesDateStats(filteredOverviewDeliveries, beneficiaries);
  }, [filteredOverviewDeliveries, beneficiaries]);

  // Census totals calculation (consolidated per unique apartment to avoid double counting)
  const censusStats = useMemo(() => {
    return calculateConsolidatedCensusStats(beneficiaries);
  }, [beneficiaries]);

  // Group deliveries in the filtered date range by Apartment for easy identification
  const apartmentsDeliveredInDateRange = useMemo(() => {
    const map = new Map<string, {
      key: string;
      aptoCode: string;
      direccion: string;
      sector: string;
      agrupacion: string;
      beneficiarioNombre: string;
      beneficiarioCedula: string;
      deliveries: DeliveryRecord[];
      totalKits: number;
      lastFecha: string;
      responsable: string;
      integrantesHogar: number;
    }>();

    filteredOverviewDeliveries.forEach(d => {
      const isExt = (d.sector || '').toLowerCase().includes('externo') || 
                    (d.agrupacion || '').toLowerCase().includes('externo') ||
                    (d.beneficiarioDireccion || '').toLowerCase().includes('externo');

      const parsed = parseAptoCode(d.beneficiarioDireccion, d.sector);
      const aptoCode = isExt ? `EXTERNO (${d.beneficiarioNombre})` : (parsed.descripcion || d.beneficiarioDireccion || 'Sin Apto');
      const key = isExt ? `ext-${d.id}` : aptoCode.trim().toLowerCase();
      const kits = (d.articulos || []).reduce((sum, a) => sum + (a.cantidad || 0), 0) || 1;

      if (!map.has(key)) {
        map.set(key, {
          key,
          aptoCode,
          direccion: d.beneficiarioDireccion || aptoCode,
          sector: d.sector || 'Sector 1',
          agrupacion: d.agrupacion || 'Sector General',
          beneficiarioNombre: d.beneficiarioNombre,
          beneficiarioCedula: d.beneficiarioCedula || 'S/N',
          deliveries: [d],
          totalKits: kits,
          lastFecha: d.fecha,
          responsable: d.responsable || 'Operador',
          integrantesHogar: censusStats.aptMap.get(key)?.integrantesConsolidados || d.integrantesHogar || 3
        });
      } else {
        const item = map.get(key)!;
        item.deliveries.push(d);
        item.totalKits += kits;
        if (new Date(d.fecha).getTime() > new Date(item.lastFecha).getTime()) {
          item.lastFecha = d.fecha;
          item.responsable = d.responsable || item.responsable;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.lastFecha).getTime() - new Date(a.lastFecha).getTime());
  }, [filteredOverviewDeliveries]);

  // Filtered list of apartments delivered in period (with search)
  const filteredDateAptos = useMemo(() => {
    const q = aptSearchQuery.toLowerCase().trim();
    if (!q) return apartmentsDeliveredInDateRange;
    return apartmentsDeliveredInDateRange.filter(apt =>
      apt.aptoCode.toLowerCase().includes(q) ||
      apt.direccion.toLowerCase().includes(q) ||
      apt.beneficiarioNombre.toLowerCase().includes(q) ||
      apt.beneficiarioCedula.toLowerCase().includes(q) ||
      apt.agrupacion.toLowerCase().includes(q)
    );
  }, [apartmentsDeliveredInDateRange, aptSearchQuery]);

  // Full Historic Apartment Census List (when viewing full census)
  const historicApartmentSummaryList = useMemo(() => {
    const map = new Map<string, {
      key: string;
      direccion: string;
      descripcion: string;
      sector: string;
      agrupacion: string;
      residents: Beneficiary[];
      deliveries: DeliveryRecord[];
      isExternal: boolean;
    }>();

    beneficiaries.forEach(b => {
      const isExternal = b.direccion.toLowerCase().includes('externo') || 
                         b.agrupacion?.toLowerCase().includes('externo') ||
                         (b.sector || '').toLowerCase().includes('externo');
      const parsed = parseAptoCode(b.direccion, b.sector);
      const key = isExternal ? `external-${b.id}` : (parsed.descripcion || b.direccion).trim().toLowerCase();

      if (!map.has(key)) {
        map.set(key, {
          key,
          direccion: isExternal ? 'Usuario Externo' : b.direccion,
          descripcion: isExternal ? `Usuario Externo (${b.nombre})` : (parsed.descripcion || b.direccion),
          sector: isExternal ? 'Usuarios Externos' : (b.sector || 'Sector 1'),
          agrupacion: isExternal ? 'Usuarios Externos' : (b.agrupacion || parsed.agrupacion || 'Sector General'),
          residents: [],
          deliveries: [],
          isExternal
        });
      }

      map.get(key)!.residents.push(b);
    });

    map.forEach((apt, key) => {
      const isExt = key.startsWith('external-');
      const residentIds = new Set(apt.residents.map(r => r.id));
      const residentCedulas = new Set(apt.residents.map(r => r.cedula));
      const normAddr = apt.direccion.trim().toLowerCase();

      apt.deliveries = deliveries.filter(d => {
        if (d.beneficiarioId && residentIds.has(d.beneficiarioId)) return true;
        if (d.beneficiarioCedula && d.beneficiarioCedula !== 'S/N' && residentCedulas.has(d.beneficiarioCedula)) return true;
        if (!isExt && d.beneficiarioDireccion && d.beneficiarioDireccion.trim().toLowerCase() === normAddr) return true;
        const dParsed = parseAptoCode(d.beneficiarioDireccion, d.sector);
        if (!isExt && dParsed.descripcion && dParsed.descripcion.trim().toLowerCase() === key) return true;
        return false;
      }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    });

    return Array.from(map.values());
  }, [beneficiaries, deliveries]);

  const filteredHistoricApts = useMemo(() => {
    const q = aptSearchQuery.toLowerCase().trim();
    return historicApartmentSummaryList.filter(apt => {
      const delCount = apt.deliveries.length;

      if (aptFilter === 'MULTIPLE' && delCount < 2) return false;
      if (aptFilter === 'SINGLE' && delCount !== 1) return false;
      if (aptFilter === 'PENDING' && delCount > 0) return false;

      if (!q) return true;

      const addrMatch = apt.direccion.toLowerCase().includes(q) || apt.descripcion.toLowerCase().includes(q);
      const residentMatch = apt.residents.some(r =>
        r.nombre.toLowerCase().includes(q) || r.cedula.toLowerCase().includes(q)
      );

      return addrMatch || residentMatch;
    });
  }, [historicApartmentSummaryList, aptSearchQuery, aptFilter]);

  // Agrupación groups for progress
  const agrupacionGroups = useMemo(() => {
    const groups: Record<string, { total: number; entregados: number }> = {};
    beneficiaries.forEach(b => {
      const key = b.agrupacion || 'Otros';
      if (!groups[key]) {
        groups[key] = { total: 0, entregados: 0 };
      }
      groups[key].total += 1;
      if (b.estadoEntrega === 'ENTREGADO') {
        groups[key].entregados += 1;
      }
    });
    return Object.entries(groups).sort((a, b) => b[1].total - a[1].total);
  }, [beneficiaries]);

  // Vulnerability statistics
  const vulnerabilityStats = useMemo(() => {
    let totalNinos = 0;
    let ninosPanales = 0;
    let ninosLeche = 0;
    const etapasPanalMap: Record<string, number> = {};

    let totalAdultosMayores = 0;
    let adultosMayoresPanales = 0;
    const tallasAdultoMap: Record<string, number> = {};

    let totalDiscapacidad = 0;
    const tiposDiscapacidadMap: Record<string, number> = {};
    let ayudasTecnicasCount = 0;

    let totalMascotas = 0;
    let hogaresConMascotas = 0;
    let totalPerros = 0;
    let totalGatos = 0;
    let perrosRequierenAlimento = 0;
    let gatosRequierenAlimento = 0;
    let mascotasRequierenAlimento = 0;
    const tiposMascotasMap: Record<string, number> = {};

    beneficiaries.forEach(b => {
      const v = b.vulnerabilidades;
      if (!v) return;

      if (v.tieneNinos && v.ninosInfo) {
        v.ninosInfo.forEach(c => {
          totalNinos++;
          if (c.requierePanales) {
            ninosPanales++;
            const etapa = c.etapaPanal || 'Sin especificación';
            etapasPanalMap[etapa] = (etapasPanalMap[etapa] || 0) + 1;
          }
          if (c.requiereLeche) {
            ninosLeche++;
          }
        });
      }

      if (v.tieneAdultoMayor && v.adultosMayoresInfo) {
        v.adultosMayoresInfo.forEach(s => {
          totalAdultosMayores++;
          if (s.requierePanalesAdulto) {
            adultosMayoresPanales++;
            const talla = s.tallaPanalAdulto || 'L';
            tallasAdultoMap[talla] = (tallasAdultoMap[talla] || 0) + 1;
          }
        });
      }

      if (v.tieneDiscapacidad && v.discapacidadInfo) {
        v.discapacidadInfo.forEach(d => {
          totalDiscapacidad++;
          const t = d.tipoDiscapacidad || 'Otra';
          tiposDiscapacidadMap[t] = (tiposDiscapacidadMap[t] || 0) + 1;
          if (d.requiereAyudaTecnica) {
            ayudasTecnicasCount++;
          }
        });
      }

      if (v.tieneMascotas && v.mascotasInfo && v.mascotasInfo.length > 0) {
        hogaresConMascotas++;
        v.mascotasInfo.forEach(p => {
          const qty = p.cantidad || 1;
          totalMascotas += qty;
          const tipo = p.tipo || 'Perro';
          tiposMascotasMap[tipo] = (tiposMascotasMap[tipo] || 0) + qty;
          
          if (tipo === 'Perro') {
            totalPerros += qty;
            if (p.requiereAlimento) perrosRequierenAlimento += qty;
          } else if (tipo === 'Gato') {
            totalGatos += qty;
            if (p.requiereAlimento) gatosRequierenAlimento += qty;
          }

          if (p.requiereAlimento) {
            mascotasRequierenAlimento += qty;
          }
        });
      }
    });

    return {
      totalNinos,
      ninosPanales,
      ninosLeche,
      etapasPanalMap,
      totalAdultosMayores,
      adultosMayoresPanales,
      tallasAdultoMap,
      totalDiscapacidad,
      tiposDiscapacidadMap,
      ayudasTecnicasCount,
      totalMascotas,
      hogaresConMascotas,
      totalPerros,
      totalGatos,
      perrosRequierenAlimento,
      gatosRequierenAlimento,
      mascotasRequierenAlimento,
      tiposMascotasMap
    };
  }, [beneficiaries]);

  const pendingBeneficiariesList = beneficiaries.filter(b => b.estadoEntrega === 'PENDIENTE').slice(0, 5);
  const lowStockItems = inventory.filter(i => i.stockActual <= i.stockMinimoAlerta);

  // Friendly date title for current filter
  const dateFilterLabel = useMemo(() => {
    if (overviewDatePreset === 'ALL') return 'Todo el Histórico Registrado';
    if (overviewDatePreset === 'TODAY') return 'Entregas de HOY';
    if (overviewDatePreset === 'YESTERDAY') return 'Entregas de AYER';
    if (overviewDatePreset === 'LAST_7_DAYS') return 'Últimos 7 Días';
    if (overviewDatePreset === 'THIS_MONTH') return 'Entregas de Este Mes';
    if (overviewStartDate && overviewEndDate) {
      return `${formatDisplayDate(overviewStartDate)} al ${formatDisplayDate(overviewEndDate)}`;
    }
    return 'Período Seleccionado';
  }, [overviewDatePreset, overviewStartDate, overviewEndDate]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER BANNER & ACTION */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-2xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Jornada Activa de Distribución • Chiminangos</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Control General de Entregas & Censo Chiminangos
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Panel unificado para consultar la cobertura del censo y validar qué apartamentos han recibido mercados por fecha.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenNewDelivery}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/50 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>+ Registrar Entrega de Mercado</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. NON-REDUNDANT GLOBAL KPI CARDS (4 Essential Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Entregados */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Mercados Entregados</span>
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-emerald-950">{stats.totalMercadosEntregados}</div>
            <p className="text-xs text-emerald-800 font-medium mt-1">
              {stats.entregasResidentes ?? 296} a residentes + {stats.entregasExternos ?? 12} externos
            </p>
          </div>
        </div>

        {/* Metric 2: Viviendas Censadas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Viviendas / Aptos</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">
              {stats.totalAptosUnicos || censusStats.totalAptos}
            </div>
            <p className="text-xs text-slate-500 mt-1">Apartamentos censados en Chiminangos</p>
          </div>
        </div>

        {/* Metric 3: Censo Poblacional */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">Habitantes Censados</span>
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-blue-950">{censusStats.totalHabitantes}</div>
            <p className="text-xs text-blue-800 font-medium mt-1">
              Promedio de {censusStats.promedio} personas / hogar
            </p>
          </div>
        </div>

        {/* Metric 4: Insumos en Bodega */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Bodega / Stock</span>
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">{stats.totalStockDisponible}</div>
            <p className="text-xs text-slate-500 mt-1">Kits de alimentos disponibles</p>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE DATE FILTER & APARTMENTS DELIVERED PANEL */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
        {/* Filter Header & Preset Selector */}
        <div className="p-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">
                  Filtro de Entregas por Fecha & Apartamentos Atendidos
                </h3>
                <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 text-xs font-bold rounded-full border border-indigo-400/40">
                  {dateFilterLabel}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Selecciona la fecha para identificar al instante qué apartamentos y personas recibieron mercado ese día.
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 font-bold">
            <button
              onClick={() => handleOverviewPreset('TODAY')}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                overviewDatePreset === 'TODAY'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => handleOverviewPreset('YESTERDAY')}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                overviewDatePreset === 'YESTERDAY'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Ayer
            </button>
            <button
              onClick={() => handleOverviewPreset('LAST_7_DAYS')}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                overviewDatePreset === 'LAST_7_DAYS'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Últimos 7 Días
            </button>
            <button
              onClick={() => handleOverviewPreset('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                overviewDatePreset === 'THIS_MONTH'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => handleOverviewPreset('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                overviewDatePreset === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todo el Histórico
            </button>
          </div>
        </div>

        {/* Custom Date Inputs (when active or needed) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-bold">Desde:</span>
              <input
                type="date"
                value={overviewStartDate}
                onChange={e => {
                  setOverviewDatePreset('CUSTOM');
                  setOverviewStartDate(e.target.value);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-bold">Hasta:</span>
              <input
                type="date"
                value={overviewEndDate}
                onChange={e => {
                  setOverviewDatePreset('CUSTOM');
                  setOverviewEndDate(e.target.value);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Quick Date Stats Highlights */}
          <div className="flex items-center space-x-4 text-xs">
            <div className="bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5">
              <PackageCheck className="w-4 h-4 text-emerald-700" />
              <span>{overviewDateStats.totalMercadosKits} Mercados en esta fecha</span>
            </div>
            <div className="bg-blue-100 text-blue-900 px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-blue-700" />
              <span>{apartmentsDeliveredInDateRange.length} Aptos Atendidos</span>
            </div>
          </div>
        </div>

        {/* Search & Mode Switcher */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Apto (ej. 4B42, 3E43), Nombre o Cédula..."
              value={aptSearchQuery}
              onChange={e => setAptSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAptViewMode('DATE_FILTERED')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                aptViewMode === 'DATE_FILTERED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Atendidos en la Fecha ({apartmentsDeliveredInDateRange.length})
            </button>
            <button
              onClick={() => setAptViewMode('HISTORIC_ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                aptViewMode === 'HISTORIC_ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Consolidado Censo 600 Aptos
            </button>
          </div>
        </div>

        {/* APARTMENTS TABLE - MODE 1: DATE FILTERED (PRIMARY INTENT) */}
        {aptViewMode === 'DATE_FILTERED' && (
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Apartamento / Ubicación</th>
                  <th className="px-6 py-3">Titular / Beneficiario</th>
                  <th className="px-6 py-3">Sector & Agrupación</th>
                  <th className="px-6 py-3">Mercados Entregados</th>
                  <th className="px-6 py-3">Fecha & Hora Exactas</th>
                  <th className="px-6 py-3">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDateAptos.map(apt => (
                  <tr key={apt.key} className="hover:bg-slate-50/90 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{apt.aptoCode}</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">{apt.direccion}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-slate-900">{apt.beneficiarioNombre}</div>
                      <div className="text-slate-500 text-[11px] font-mono">C.C. {apt.beneficiarioCedula}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-800">{apt.sector}</div>
                      <div className="text-slate-500 text-[11px]">{apt.agrupacion}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold rounded-lg text-xs inline-flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{apt.totalKits} {apt.totalKits === 1 ? 'Mercado' : 'Mercados'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-slate-900">
                        {formatDisplayDate(apt.lastFecha)}
                      </div>
                      {formatDisplayTime(apt.lastFecha) && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          {formatDisplayTime(apt.lastFecha)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 font-medium">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[11px] font-medium">
                        {apt.responsable}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredDateAptos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-800 text-sm">
                        No se registran entregas de mercados en la fecha seleccionada ({dateFilterLabel}).
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Prueba seleccionando "Ayer" o "Todo el Histórico" para ver los apartamentos registrados.
                      </p>
                      <button
                        onClick={() => handleOverviewPreset('ALL')}
                        className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Ver Todo el Histórico
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* APARTMENTS TABLE - MODE 2: HISTORIC CENSUS ALL (AUDIT) */}
        {aptViewMode === 'HISTORIC_ALL' && (
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Apartamento / Vivienda</th>
                  <th className="px-6 py-3">Sector & Agrupación</th>
                  <th className="px-6 py-3">Habitantes (Censo)</th>
                  <th className="px-6 py-3">Entregas Históricas</th>
                  <th className="px-6 py-3">Titular(es) Registrado(s)</th>
                  <th className="px-6 py-3">Última Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredHistoricApts.map(apt => {
                  const delCount = apt.deliveries.length;
                  const lastDel = apt.deliveries[0];
                  const isAptCensused = apt.residents.some(r => r.censoActualizado && r.integrantesHogar > 0);
                  const totalPeopleInApt = apt.residents.reduce((acc, r) => acc + (r.censoActualizado ? (r.integrantesHogar || 0) : 0), 0);

                  return (
                    <tr key={apt.key} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{apt.direccion}</span>
                        </div>
                        <div className="text-slate-500 text-[11px]">{apt.descripcion}</div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-semibold text-slate-800">{apt.sector}</div>
                        <div className="text-slate-500 text-[11px]">{apt.agrupacion}</div>
                      </td>
                      <td className="px-6 py-3">
                        {isAptCensused ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-950 border border-emerald-300 font-extrabold rounded-lg text-xs inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{totalPeopleInApt} {totalPeopleInApt === 1 ? 'persona' : 'personas'}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300 font-bold rounded-lg text-xs inline-flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pendiente Censo</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {delCount > 1 ? (
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-900 border border-purple-300 font-extrabold rounded-lg text-xs inline-flex items-center gap-1">
                            <PackageCheck className="w-3.5 h-3.5 text-purple-700" />
                            <span>{delCount} Mercados</span>
                          </span>
                        ) : delCount === 1 ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold rounded-lg text-xs inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>1 Mercado</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 font-medium rounded-lg text-xs">
                            0 (Pendiente)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="space-y-0.5">
                          {apt.residents.map(r => (
                            <div key={r.id} className="text-slate-800 font-medium text-[11px]">
                              • {r.nombre} <span className="text-slate-500 font-mono text-[10px]">(C.C. {r.cedula})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-600 font-medium">
                        {lastDel ? (
                          <div>
                            <div>{formatDisplayDate(lastDel.fecha)}</div>
                            <div className="text-[10px] text-slate-400">{lastDel.responsable}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal">Sin fecha</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. TABLERO DE NECESIDADES ESPECIALES EN EL HOGAR (VULNERABILIDADES) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg border border-slate-700/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-700/80">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/20 text-amber-300 font-bold text-xs rounded-full border border-amber-500/30 mb-2">
              <HeartHandshake className="w-4 h-4 text-amber-400" />
              <span>Consolidado en Línea • Ayudas & Necesidades Específicas</span>
            </div>
            <h3 className="text-xl font-extrabold text-white">Tablero de Necesidades Especiales en el Hogar</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Identificación en tiempo real de niños (pañales/leche), abuelos (pañales adulto) y personas con discapacidad para consecución de ayudas.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('reports')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ver Reportes de Ayudas</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Section 1: Niños & Bebés */}
          <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center space-x-1.5">
                <Baby className="w-4 h-4" />
                <span>Niños y Bebés</span>
              </span>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 font-bold text-xs rounded border border-blue-500/40">
                {vulnerabilityStats.totalNinos} Registrados
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[11px]">Pañales Etapas</span>
                <span className="text-lg font-extrabold text-blue-300">{vulnerabilityStats.ninosPanales}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">requieren pañales</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[11px]">Leche / Fórmula</span>
                <span className="text-lg font-extrabold text-blue-300">{vulnerabilityStats.ninosLeche}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">requieren apoyo lácteo</span>
              </div>
            </div>

            {Object.keys(vulnerabilityStats.etapasPanalMap).length > 0 && (
              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/60 text-[11px]">
                <span className="font-bold text-slate-300 block mb-1">Desglose Pañales Infantil:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(vulnerabilityStats.etapasPanalMap).map(([etapa, qty]) => (
                    <span key={etapa} className="px-2 py-0.5 bg-blue-950 text-blue-200 rounded font-medium border border-blue-800">
                      {etapa}: <strong>{qty}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Adultos Mayores */}
          <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4" />
                <span>Adultos Mayores</span>
              </span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold text-xs rounded border border-amber-500/40">
                {vulnerabilityStats.totalAdultosMayores} Registrados
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700 col-span-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 block text-[11px]">Pañales Adulto Mayor</span>
                  <span className="text-lg font-extrabold text-amber-300">{vulnerabilityStats.adultosMayoresPanales}</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">adultos mayores que requieren pañal</span>
              </div>
            </div>

            {Object.keys(vulnerabilityStats.tallasAdultoMap).length > 0 && (
              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/60 text-[11px]">
                <span className="font-bold text-slate-300 block mb-1">Desglose Pañales Adulto:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(vulnerabilityStats.tallasAdultoMap).map(([talla, qty]) => (
                    <span key={talla} className="px-2 py-0.5 bg-amber-950 text-amber-200 rounded font-medium border border-amber-800">
                      Talla {talla}: <strong>{qty}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Discapacidad */}
          <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center space-x-1.5">
                <Accessibility className="w-4 h-4" />
                <span>Discapacidad</span>
              </span>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 font-bold text-xs rounded border border-purple-500/40">
                {vulnerabilityStats.totalDiscapacidad} Registrados
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[11px]">Casos Totales</span>
                <span className="text-lg font-extrabold text-purple-300">{vulnerabilityStats.totalDiscapacidad}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">personas</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[11px]">Ayudas Técnicas</span>
                <span className="text-lg font-extrabold text-purple-300">{vulnerabilityStats.ayudasTecnicasCount}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">silla ruedas/muletas</span>
              </div>
            </div>

            {Object.keys(vulnerabilityStats.tiposDiscapacidadMap).length > 0 && (
              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/60 text-[11px]">
                <span className="font-bold text-slate-300 block mb-1">Tipos Detectados:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(vulnerabilityStats.tiposDiscapacidadMap).map(([tipo, qty]) => (
                    <span key={tipo} className="px-2 py-0.5 bg-purple-950 text-purple-200 rounded font-medium border border-purple-800">
                      {tipo}: <strong>{qty}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Censo de Mascotas */}
          <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                <Dog className="w-4 h-4" />
                <span>Censo de Mascotas</span>
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded border border-emerald-500/40">
                {vulnerabilityStats.totalMascotas} en {vulnerabilityStats.hogaresConMascotas} Hogares
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/70 p-2 rounded-lg border border-emerald-600/30 flex items-center justify-between">
                <div>
                  <span className="text-slate-300 block text-[11px] font-bold">🐶 Perros</span>
                  <span className="text-[10px] text-slate-400">{vulnerabilityStats.perrosRequierenAlimento} con comida</span>
                </div>
                <span className="text-xl font-extrabold text-amber-400">{vulnerabilityStats.totalPerros}</span>
              </div>

              <div className="bg-slate-900/70 p-2 rounded-lg border border-emerald-600/30 flex items-center justify-between">
                <div>
                  <span className="text-slate-300 block text-[11px] font-bold">🐱 Gatos</span>
                  <span className="text-[10px] text-slate-400">{vulnerabilityStats.gatosRequierenAlimento} con comida</span>
                </div>
                <span className="text-xl font-extrabold text-cyan-400">{vulnerabilityStats.totalGatos}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[11px]">Total General</span>
                <span className="text-lg font-extrabold text-emerald-300">{vulnerabilityStats.totalMascotas}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[11px]">Requieren Concentrado</span>
                <span className="text-lg font-extrabold text-emerald-300">{vulnerabilityStats.mascotasRequierenAlimento}</span>
              </div>
            </div>

            {Object.keys(vulnerabilityStats.tiposMascotasMap).length > 0 && (
              <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-700/60 text-[11px]">
                <span className="font-bold text-slate-300 block mb-1">Todas las Especies:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(vulnerabilityStats.tiposMascotasMap).map(([tipo, qty]) => (
                    <span key={tipo} className="px-2 py-0.5 bg-emerald-950 text-emerald-200 rounded font-medium border border-emerald-800">
                      {tipo === 'Perro' ? '🐶 Perros' : tipo === 'Gato' ? '🐱 Gatos' : tipo === 'Ave' ? '🦜 Aves' : tipo === 'Conejo' ? '🐰 Conejos' : `🐾 ${tipo}`}: <strong>{qty}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. OPERATIONAL CONTROL & SECTOR COVERAGE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cobertura por Agrupación */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>Cobertura de Entregas por Agrupación y Sector</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Avance porcentual de distribución en los sectores censados de Chiminangos.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('beneficiaries')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {agrupacionGroups.map(([agrupacion, counts]) => {
              const pct = Math.round((counts.entregados / counts.total) * 100) || 0;
              return (
                <div key={agrupacion} className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                    <span className="text-slate-800 font-bold">{agrupacion}</span>
                    <span className="text-slate-600">
                      <strong>{counts.entregados}</strong> de {counts.total} entregados ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock & Quick Pendings Panel */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Estado de Insumos & Alertas</span>
            </h3>

            {lowStockItems.length > 0 ? (
              <div className="space-y-2.5">
                {lowStockItems.map(item => (
                  <div key={item.id} className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-amber-900">{item.nombre}</p>
                      <p className="text-[11px] text-amber-700">Mínimo: {item.stockMinimoAlerta} {item.unidadMedida}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-600 text-white font-extrabold text-xs rounded-lg">
                      {item.stockActual} {item.unidadMedida}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-emerald-900">Stock Óptimo</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Todos los insumos superan el umbral de alerta.</p>
              </div>
            )}

            <button
              onClick={() => onNavigateTab('inventory')}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Gestionar Inventario Completo →
            </button>
          </div>

          {/* Quick Pending Dispatch */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Pendientes Prioritarios</span>
              <span className="text-xs font-normal text-slate-500">Próximos en censo</span>
            </h3>

            <div className="space-y-2">
              {pendingBeneficiariesList.map(b => (
                <div key={b.id} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 flex items-center justify-between transition-colors">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-800 truncate">#{b.no} - {b.nombre}</p>
                    <p className="text-[11px] text-slate-500 truncate">C.C. {b.cedula} • {b.direccion}</p>
                  </div>
                  <button
                    onClick={() => onSelectBeneficiaryForDelivery(b)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                  >
                    Entregar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
