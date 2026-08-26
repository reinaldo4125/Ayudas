import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  BarChart2, 
  PieChart, 
  CheckCircle2, 
  Shield, 
  Calendar, 
  Search, 
  X, 
  FileSpreadsheet, 
  Trash2, 
  Baby, 
  Accessibility, 
  HeartHandshake, 
  UserCheck, 
  Dog,
  Clock,
  Filter,
  Layers,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Building2,
  Users,
  Award,
  CheckSquare,
  FileCheck2,
  BadgeCheck,
  ShieldCheck,
  Building
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Beneficiary, InventoryItem, DeliveryRecord } from '../types';
import { exportDeliveriesToCSV, exportVulnerabilitiesToCSV } from '../lib/storage';
import { 
  DatePreset, 
  getPresetDateRange, 
  isDeliveryInDateRange, 
  calculateDeliveriesDateStats, 
  formatDisplayDate,
  formatDisplayTime
} from '../lib/dateUtils';
import { calculateConsolidatedCensusStats } from '../lib/householdUtils';

interface ReportsViewProps {
  beneficiaries: Beneficiary[];
  inventory: InventoryItem[];
  deliveries: DeliveryRecord[];
  onDeleteDelivery?: (deliveryId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  beneficiaries,
  inventory,
  deliveries,
  onDeleteDelivery
}) => {
  // Navigation Tabs for Executive View
  const [activeTab, setActiveTab] = useState<'PANEL_CONTROL' | 'BITACORA_ACTAS' | 'MATRIZ_VULNERABILIDAD'>('PANEL_CONTROL');

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState<'ALL' | 'NINOS' | 'ABUELOS' | 'DISCAPACIDAD' | 'MASCOTAS'>('ALL');
  const [vulnerabilityQuery, setVulnerabilityQuery] = useState('');
  const [selectedDeliveryForActa, setSelectedDeliveryForActa] = useState<DeliveryRecord | null>(null);

  // Date Range Filter State for Deliveries
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('ALL');

  // Handle Date Preset Click
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else {
      const range = getPresetDateRange(preset);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  };

  // Reset Date Filter
  const handleResetDateFilter = () => {
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedSectorFilter('ALL');
  };

  // Filter deliveries by date range and sector
  const dateFilteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      // 1. Date Range Filter
      if (!isDeliveryInDateRange(d.fecha, startDate, endDate)) {
        return false;
      }
      // 2. Sector Filter
      if (selectedSectorFilter !== 'ALL') {
        const sec = d.sector || 'Sector 1';
        const ag = d.agrupacion || 'Sector General';
        if (selectedSectorFilter.startsWith('Agrupación') && ag !== selectedSectorFilter) return false;
        if (selectedSectorFilter === 'EXTERNO' && (!sec.toLowerCase().includes('externo') && !ag.toLowerCase().includes('externo'))) return false;
        if (selectedSectorFilter === 'SECTOR_1' && (sec.toLowerCase().includes('externo') || ag.toLowerCase().includes('externo'))) return false;
      }
      return true;
    });
  }, [deliveries, startDate, endDate, selectedSectorFilter]);

  // Analytical stats for the filtered date deliveries (with apartment consolidation)
  const periodStats = useMemo(() => {
    return calculateDeliveriesDateStats(dateFilteredDeliveries, beneficiaries);
  }, [dateFilteredDeliveries, beneficiaries]);

  // Overall Global Census Metrics for Managerial Comparison
  const globalCensusMetrics = useMemo(() => {
    const totalAptosCenso = 600;
    const deliveredAptosSet = new Set<string>();
    deliveries.forEach(d => {
      const isExt = (d.sector || '').toLowerCase().includes('externo') || (d.agrupacion || '').toLowerCase().includes('externo');
      if (!isExt && d.beneficiarioDireccion) {
        deliveredAptosSet.add(d.beneficiarioDireccion.trim().toLowerCase());
      }
    });
    const totalAptosConEntrega = deliveredAptosSet.size;
    const porcentajeCobertura = Math.round((totalAptosConEntrega / totalAptosCenso) * 100);

    const consolidatedStats = calculateConsolidatedCensusStats(beneficiaries);
    const totalPersonasCenso = consolidatedStats.totalHabitantes;
    const entregasResidentes = deliveries.filter(d => !(d.sector || '').toLowerCase().includes('externo') && !(d.agrupacion || '').toLowerCase().includes('externo')).length;
    const entregasExternos = deliveries.filter(d => (d.sector || '').toLowerCase().includes('externo') || (d.agrupacion || '').toLowerCase().includes('externo')).length;

    return {
      totalAptosCenso,
      totalAptosConEntrega,
      porcentajeCobertura,
      totalPersonasCenso,
      entregasResidentes,
      entregasExternos
    };
  }, [beneficiaries, deliveries]);

  // Filtered Deliveries with search text for the bitácora table
  const searchFilteredDeliveries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return dateFilteredDeliveries;
    return dateFilteredDeliveries.filter(d => (
      d.beneficiarioNombre.toLowerCase().includes(q) ||
      d.beneficiarioCedula.toLowerCase().includes(q) ||
      d.beneficiarioDireccion.toLowerCase().includes(q) ||
      d.agrupacion.toLowerCase().includes(q) ||
      d.responsable.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q)
    ));
  }, [dateFilteredDeliveries, searchQuery]);

  // Handle Export Filtered Deliveries to CSV with date descriptor
  const handleExportFilteredCSV = () => {
    let dateDescriptor = 'Todas_Las_Fechas';
    if (startDate && endDate) {
      dateDescriptor = `${startDate}_a_${endDate}`;
    } else if (startDate) {
      dateDescriptor = `Desde_${startDate}`;
    } else if (endDate) {
      dateDescriptor = `Hasta_${endDate}`;
    }
    const filename = `Informe_Gerencial_Entregas_${dateDescriptor}.csv`;
    exportDeliveriesToCSV(dateFilteredDeliveries, filename);
  };

  // Filter beneficiaries with special needs
  const vulnerableBeneficiaries = useMemo(() => {
    return beneficiaries.filter(b => {
      const v = b.vulnerabilidades;
      if (!v || (!v.tieneNinos && !v.tieneAdultoMayor && !v.tieneDiscapacidad && !v.tieneMascotas)) return false;

      if (vulnerabilityFilter === 'NINOS' && !v.tieneNinos) return false;
      if (vulnerabilityFilter === 'ABUELOS' && !v.tieneAdultoMayor) return false;
      if (vulnerabilityFilter === 'DISCAPACIDAD' && !v.tieneDiscapacidad) return false;
      if (vulnerabilityFilter === 'MASCOTAS' && !v.tieneMascotas) return false;

      if (!vulnerabilityQuery) return true;
      const q = vulnerabilityQuery.toLowerCase();
      return (
        b.nombre.toLowerCase().includes(q) ||
        b.cedula.toLowerCase().includes(q) ||
        b.direccion.toLowerCase().includes(q)
      );
    });
  }, [beneficiaries, vulnerabilityFilter, vulnerabilityQuery]);

  // Calculate Agrupaciones Chart Data dynamically linked to active Date & Sector filters
  const agrupacionData = useMemo(() => {
    // Map of census totals per Agrupación
    const map: Record<string, { total: number; entregados: number }> = {};

    // Standard ordering for common agrupaciones
    const standardAgrupaciones = [
      'Agrupación 1',
      'Agrupación 2',
      'Agrupación 3',
      'Agrupación 4',
      'Agrupación 5',
      'Sector General',
      'Usuarios Externos'
    ];

    standardAgrupaciones.forEach(ag => {
      map[ag] = { total: 0, entregados: 0 };
    });

    // Populate census totals
    beneficiaries.forEach(b => {
      const ag = b.agrupacion || 'Sector General';
      if (!map[ag]) map[ag] = { total: 0, entregados: 0 };
      map[ag].total += 1;
    });

    // Calculate delivered count in the filtered date & sector range (dateFilteredDeliveries)
    const deliveredAddressesPerAgrupacion: Record<string, Set<string>> = {};

    dateFilteredDeliveries.forEach(d => {
      const ag = d.agrupacion || 'Sector General';
      if (!map[ag]) map[ag] = { total: 0, entregados: 0 };

      if (!deliveredAddressesPerAgrupacion[ag]) {
        deliveredAddressesPerAgrupacion[ag] = new Set<string>();
      }
      const addrKey = (d.beneficiarioDireccion || d.beneficiarioCedula || d.id).trim().toLowerCase();
      deliveredAddressesPerAgrupacion[ag].add(addrKey);
    });

    // Assign dynamic entregados count from filtered deliveries
    Object.keys(map).forEach(ag => {
      const deliveredSet = deliveredAddressesPerAgrupacion[ag];
      map[ag].entregados = deliveredSet ? deliveredSet.size : 0;
    });

    // Filter which agrupaciones to show based on selectedSectorFilter
    let entries = Object.entries(map);

    if (selectedSectorFilter !== 'ALL') {
      entries = entries.filter(([name]) => {
        if (selectedSectorFilter === 'SECTOR_1') return !name.toLowerCase().includes('externo');
        if (selectedSectorFilter === 'EXTERNO') return name.toLowerCase().includes('externo');
        if (selectedSectorFilter.startsWith('Agrupación')) return name === selectedSectorFilter;
        return true;
      });
    }

    return entries.map(([name, data]) => ({
      name,
      Entregados: data.entregados,
      Pendientes: Math.max(0, data.total - data.entregados)
    }));
  }, [beneficiaries, dateFilteredDeliveries, selectedSectorFilter]);

  // Dynamic Inventory distribution Chart Data based on active Date & Sector filters
  const inventoryChartData = useMemo(() => {
    // Map delivered quantity per item in the filtered period
    const deliveredInPeriodMap: Record<string, number> = {};

    dateFilteredDeliveries.forEach(d => {
      if (d.articulos && d.articulos.length > 0) {
        d.articulos.forEach(art => {
          const itemKey = (art.itemId || art.itemNombre || '').trim().toLowerCase();
          deliveredInPeriodMap[itemKey] = (deliveredInPeriodMap[itemKey] || 0) + (art.cantidad || 0);
        });
      } else {
        // Fallback for deliveries without items array (e.g., 1 Mercado Familiar)
        const primaryKey = (inventory[0]?.id || inventory[0]?.nombre || 'mercado familiar').trim().toLowerCase();
        deliveredInPeriodMap[primaryKey] = (deliveredInPeriodMap[primaryKey] || 0) + 1;
      }
    });

    return inventory.map(item => {
      const itemIdKey = (item.id || '').trim().toLowerCase();
      const itemNameKey = (item.nombre || '').trim().toLowerCase();

      let entregado = 0;
      if (deliveredInPeriodMap[itemIdKey] !== undefined) {
        entregado += deliveredInPeriodMap[itemIdKey];
      }
      if (deliveredInPeriodMap[itemNameKey] !== undefined) {
        entregado += deliveredInPeriodMap[itemNameKey];
      }
      if (entregado === 0) {
        Object.keys(deliveredInPeriodMap).forEach(k => {
          if (k && (k.includes(itemNameKey) || itemNameKey.includes(k))) {
            entregado += deliveredInPeriodMap[k];
          }
        });
      }

      const displayName = item.nombre.split(' ')[0] + ' ' + (item.nombre.split(' ')[1] || '');

      return {
        name: displayName,
        fullName: item.nombre,
        Entregado: entregado,
        Disponible: item.stockActual
      };
    });
  }, [inventory, dateFilteredDeliveries]);

  // Friendly date title for current period filter
  const dateFilterLabel = useMemo(() => {
    if (datePreset === 'ALL') return 'Evaluación Histórica Completa';
    if (datePreset === 'TODAY') return 'Entregas Registradas HOY';
    if (datePreset === 'YESTERDAY') return 'Entregas Registradas AYER';
    if (datePreset === 'LAST_7_DAYS') return 'Últimos 7 Días Calendario';
    if (datePreset === 'THIS_MONTH') return 'Mes En Curso';
    if (datePreset === 'LAST_MONTH') return 'Mes Anterior';
    if (startDate && endDate) {
      return `${formatDisplayDate(startDate)} al ${formatDisplayDate(endDate)}`;
    }
    return 'Rango Personalizado';
  }, [datePreset, startDate, endDate]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. EXECUTIVE INSTITUTIONAL HEADER FOR CONTROL ENTITIES */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-extrabold text-xs rounded-full border border-emerald-400/30 flex items-center space-x-1.5 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Informe de Auditoría Gerencial • Ente de Control</span>
              </span>
              <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-xs font-mono rounded border border-slate-700">
                Sector 1 Chiminangos
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Reporte de Control, Auditoría & Actas Oficiales
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl">
              Consolidado ejecutivo para la presentación formal ante organismos de control (Personería, Contraloría, Alcaldía o Veeduría). Incluye trazabilidad de entregas, actas con firma e indicadores de vulnerabilidad.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleExportFilteredCSV}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
              title="Descargar informe oficial para entes de control en formato CSV"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Informe de Auditoría (CSV)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Informe</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE NON-REDUNDANT KPI CARDS (4 Key Managerial Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Cobertura del Censo (% de Viviendas Atendidas) */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">Cobertura del Censo</span>
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <BadgeCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-950">{globalCensusMetrics.porcentajeCobertura}%</div>
            <p className="text-xs text-emerald-800 font-medium mt-1">
              {globalCensusMetrics.totalAptosConEntrega} de {globalCensusMetrics.totalAptosCenso} apartamentos atendidos
            </p>
          </div>
        </div>

        {/* Metric 2: Total Mercados Despachados en el Período Evaluado */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 bg-indigo-50/20 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">Mercados en Período</span>
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-indigo-950">{periodStats.totalMercadosKits}</div>
            <p className="text-xs text-indigo-800 font-medium mt-1">
              Despachados a {periodStats.totalBeneficiariosUnicos} hogares únicos en el rango
            </p>
          </div>
        </div>

        {/* Metric 3: Población Impactada (Habitantes Alimentados) */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-blue-950 uppercase tracking-wider">Población Impactada</span>
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-blue-950">{periodStats.totalPersonasAlimentadas}</div>
            <p className="text-xs text-blue-800 font-medium mt-1">
              Habitantes alimentados según censo de integrantes
            </p>
          </div>
        </div>

        {/* Metric 4: Ritmo Eficiente de Entrega Diaria */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">Ritmo de Despacho</span>
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-amber-950">{periodStats.promedioDiario} <span className="text-xs font-semibold text-amber-800">/día</span></div>
            <p className="text-xs text-amber-800 font-medium mt-1">
              Promedio registrado en {periodStats.diasConEntregas} jornadas activas
            </p>
          </div>
        </div>
      </div>

      {/* 3. EXECUTIVE AUDIT DATE FILTER PANEL */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">
                  Filtro de Evaluación Auditora por Fechas
                </h3>
                <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 text-xs font-extrabold rounded-full border border-indigo-400/40">
                  {dateFilterLabel}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Ajusta el período de evaluación para auditar entregas exactas o verificar cumplimiento en fechas específicas.
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 font-bold">
            <button
              onClick={() => handlePresetChange('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                datePreset === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todo el Histórico
            </button>
            <button
              onClick={() => handlePresetChange('TODAY')}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                datePreset === 'TODAY'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => handlePresetChange('YESTERDAY')}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                datePreset === 'YESTERDAY'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Ayer
            </button>
            <button
              onClick={() => handlePresetChange('LAST_7_DAYS')}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                datePreset === 'LAST_7_DAYS'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Últimos 7 Días
            </button>
            <button
              onClick={() => handlePresetChange('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                datePreset === 'THIS_MONTH'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => handlePresetChange('LAST_MONTH')}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                datePreset === 'LAST_MONTH'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Mes Anterior
            </button>
          </div>
        </div>

        {/* Custom Inputs and Sector Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              📅 Fecha Inicial:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('CUSTOM');
              }}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              📅 Fecha Final:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('CUSTOM');
              }}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              🏢 Sector / Agrupación:
            </label>
            <select
              value={selectedSectorFilter}
              onChange={(e) => setSelectedSectorFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todas las Agrupaciones</option>
              <option value="SECTOR_1">Sector 1 (Completo)</option>
              <option value="Agrupación 1">Agrupación 1</option>
              <option value="Agrupación 2">Agrupación 2</option>
              <option value="Agrupación 3">Agrupación 3</option>
              <option value="Agrupación 4">Agrupación 4</option>
              <option value="Agrupación 5">Agrupación 5</option>
              <option value="EXTERNO">Usuarios Externos</option>
            </select>
          </div>

          <div>
            <button
              onClick={handleResetDateFilter}
              className="w-full px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Restablecer Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. EXECUTIVE TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveTab('PANEL_CONTROL')}
          className={`px-4 py-2.5 font-extrabold text-xs rounded-t-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'PANEL_CONTROL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-emerald-400" />
          <span>Módulo 1: Cuadro de Mando Gerencial & Cobertura</span>
        </button>

        <button
          onClick={() => setActiveTab('BITACORA_ACTAS')}
          className={`px-4 py-2.5 font-extrabold text-xs rounded-t-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'BITACORA_ACTAS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-indigo-400" />
          <span>Módulo 2: Bitácora de Despachos & Actas Oficiales ({searchFilteredDeliveries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('MATRIZ_VULNERABILIDAD')}
          className={`px-4 py-2.5 font-extrabold text-xs rounded-t-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'MATRIZ_VULNERABILIDAD'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-amber-400" />
          <span>Módulo 3: Matriz de Población Vulnerable</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CUADRO DE MANDO GERENCIAL & COBERTURA */}
      {/* ========================================================================= */}
      {activeTab === 'PANEL_CONTROL' && (
        <div className="space-y-6">
          {/* Visual Analytics Grid: Agrupaciones and Inventory */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Cobertura por Agrupación */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Cobertura por Agrupación (Entregados vs Pendientes)</span>
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold rounded-full shrink-0 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>{dateFilterLabel}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Compara los apartamentos atendidos en el período filtrado (<strong className="text-slate-700">{dateFilterLabel}</strong>) contra el censo de cada agrupación.
              </p>

              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agrupacionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="Entregados" name="Aptos Atendidos" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Pendientes" name="Aptos Pendientes" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Inventory Outflow */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-600" />
                  <span>Balance de Bodega (Insumos Entregados vs Disponible)</span>
                </h3>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-extrabold rounded-full shrink-0 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span>{dateFilterLabel}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Trazabilidad del volumen de insumos entregados durante el período seleccionado (<strong className="text-slate-700">{dateFilterLabel}</strong>) frente al stock disponible en bodega.
              </p>

              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="Entregado" name="Kits Entregados" fill="#059669" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Disponible" name="Kits en Bodega" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Timeline chart for date distribution */}
          {periodStats.porDia.length > 0 && (
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 text-white space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-400" />
                    <span>Ritmo Diario de Entregas en el Período Evaluado</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Haga clic en cualquier fecha para enfocar la bitácora exclusivamente en las entregas de ese día.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-300 bg-indigo-950 px-3 py-1 rounded-full border border-indigo-800">
                  {periodStats.porDia.length} Días con Entregas
                </span>
              </div>

              {/* Day Selector Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {periodStats.porDia.map(d => (
                  <button
                    key={d.fecha}
                    onClick={() => {
                      setStartDate(d.fecha);
                      setEndDate(d.fecha);
                      setDatePreset('CUSTOM');
                      setActiveTab('BITACORA_ACTAS');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center space-x-2 cursor-pointer ${
                      startDate === d.fecha && endDate === d.fecha
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <span>{d.label}:</span>
                    <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded font-mono text-[11px]">
                      {d.mercados} mercados
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BITÁCORA OFICIAL DE ENTREGAS & ACTAS DE AUDITORÍA */}
      {/* ========================================================================= */}
      {activeTab === 'BITACORA_ACTAS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-slate-900">Bitácora Oficial de Entregas & Actas</h3>
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 font-extrabold text-xs rounded-full">
                  {searchFilteredDeliveries.length} Registros Auditar
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {startDate && endDate 
                  ? `Mostrando entregas entre ${formatDisplayDate(startDate)} y ${formatDisplayDate(endDate)}` 
                  : 'Mostrando todo el historial de entregas registradas en el sistema.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por cédula, nombre, apto (ej. 4B42)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleExportFilteredCSV}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Filtrados</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">ID Registro</th>
                  <th className="px-6 py-3.5">Beneficiario / Cédula</th>
                  <th className="px-6 py-3.5">Ubicación / Apto</th>
                  <th className="px-6 py-3.5">Mercado / Insumos</th>
                  <th className="px-6 py-3.5">Fecha & Hora Exactas</th>
                  <th className="px-6 py-3.5">Responsable</th>
                  <th className="px-6 py-3.5 text-right">Acta Oficial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {searchFilteredDeliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-[11px] font-bold text-slate-600">
                      {del.id.slice(0, 12)}
                    </td>
                    <td className="px-6 py-3.5 font-extrabold text-slate-900">
                      <div>{del.beneficiarioNombre}</div>
                      <div className="font-normal font-mono text-slate-500 text-[11px]">C.C. {del.beneficiarioCedula}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="text-slate-900 font-extrabold flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{del.beneficiarioDireccion}</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">{del.agrupacion}</div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-800">
                      <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-950 font-extrabold rounded-lg border border-emerald-300 text-xs shadow-xs">
                        {del.articulos.map(a => `${a.cantidad} ${a.unidad} ${a.itemNombre}`).join(', ') || '1 Kit Mercado Familiar'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">
                      <div className="font-mono text-slate-900 font-extrabold">
                        {formatDisplayDate(del.fecha)}
                      </div>
                      {formatDisplayTime(del.fecha) && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          {formatDisplayTime(del.fecha)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-medium rounded text-[11px]">
                        {del.responsable}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedDeliveryForActa(del)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer flex items-center space-x-1 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ver Acta</span>
                        </button>

                        {onDeleteDelivery && (
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Anular entrega de ${del.beneficiarioNombre}? Se devolverá el stock al inventario.`)) {
                                onDeleteDelivery(del.id);
                              }
                            }}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 rounded-xl font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors"
                            title="Anular esta entrega y devolver el mercado a bodega"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Anular</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {searchFilteredDeliveries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 space-y-2">
                      <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-800">No se encontraron entregas para el período o búsqueda seleccionados.</p>
                      <button
                        onClick={handleResetDateFilter}
                        className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Ver Todas las Entregas
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MATRIZ DE POBLACIÓN VULNERABLE & REQUERIMIENTOS DE AYUDA */}
      {/* ========================================================================= */}
      {activeTab === 'MATRIZ_VULNERABILIDAD' && (
        <div className="bg-white rounded-2xl border border-amber-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-50/50 to-orange-50/30">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-amber-100 text-amber-900 font-extrabold text-xs rounded-full mb-1 border border-amber-200">
                <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
                <span>Matriz Gerencial de Focalización de Ayudas</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Reporte de Familias con Necesidades Especiales (Pañales, Leche, Discapacidad, Mascotas)
              </h3>
              <p className="text-xs text-slate-500">
                Informe focalizado para auditoría gubernamental y consecución de donaciones específicas.
              </p>
            </div>

            <button
              onClick={() => exportVulnerabilitiesToCSV(vulnerableBeneficiaries)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Matriz de Ayudas (CSV)</span>
            </button>
          </div>

          {/* Filters and Search Bar for Vulnerabilities */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setVulnerabilityFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  vulnerabilityFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Todos los Casos ({beneficiaries.filter(b => b.vulnerabilidades && (b.vulnerabilidades.tieneNinos || b.vulnerabilidades.tieneAdultoMayor || b.vulnerabilidades.tieneDiscapacidad || b.vulnerabilidades.tieneMascotas)).length})
              </button>
              <button
                onClick={() => setVulnerabilityFilter('NINOS')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                  vulnerabilityFilter === 'NINOS'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
                }`}
              >
                <Baby className="w-3.5 h-3.5" />
                <span>Niños / Pañales / Leche</span>
              </button>
              <button
                onClick={() => setVulnerabilityFilter('ABUELOS')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                  vulnerabilityFilter === 'ABUELOS'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Adultos Mayores</span>
              </button>
              <button
                onClick={() => setVulnerabilityFilter('DISCAPACIDAD')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                  vulnerabilityFilter === 'DISCAPACIDAD'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-purple-800 hover:bg-purple-50 border border-purple-200'
                }`}
              >
                <Accessibility className="w-3.5 h-3.5" />
                <span>Discapacidad</span>
              </button>
              <button
                onClick={() => setVulnerabilityFilter('MASCOTAS')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                  vulnerabilityFilter === 'MASCOTAS'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
                }`}
              >
                <Dog className="w-3.5 h-3.5" />
                <span>Mascotas</span>
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por nombre, cédula o apto..."
                value={vulnerabilityQuery}
                onChange={e => setVulnerabilityQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Table of Vulnerabilities */}
          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-center w-12">#</th>
                  <th className="px-4 py-3">Beneficiario / Cédula</th>
                  <th className="px-4 py-3">Ubicación & Apto</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Detalle Necesidades / Ayudas Requeridas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {vulnerableBeneficiaries.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-center font-extrabold text-slate-400">{b.no}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-900">
                      <div>{b.nombre}</div>
                      <div className="text-[11px] font-mono text-slate-500 font-normal">C.C. {b.cedula}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-900 font-bold">
                      <div>{b.direccion}</div>
                      <div className="text-[10px] text-emerald-700 font-medium">{b.agrupacion}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-mono">
                      {b.telefono || <span className="text-slate-400 italic">No registrado</span>}
                    </td>
                    <td className="px-4 py-3 space-y-1.5">
                      {b.vulnerabilidades?.tieneNinos && (b.vulnerabilidades.ninosInfo || []).length > 0 && (
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-200 text-blue-900 text-[11px]">
                          <span className="font-bold flex items-center gap-1">
                            <Baby className="w-3.5 h-3.5 text-blue-600" />
                            <span>Niño(s) en hogar:</span>
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 mt-0.5 pl-1">
                            {b.vulnerabilidades.ninosInfo?.map((c, i) => (
                              <li key={i}>
                                Edad: <strong>{c.edad}</strong>
                                {c.requierePanales && <span> • Requiere Pañales ({c.etapaPanal || 'Etapa 2'})</span>}
                                {c.requiereLeche && <span> • Requiere Leche ({c.tipoLeche || 'Fórmula'})</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {b.vulnerabilidades?.tieneAdultoMayor && (b.vulnerabilidades.adultosMayoresInfo || []).length > 0 && (
                        <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
                          <span className="font-bold flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                            <span>Adulto(s) Mayor(es):</span>
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 mt-0.5 pl-1">
                            {b.vulnerabilidades.adultosMayoresInfo?.map((s, i) => (
                              <li key={i}>
                                Edad: <strong>{s.edad}</strong>
                                {s.requierePanalesAdulto && <span> • Pañales Adulto (Talla {s.tallaPanalAdulto || 'L'})</span>}
                                {s.detalles && <span> • {s.detalles}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {b.vulnerabilidades?.tieneDiscapacidad && (b.vulnerabilidades.discapacidadInfo || []).length > 0 && (
                        <div className="bg-purple-50 p-2 rounded-lg border border-purple-200 text-purple-900 text-[11px]">
                          <span className="font-bold flex items-center gap-1">
                            <Accessibility className="w-3.5 h-3.5 text-purple-600" />
                            <span>Persona(s) con Discapacidad:</span>
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 mt-0.5 pl-1">
                            {b.vulnerabilidades.discapacidadInfo?.map((d, i) => (
                              <li key={i}>
                                Tipo: <strong>{d.tipoDiscapacidad}</strong>
                                {d.descripcion && <span> ({d.descripcion})</span>}
                                {d.requierePanales && <span> • Pañales (Talla {d.tallaPanal || 'L'})</span>}
                                {d.requiereAyudaTecnica && <span> • Ayuda Técnica: {d.tipoAyudaTecnica || 'Silla de Ruedas / Muletas'}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {b.vulnerabilidades?.tieneMascotas && (b.vulnerabilidades.mascotasInfo || []).length > 0 && (
                        <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-emerald-900 text-[11px]">
                          <span className="font-bold flex items-center gap-1">
                            <Dog className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Mascotas:</span>
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 mt-0.5 pl-1">
                            {b.vulnerabilidades.mascotasInfo?.map((p, i) => (
                              <li key={i}>
                                Especie: <strong>{p.tipo}</strong> ({p.cantidad} ejemplares)
                                {p.requiereAlimento && <span> • Requiere Alimento</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {vulnerableBeneficiaries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No se encontraron registros con necesidades especiales para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: INSTITUTIONAL OFFICIAL DELIVERY CERTIFICATE / ACTA PARA ENTE DE CONTROL */}
      {selectedDeliveryForActa && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Acta Oficial de Verificación de Entrega</h3>
                  <p className="text-[11px] text-slate-500">Comprobante Institucional para Ente de Control y Auditoría</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeliveryForActa(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Institutional Certificate Body */}
            <div id="printable-acta" className="bg-slate-50 p-5 rounded-2xl border border-slate-300 text-xs space-y-4 font-sans">
              <div className="text-center border-b border-slate-300 pb-3">
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">REPÚBLICA DE COLOMBIA • JORNADA COMUNITARIA CHIMINANGOS</div>
                <h4 className="font-black text-slate-900 text-sm uppercase tracking-wide mt-0.5">
                  ACTA DE AUDITORÍA Y COMPROBACIÓN DE ASISTENCIA HUMANITARIA
                </h4>
                <div className="flex justify-center items-center gap-3 mt-1 text-[11px] font-mono text-slate-600 font-bold">
                  <span>ID ACTA: {selectedDeliveryForActa.id}</span>
                  <span>•</span>
                  <span>FECHA: {formatDisplayDate(selectedDeliveryForActa.fecha)}</span>
                </div>
              </div>

              {/* Beneficiary Data */}
              <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200 text-slate-800">
                <div>
                  <span className="text-slate-400 block font-extrabold text-[10px] uppercase">TITULAR BENECIARIO:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{selectedDeliveryForActa.beneficiarioNombre}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-extrabold text-[10px] uppercase">DOCUMENTO IDENTIDAD:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">C.C. {selectedDeliveryForActa.beneficiarioCedula}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-extrabold text-[10px] uppercase">APARTAMENTO / DIRECCIÓN:</span>
                  <span className="font-extrabold text-emerald-950">{selectedDeliveryForActa.beneficiarioDireccion}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-extrabold text-[10px] uppercase">SECTOR / AGRUPACIÓN:</span>
                  <span className="font-medium text-slate-700">{selectedDeliveryForActa.agrupacion}</span>
                </div>
              </div>

              {/* Items Received */}
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-extrabold text-[10px] uppercase mb-1">
                  INSUMOS RECIBIDOS EN SATISFACCIÓN (KITS HUMANITARIOS):
                </span>
                <ul className="list-disc list-inside space-y-1 font-extrabold text-slate-900 text-xs">
                  {selectedDeliveryForActa.articulos.map((a, i) => (
                    <li key={i}>{a.cantidad} {a.unidad} - {a.itemNombre}</li>
                  ))}
                </ul>
              </div>

              {/* Responsible & Timestamps */}
              <div className="grid grid-cols-2 gap-2 text-slate-700 text-[11px]">
                <div>
                  <strong className="text-slate-900">Operador Responsable:</strong> {selectedDeliveryForActa.responsable}
                </div>
                <div>
                  <strong className="text-slate-900">Hora de Registro:</strong> {formatDisplayTime(selectedDeliveryForActa.fecha) || 'No especificada'}
                </div>
                <div className="col-span-2">
                  <strong className="text-slate-900">Validación Documental:</strong> Verificado con cédula física y huella/firma registrada en jornada.
                </div>
              </div>

              {/* Signature Blocks for Official Control */}
              <div className="pt-4 border-t border-slate-300 grid grid-cols-3 gap-3 text-center text-[10px] text-slate-600 font-bold">
                <div className="border-t border-slate-400 pt-1">
                  <div>Firma Beneficiario</div>
                  <div className="font-normal text-slate-400 mt-0.5">C.C. {selectedDeliveryForActa.beneficiarioCedula}</div>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <div>Firma Entregador</div>
                  <div className="font-normal text-slate-400 mt-0.5">{selectedDeliveryForActa.responsable}</div>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <div>Veedor / Ente Control</div>
                  <div className="font-normal text-slate-400 mt-0.5">Auditor Responsable</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Imprimir / Guardar PDF Acta</span>
              </button>

              <button
                onClick={() => setSelectedDeliveryForActa(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
