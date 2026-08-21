import React, { useState, useMemo } from 'react';
import { Users, Package, CheckCircle2, Clock, AlertTriangle, AlertCircle, ArrowRight, TrendingUp, Layers, FileSpreadsheet, Home, Search, Building2, PackageCheck, Filter, Baby, Accessibility, HeartHandshake, UserCheck } from 'lucide-react';
import { Beneficiary, InventoryItem, DeliveryRecord, SummaryStats } from '../types';
import { parseAptoCode } from '../lib/aptoParser';

interface DashboardOverviewProps {
  stats: SummaryStats;
  beneficiaries: Beneficiary[];
  inventory: InventoryItem[];
  deliveries: DeliveryRecord[];
  onOpenNewDelivery: () => void;
  onNavigateTab: (tab: 'simple' | 'dashboard' | 'beneficiaries' | 'inventory' | 'reports' | 'ai') => void;
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
  const [aptSearchQuery, setAptSearchQuery] = useState('');
  const [aptFilter, setAptFilter] = useState<'ALL' | 'MULTIPLE' | 'SINGLE' | 'PENDING'>('ALL');

  // Census totals calculation (Habitantes en la comunidad)
  const censusStats = useMemo(() => {
    const totalTitulares = beneficiaries.length;
    const actualizadosList = beneficiaries.filter(b => b.censoActualizado && b.integrantesHogar > 0);
    const totalHabitantesActualizados = actualizadosList.reduce((sum, b) => sum + (b.integrantesHogar || 0), 0);
    const totalAptos = new Set(beneficiaries.map(b => (b.direccion || '').trim().toLowerCase())).size;
    const aptosActualizados = new Set(actualizadosList.map(b => (b.direccion || '').trim().toLowerCase())).size;
    const promedio = aptosActualizados > 0 ? (totalHabitantesActualizados / aptosActualizados).toFixed(1) : '0';

    return {
      totalTitulares,
      totalHabitantes: totalHabitantesActualizados,
      totalAptos,
      aptosActualizados,
      promedio
    };
  }, [beneficiaries]);

  // Group beneficiaries by Agrupación
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

  // Group beneficiaries and deliveries by unique apartment/address key for summary view
  const apartmentSummaryList = useMemo(() => {
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

    // Populate deliveries per apartment
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

  // Filter apartment summary table
  const filteredAptSummaryList = useMemo(() => {
    const q = aptSearchQuery.toLowerCase().trim();
    return apartmentSummaryList.filter(apt => {
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
  }, [apartmentSummaryList, aptSearchQuery, aptFilter]);

  // Calculate Vulnerabilities Statistics across all beneficiaries
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
      ayudasTecnicasCount
    };
  }, [beneficiaries]);

  const recentDeliveries = deliveries.slice(0, 5);
  const pendingBeneficiariesList = beneficiaries.filter(b => b.estadoEntrega === 'PENDIENTE').slice(0, 5);
  const lowStockItems = inventory.filter(i => i.stockActual <= i.stockMinimoAlerta);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Alert / Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-2xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Jornada Activa de Distribución • Chiminangos</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Control de Entregas en Tiempo Real
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Censo de <strong>{censusStats.totalHabitantes} personas</strong> ({stats.entregasResidentes ?? 296} mercados a residentes en <strong>{stats.totalAptosUnicos || censusStats.totalAptos} viviendas de Chiminangos</strong> + <strong>{stats.entregasExternos ?? 12} mercados a usuarios externos</strong>). Total despachado: <strong>{stats.totalMercadosEntregados} mercados</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenNewDelivery}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/50 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Registrar Entrega de Mercado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Key Performance Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Metric 0: Total Mercados Entregados (Global) */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Total Entregados</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-emerald-950">{stats.totalMercadosEntregados}</div>
            <p className="text-xs text-emerald-800 font-medium mt-1">
              {stats.totalMercadosEntregados} kits despachados
            </p>
          </div>
        </div>

        {/* Metric 1: Residentes Chiminangos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Residentes Chiminangos</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">{stats.entregasResidentes ?? 296}</div>
            <p className="text-xs text-blue-700 font-medium mt-1">
              Mercados a viviendas
            </p>
          </div>
        </div>

        {/* Metric 2: Tarjeta Usuarios Externos */}
        <div className="bg-white p-5 rounded-2xl border border-amber-300/90 bg-amber-50/40 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">Usuarios Externos</span>
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-amber-950">{stats.entregasExternos ?? 12}</div>
            <p className="text-xs text-amber-900 font-bold mt-1">
              Entregas fuera del sector
            </p>
          </div>
        </div>

        {/* Metric 3: Viviendas / Aptos Únicos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Viviendas Censadas</span>
            <div className="p-2 bg-slate-50 text-slate-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 flex items-baseline gap-2">
              <span>{stats.totalAptosUnicos || censusStats.totalAptos}</span>
              <span className="text-xs font-semibold text-emerald-600">(100%)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{stats.aptosConMultiplesEntregas} aptos con 2+ mercados</p>
          </div>
        </div>

        {/* Metric 4: Censo Población Real */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">Censo Habitantes Real</span>
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-blue-950">{censusStats.totalHabitantes}</div>
            <p className="text-xs text-blue-800 font-medium mt-1">
              {censusStats.aptosActualizados} de {censusStats.totalAptos} aptos verificados
            </p>
          </div>
        </div>

        {/* Metric 5: Stock Disponible Bodega */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Stock Disponible</span>
            <div className="p-2 bg-slate-50 text-slate-700 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">{stats.totalStockDisponible}</div>
            <p className="text-xs text-slate-500 mt-1">Kits libres en bodega</p>
          </div>
        </div>
      </div>

      {/* SPECIAL NEEDS & VULNERABILITY LIVE DASHBOARD */}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
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
                <span className="font-bold text-slate-300 block mb-1">Desglose Pañales Infantil por Etapa:</span>
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
                <span className="font-bold text-slate-300 block mb-1">Desglose Pañales Adulto por Talla:</span>
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
                <span className="text-slate-400 block text-[11px]">Casos Registrados</span>
                <span className="text-lg font-extrabold text-purple-300">{vulnerabilityStats.totalDiscapacidad}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">personas diagnosticadas</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[11px]">Ayudas Técnicas</span>
                <span className="text-lg font-extrabold text-purple-300">{vulnerabilityStats.ayudasTecnicasCount}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">silla ruedas / muletas</span>
              </div>
            </div>

            {Object.keys(vulnerabilityStats.tiposDiscapacidadMap).length > 0 && (
              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/60 text-[11px]">
                <span className="font-bold text-slate-300 block mb-1">Tipos de Discapacidad Detectados:</span>
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
        </div>
      </div>

      {/* DETAILED APARTMENT SUMMARY TABLE (Mercados por Apto) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-purple-100 text-purple-800 font-bold text-xs rounded-full mb-1">
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Consolidado por Apartamento</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Resumen de Mercados Entregados por Vivienda / Apto</h3>
            <p className="text-xs text-slate-500">Muestra la cantidad exacta de mercados recibidos por cada apartamento registrado.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateTab('simple')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Ir a Búsqueda Rápida por Apto</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Apto (ej. 4B42, 3E43) o nombre de beneficiario..."
              value={aptSearchQuery}
              onChange={e => setAptSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center space-x-1 flex-wrap gap-y-1 font-bold">
            <span className="text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filtrar:
            </span>
            <button
              onClick={() => setAptFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                aptFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              Todos ({apartmentSummaryList.length})
            </button>
            <button
              onClick={() => setAptFilter('MULTIPLE')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer border ${
                aptFilter === 'MULTIPLE' ? 'bg-purple-600 text-white border-purple-600' : 'bg-purple-50 text-purple-800 border-purple-200'
              }`}
            >
              Múltiples Mercados 2+ ({apartmentSummaryList.filter(a => a.deliveries.length > 1).length})
            </button>
            <button
              onClick={() => setAptFilter('SINGLE')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer border ${
                aptFilter === 'SINGLE' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-800 border-emerald-200'
              }`}
            >
              1 Mercado ({apartmentSummaryList.filter(a => a.deliveries.length === 1).length})
            </button>
            <button
              onClick={() => setAptFilter('PENDING')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer border ${
                aptFilter === 'PENDING' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-800 border-amber-200'
              }`}
            >
              Sin Entregar ({apartmentSummaryList.filter(a => a.deliveries.length === 0).length})
            </button>
          </div>
        </div>

        {/* Apartment Table */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Apartamento / Vivienda</th>
                <th className="px-6 py-3">Sector & Agrupación</th>
                <th className="px-6 py-3">Habitantes (Censo)</th>
                <th className="px-6 py-3">Mercados Entregados</th>
                <th className="px-6 py-3">Titular(es) Registrado(s)</th>
                <th className="px-6 py-3">Última Entrega</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredAptSummaryList.map(apt => {
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
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-950 border border-emerald-300 font-extrabold rounded-lg text-xs inline-flex items-center gap-1 shadow-xs">
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
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-900 border border-purple-300 font-extrabold rounded-lg text-xs inline-flex items-center gap-1 shadow-xs">
                          <PackageCheck className="w-3.5 h-3.5 text-purple-700" />
                          <span>{delCount} Mercados Entregados</span>
                        </span>
                      ) : delCount === 1 ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold rounded-lg text-xs inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>1 Mercado Entregado</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 font-medium rounded-lg text-xs">
                          0 Mercados (Pendiente)
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
                          <div>
                            {new Date(lastDel.fecha).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-[10px] text-slate-400">{lastDel.responsable}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">Sin fecha</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredAptSummaryList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No se encontraron apartamentos con el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Middle Grid: Cobertura por Agrupación + Insumos Alerta */}
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

        {/* Low Stock & Quick Actions Side Panel */}
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

          {/* Quick Pending Beneficiaries Dispatch */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Pendientes Prioritarios</span>
              <span className="text-xs font-normal text-slate-500">Próximos en lista</span>
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

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Últimas Entregas Registradas</h3>
            <p className="text-xs text-slate-500">Historial reciente de entregas de insumos con fecha y hora.</p>
          </div>
          <button
            onClick={() => onNavigateTab('reports')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
          >
            Ver Historial Completo →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-3">Beneficiario / Cédula</th>
                <th className="px-6 py-3">Dirección / Agrupación</th>
                <th className="px-6 py-3">Insumos Entregados</th>
                <th className="px-6 py-3">Fecha & Hora</th>
                <th className="px-6 py-3">Responsable</th>
                <th className="px-6 py-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {recentDeliveries.map(del => (
                <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="font-bold text-slate-900">{del.beneficiarioNombre}</div>
                    <div className="text-slate-500 text-[11px]">C.C. {del.beneficiarioCedula}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="text-slate-800">{del.beneficiarioDireccion}</div>
                    <div className="text-slate-500 text-[11px]">{del.agrupacion}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {del.articulos.map((art, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-800 font-semibold rounded text-[11px]">
                          {art.cantidad} {art.unidad} {art.itemNombre.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">
                    {new Date(del.fecha).toLocaleString('es-CO', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </td>
                  <td className="px-6 py-3.5 text-slate-700 font-medium">
                    {del.responsable}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      {del.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {recentDeliveries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Aún no se han registrado entregas en la jornada. Haga clic en "+ Registrar Entrega" para comenzar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
