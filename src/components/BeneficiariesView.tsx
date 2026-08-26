import React, { useState, useMemo, useRef } from 'react';
import { Search, Filter, Plus, FileDown, CheckCircle2, Clock, Eye, Edit3, Phone, MapPin, User, AlertCircle, X, Check, FileSpreadsheet, Upload, Download, Trash2, UserCheck, Baby, Accessibility, HeartHandshake, ChevronLeft, ChevronRight, Dog, Lock, KeyRound } from 'lucide-react';
import { Beneficiary, DeliveryRecord, HouseholdVulnerabilities } from '../types';
import { exportBeneficiariesToCSV } from '../lib/storage';
import { parseAptoCode } from '../lib/aptoParser';
import { getConsolidatedApartmentMap, getApartmentCanonicalKey } from '../lib/householdUtils';
import { parseBeneficiariesCSV, downloadCSVTemplate, CSVImportRecord } from '../lib/csvHelper';
import { VulnerabilitiesForm } from './VulnerabilitiesForm';
import { DeduplicateModal } from './DeduplicateModal';

interface BeneficiariesViewProps {
  beneficiaries: Beneficiary[];
  onAddBeneficiary: (beneficiary: Omit<Beneficiary, 'id' | 'no' | 'estadoEntrega'>) => void;
  onEditBeneficiary: (beneficiary: Beneficiary) => void;
  onSelectBeneficiaryForDelivery: (beneficiary: Beneficiary) => void;
  onImportBulkBeneficiaries?: (items: CSVImportRecord[], replaceMode?: boolean) => void;
  onDeduplicateBeneficiaries?: (updatedList?: Beneficiary[]) => void;
  onDeleteBeneficiary?: (id: string) => void;
  onClearAllData?: () => void;
}

export const BeneficiariesView: React.FC<BeneficiariesViewProps> = ({
  beneficiaries,
  onAddBeneficiary,
  onEditBeneficiary,
  onSelectBeneficiaryForDelivery,
  onImportBulkBeneficiaries,
  onDeduplicateBeneficiaries,
  onDeleteBeneficiary,
  onClearAllData
}) => {
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('TODOS');
  const [selectedAgrupacion, setSelectedAgrupacion] = useState<string>('TODAS');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeduplicateModal, setShowDeduplicateModal] = useState(false);
  const [viewingBeneficiary, setViewingBeneficiary] = useState<Beneficiary | null>(null);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);

  // New beneficiary form state
  const [formData, setFormData] = useState({
    nombre: '',
    tipoDocumento: 'CC',
    cedula: '',
    direccion: '',
    sector: 'Sector 1',
    agrupacion: 'Agrupación 1',
    descripcion: '',
    telefono: '',
    integrantesHogar: 3,
    prioridadEspecial: false,
    observaciones: '',
    vulnerabilidades: undefined as HouseholdVulnerabilities | undefined
  });

  // Calculate duplicates by Cédula
  const duplicateCedulaCount = useMemo(() => {
    const counts = new Map<string, number>();
    beneficiaries.forEach(b => {
      const cleanCed = (b.cedula || '').trim().replace(/[^\d]/g, '');
      if (cleanCed && cleanCed !== '0' && b.cedula !== 'S/N' && b.cedula !== 'SN') {
        counts.set(cleanCed, (counts.get(cleanCed) || 0) + 1);
      }
    });
    let duplicates = 0;
    counts.forEach(count => {
      if (count > 1) duplicates += (count - 1);
    });
    return duplicates;
  }, [beneficiaries]);

  // Household Consolidation Map per Apartment
  const apartmentConsolidationMap = useMemo(() => {
    return getConsolidatedApartmentMap(beneficiaries);
  }, [beneficiaries]);

  // Unique Agrupaciones
  const agrupacionesList = useMemo(() => {
    const setAg = new Set<string>();
    beneficiaries.forEach(b => {
      if (b.agrupacion) setAg.add(b.agrupacion);
    });
    return Array.from(setAg).sort();
  }, [beneficiaries]);

  // Filtered beneficiaries list
  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter(b => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || 
        b.nombre.toLowerCase().includes(q) ||
        b.cedula.toLowerCase().includes(q) ||
        b.direccion.toLowerCase().includes(q) ||
        (b.telefono && b.telefono.toLowerCase().includes(q)) ||
        b.no.toString().includes(q);

      const benSector = b.sector || 'Sector 1';
      const matchesSector = selectedSector === 'TODOS' || benSector === selectedSector;
      const matchesAgrupacion = selectedAgrupacion === 'TODAS' || b.agrupacion === selectedAgrupacion;
      const matchesEstado = selectedEstado === 'TODOS' || b.estadoEntrega === selectedEstado;

      return matchesSearch && matchesSector && matchesAgrupacion && matchesEstado;
    });
  }, [beneficiaries, search, selectedSector, selectedAgrupacion, selectedEstado]);

  // Total pages and paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredBeneficiaries.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedBeneficiaries = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredBeneficiaries.slice(startIndex, startIndex + pageSize);
  }, [filteredBeneficiaries, validCurrentPage, pageSize]);

  const handleDireccionChange = (val: string) => {
    const parsed = parseAptoCode(val, formData.sector);
    setFormData(prev => ({
      ...prev,
      direccion: val,
      sector: parsed.sector,
      agrupacion: parsed.isParsed ? parsed.agrupacion : prev.agrupacion,
      descripcion: parsed.descripcion
    }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.cedula.trim()) {
      alert('Por favor ingrese el nombre y la cédula del beneficiario.');
      return;
    }

    const parsed = parseAptoCode(formData.direccion, formData.sector);
    const finalData = {
      ...formData,
      sector: parsed.sector,
      agrupacion: parsed.isParsed ? parsed.agrupacion : formData.agrupacion,
      descripcion: parsed.descripcion || formData.descripcion
    };

    onAddBeneficiary(finalData);
    setShowAddModal(false);
    setFormData({
      nombre: '',
      tipoDocumento: 'CC',
      cedula: '',
      direccion: '',
      sector: 'Sector 1',
      agrupacion: 'Agrupación 1',
      descripcion: '',
      telefono: '',
      integrantesHogar: 3,
      prioridadEspecial: false,
      observaciones: '',
      vulnerabilidades: undefined
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBeneficiary) return;
    onEditBeneficiary({
      ...editingBeneficiary,
      censoActualizado: true
    });
    setEditingBeneficiary(null);
  };

  const [pendingCSVData, setPendingCSVData] = useState<CSVImportRecord[] | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
  const [clearPasswordError, setClearPasswordError] = useState('');
  const [csvReplacePassword, setCsvReplacePassword] = useState('');
  const [csvReplacePasswordError, setCsvReplacePasswordError] = useState('');
  const [showCsvReplacePasswordModal, setShowCsvReplacePasswordModal] = useState(false);

  const isValidAdminPassword = (pass: string) => {
    const clean = pass.trim();
    return clean === 'Salome2016' || clean === 'Salome2016.';
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const parsed = parseBeneficiariesCSV(text);
      if (parsed.length === 0) {
        alert('No se encontraron registros válidos en el archivo CSV.');
        return;
      }

      // Open confirmation modal to let user choose merge or replace
      setPendingCSVData(parsed);

      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmImport = (replaceMode: boolean) => {
    if (!pendingCSVData) return;
    if (onImportBulkBeneficiaries) {
      onImportBulkBeneficiaries(pendingCSVData, replaceMode);
    } else {
      pendingCSVData.forEach(item => onAddBeneficiary(item));
      alert(`¡Se cargaron ${pendingCSVData.length} beneficiarios del archivo CSV con éxito!`);
    }
    setPendingCSVData(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden CSV Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleCSVUpload}
        accept=".csv, .txt, text/csv, text/plain"
        className="hidden"
      />

      {/* Header Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Registro de Beneficiarios (Censo Chiminangos)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mostrando <strong>{filteredBeneficiaries.length}</strong> de {beneficiaries.length} beneficiarios registrados en la base de datos.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onDeduplicateBeneficiaries && duplicateCedulaCount > 0 && (
            <button
              onClick={() => setShowDeduplicateModal(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer animate-pulse"
              title="Consolidar y revisar registros que comparten el mismo número de cédula"
            >
              <UserCheck className="w-4 h-4" />
              <span>Unificar {duplicateCedulaCount} Duplicado(s)</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
            title="Cargar archivo CSV con beneficiarios, fechas y mercados entregados"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Subir CSV</span>
          </button>

          <button
            onClick={downloadCSVTemplate}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
            title="Descargar plantilla de ejemplo CSV con columnas de entrega"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Plantilla CSV</span>
          </button>

          {onClearAllData && beneficiaries.length > 0 && (
            <button
              onClick={() => {
                setClearPassword('');
                setClearPasswordError('');
                setShowClearModal(true);
              }}
              className="px-2.5 py-1.5 bg-rose-50/80 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 text-[11px] font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
              title="Protegido por contraseña - Vaciar Base de Datos"
            >
              <Lock className="w-3 h-3 text-rose-500" />
              <span>Vaciar BD</span>
            </button>
          )}

          <button
            onClick={() => exportBeneficiariesToCSV(filteredBeneficiaries)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Beneficiario</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search input */}
        <div className="relative lg:col-span-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Nombre, Cédula, Dirección o Celular..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        {/* Sector Filter */}
        <div>
          <select
            value={selectedSector}
            onChange={e => {
              setSelectedSector(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="TODOS">Todos los Sectores</option>
            <option value="Sector 1">Sector 1</option>
            <option value="Sector 2">Sector 2</option>
            <option value="Sector 3">Sector 3</option>
            <option value="Sector 4">Sector 4</option>
            <option value="Sector 5">Sector 5</option>
            <option value="Sector 6">Sector 6</option>
            <option value="Sector 7">Sector 7</option>
            <option value="Usuarios Externos">Usuarios Externos</option>
          </select>
        </div>

        {/* Agrupación Filter */}
        <div>
          <select
            value={selectedAgrupacion}
            onChange={e => {
              setSelectedAgrupacion(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="TODAS">Todas las Agrupaciones</option>
            {agrupacionesList.map(ag => (
              <option key={ag} value={ag}>{ag}</option>
            ))}
          </select>
        </div>

        {/* Estado Filter */}
        <div>
          <select
            value={selectedEstado}
            onChange={e => {
              setSelectedEstado(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="PENDIENTE">PENDIENTE de Entrega</option>
            <option value="ENTREGADO">ENTREGADO</option>
            <option value="EN_PROCESO">EN PROCESO</option>
          </select>
        </div>

        {/* Reset filters */}
        {(search || selectedSector !== 'TODOS' || selectedAgrupacion !== 'TODAS' || selectedEstado !== 'TODOS') && (
          <button
            onClick={() => {
              setSearch('');
              setSelectedSector('TODOS');
              setSelectedAgrupacion('TODAS');
              setSelectedEstado('TODOS');
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Main Beneficiaries Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3 text-center w-12">#</th>
                <th className="px-4 py-3">Nombre & Cédula</th>
                <th className="px-4 py-3">Dirección & Agrupación</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3 text-center">Integrantes</th>
                <th className="px-4 py-3">Estado Entrega</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {paginatedBeneficiaries.map((b) => {
                const aptKey = getApartmentCanonicalKey(b.direccion, b.sector, b.id);
                const aptInfo = apartmentConsolidationMap.get(aptKey);
                const consolidatedCount = aptInfo ? aptInfo.integrantesConsolidados : (b.integrantesHogar || 3);
                const registeredCount = aptInfo ? aptInfo.beneficiaries.length : 1;
                const isPrimaryResident = !aptInfo || registeredCount === 1 || aptInfo.primaryBeneficiaryId === b.id;
                const primaryName = aptInfo ? aptInfo.primaryBeneficiaryName : b.nombre;

                return (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 text-center font-extrabold text-slate-400">
                    {b.no}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>{b.nombre}</span>
                      {b.prioridadEspecial && (
                        <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 font-bold text-[10px] rounded">
                          Prioritario
                        </span>
                      )}
                      {b.vulnerabilidades?.tieneNinos && (
                        <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 font-bold text-[10px] rounded flex items-center space-x-1" title="Hay niños/bebés en el hogar">
                          <Baby className="w-3 h-3" />
                          <span>Niños</span>
                        </span>
                      )}
                      {b.vulnerabilidades?.tieneAdultoMayor && (
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold text-[10px] rounded flex items-center space-x-1" title="Hay adultos mayores en el hogar">
                          <UserCheck className="w-3 h-3" />
                          <span>Abuelo(a)</span>
                        </span>
                      )}
                      {b.vulnerabilidades?.tieneDiscapacidad && (
                        <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 font-bold text-[10px] rounded flex items-center space-x-1" title="Hay personas con discapacidad en el hogar">
                          <Accessibility className="w-3 h-3" />
                          <span>Discapacidad</span>
                        </span>
                      )}
                      {b.vulnerabilidades?.tieneMascotas && (
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded flex items-center space-x-1" title={`Censo de Mascotas: ${(b.vulnerabilidades.mascotasInfo || []).map(p => `${p.cantidad} ${p.tipo}(s)`).join(', ') || 'Tiene mascota'}`}>
                          <Dog className="w-3 h-3" />
                          <span>Mascota(s)</span>
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600 text-[11px] font-mono flex items-center space-x-1.5 mt-0.5">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded border border-slate-200/90 uppercase shrink-0">
                        {b.tipoDocumento || 'CC'}
                      </span>
                      <span className="font-bold text-slate-800">{b.cedula}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-900 font-bold flex items-center gap-1.5">
                      <span>{b.direccion}</span>
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded border border-blue-200/80 shrink-0">
                        {b.sector || 'Sector 1'}
                      </span>
                    </div>
                    <div className="text-emerald-700 font-medium text-[11px] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{b.descripcion || parseAptoCode(b.direccion, b.sector).descripcion}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {b.telefono ? (
                      <span className="font-mono text-slate-800">{b.telefono}</span>
                    ) : (
                      <span className="text-slate-400 italic">No registrado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700">
                    <div className="flex flex-col items-center justify-center">
                      {isPrimaryResident ? (
                        <>
                          <span className="text-sm font-black text-slate-900">{consolidatedCount}</span>
                          {registeredCount > 1 && (
                            <span 
                              className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 mt-0.5 whitespace-nowrap"
                              title={`Titular del Apto (${registeredCount} personas registradas en esta vivienda)`}
                            >
                              Titular ({registeredCount} en apto)
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-slate-400">—</span>
                          <span 
                            className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mt-0.5 whitespace-nowrap"
                            title={`El censo de este apartamento está registrado a nombre del titular ${primaryName}`}
                          >
                            Hogar: {primaryName.split(' ')[0]}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {b.estadoEntrega === 'ENTREGADO' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ENTREGADO
                      </span>
                    ) : b.estadoEntrega === 'EN_PROCESO' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                        <Clock className="w-3.5 h-3.5" />
                        EN PROCESO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        <Clock className="w-3.5 h-3.5" />
                        PENDIENTE
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => setViewingBeneficiary(b)}
                        title="Ver detalle de beneficiario"
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setEditingBeneficiary(b)}
                        title="Editar datos de beneficiario"
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {onDeleteBeneficiary && (
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Eliminar de la lista a ${b.nombre} (C.C. ${b.cedula})?`)) {
                              onDeleteBeneficiary(b.id);
                            }
                          }}
                          title="Eliminar registro de beneficiario"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {b.estadoEntrega !== 'ENTREGADO' && (
                        <button
                          onClick={() => onSelectBeneficiaryForDelivery(b)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Entregar Aid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

              {filteredBeneficiaries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron beneficiarios que coincidan con los filtros de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredBeneficiaries.length > 0 && (
          <div className="bg-white border-t border-slate-200/80 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span>
                Mostrando <strong className="text-slate-900 font-bold">{Math.min(filteredBeneficiaries.length, (validCurrentPage - 1) * pageSize + 1)}</strong> - <strong className="text-slate-900 font-bold">{Math.min(filteredBeneficiaries.length, validCurrentPage * pageSize)}</strong> de <strong className="text-slate-900 font-bold">{filteredBeneficiaries.length}</strong> beneficiarios
              </span>
              
              <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
                <span className="text-slate-500">Por página:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={validCurrentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <div className="flex items-center px-2 text-xs font-bold text-slate-700">
                Página {validCurrentPage} de {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validCurrentPage >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD NEW BENEFICIARY */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Nuevo Beneficiario Censo</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ej. Esmilda Alegría"
                    value={formData.nombre}
                    onFocus={e => e.target.select()}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  {formData.nombre && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, nombre: '' })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 cursor-pointer"
                      title="Borrar nombre"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo Doc. *</label>
                  <select
                    value={formData.tipoDocumento}
                    onChange={e => setFormData({ ...formData, tipoDocumento: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="CC">C.C. - Cédula de Ciudadanía</option>
                    <option value="TI">T.I. - Tarjeta de Identidad</option>
                    <option value="CE">C.E. - Cédula de Extranjería</option>
                    <option value="PPT">PPT - Permiso Temp. Protección</option>
                    <option value="PASAPORTE">PAS - Pasaporte</option>
                    <option value="OTRO">OTRO - Sin Número / S/N</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Número de Documento *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ej. 1130608151 o S/N"
                      value={formData.cedula}
                      onFocus={e => e.target.select()}
                      onChange={e => setFormData({ ...formData, cedula: e.target.value })}
                      className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    {formData.cedula && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, cedula: '' })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 cursor-pointer"
                        title="Borrar documento"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sector *</label>
                  <select
                    value={formData.sector}
                    onChange={e => {
                      const sec = e.target.value;
                      const parsed = parseAptoCode(formData.direccion, sec);
                      setFormData({
                        ...formData,
                        sector: sec,
                        agrupacion: parsed.isParsed ? parsed.agrupacion : formData.agrupacion,
                        descripcion: parsed.descripcion
                      });
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="Sector 1">Sector 1</option>
                    <option value="Sector 2">Sector 2</option>
                    <option value="Sector 3">Sector 3</option>
                    <option value="Sector 4">Sector 4</option>
                    <option value="Sector 5">Sector 5</option>
                    <option value="Sector 6">Sector 6</option>
                    <option value="Sector 7">Sector 7</option>
                    <option value="Usuarios Externos">Usuarios Externos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dirección / Apto *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ej. 4B42 o 2C15"
                      value={formData.direccion}
                      onFocus={e => e.target.select()}
                      onChange={e => handleDireccionChange(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    {formData.direccion && (
                      <button
                        type="button"
                        onClick={() => handleDireccionChange('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 cursor-pointer"
                        title="Borrar dirección"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Agrupación</label>
                  <select
                    value={formData.agrupacion}
                    onChange={e => setFormData({ ...formData, agrupacion: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="Agrupación 1">Agrupación 1</option>
                    <option value="Agrupación 2">Agrupación 2</option>
                    <option value="Agrupación 3">Agrupación 3</option>
                    <option value="Agrupación 4">Agrupación 4</option>
                    <option value="Agrupación 5">Agrupación 5</option>
                    <option value="Torres y Aptos">Torres y Aptos</option>
                    <option value="Sector General">Sector General</option>
                    <option value="Usuarios Externos">Usuarios Externos</option>
                  </select>
                </div>
              </div>

              {/* Campo Descripción Automática */}
              <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/80">
                <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                  Descripción Completa (Autocompletado automático)
                </label>
                <div className="text-xs font-extrabold text-emerald-800 flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {formData.descripcion || parseAptoCode(formData.direccion).descripcion || 'Ingrese número de Apto (ej: 4B42)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono Móvil</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ej. 3160899305"
                      value={formData.telefono}
                      onFocus={e => e.target.select()}
                      onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    {formData.telefono && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, telefono: '' })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 cursor-pointer"
                        title="Borrar teléfono"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      👥 Integrantes Hogar:
                    </label>
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      {formData.integrantesHogar || 1} personas
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, integrantesHogar: Math.max(1, (prev.integrantesHogar || 1) - 1) }))}
                        className="w-10 h-10 bg-white border-2 border-slate-300 active:scale-95 text-slate-800 rounded-xl font-black text-lg flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={25}
                        value={formData.integrantesHogar || ''}
                        onFocus={e => e.target.select()}
                        onChange={e => {
                          const val = e.target.value === '' ? '' : parseInt(e.target.value);
                          setFormData({ ...formData, integrantesHogar: val as any });
                        }}
                        onBlur={() => {
                          if (!formData.integrantesHogar || formData.integrantesHogar < 1) {
                            setFormData({ ...formData, integrantesHogar: 1 });
                          }
                        }}
                        className="w-16 h-10 text-center bg-white border-2 border-slate-300 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />

                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, integrantesHogar: Math.min(25, (prev.integrantesHogar || 1) + 1) }))}
                        className="w-10 h-10 bg-white border-2 border-slate-300 active:scale-95 text-slate-800 rounded-xl font-black text-lg flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex gap-1 overflow-x-auto">
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setFormData({ ...formData, integrantesHogar: num })}
                          className={`w-8 h-9 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            formData.integrantesHogar === num
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="prioridad"
                  checked={formData.prioridadEspecial}
                  onChange={e => setFormData({ ...formData, prioridadEspecial: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="prioridad" className="text-xs font-bold text-slate-700">
                  Prioridad Especial (Adulto mayor / Discapacidad / Lactante)
                </label>
              </div>

              <VulnerabilitiesForm
                value={formData.vulnerabilidades}
                onChange={v => setFormData({ ...formData, vulnerabilidades: v })}
              />

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Guardar Beneficiario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW BENEFICIARY PROFILE & HISTORY */}
      {viewingBeneficiary && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">#{viewingBeneficiary.no} - {viewingBeneficiary.nombre}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Documento: <strong className="text-slate-800">[{viewingBeneficiary.tipoDocumento || 'CC'}] {viewingBeneficiary.cedula}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingBeneficiary(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block font-medium">Dirección / Apto</span>
                <span className="font-bold text-slate-800">{viewingBeneficiary.direccion}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Agrupación</span>
                <span className="font-bold text-slate-800">{viewingBeneficiary.agrupacion}</span>
              </div>
              <div className="col-span-2 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-emerald-800 block font-bold text-[11px] uppercase tracking-wider">Descripción Completa U.H.</span>
                <span className="font-extrabold text-emerald-950 text-xs">
                  {viewingBeneficiary.descripcion || parseAptoCode(viewingBeneficiary.direccion).descripcion}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Teléfono Móvil</span>
                <span className="font-mono font-bold text-slate-800">{viewingBeneficiary.telefono || 'Sin registrar'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Integrantes Hogar</span>
                <span className="font-bold text-slate-800">{viewingBeneficiary.integrantesHogar} personas</span>
              </div>
            </div>

            {/* Vulnerability Summary in Modal */}
            {viewingBeneficiary.vulnerabilidades && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Necesidades Especiales / Ayudas Requeridas</span>
                </h4>

                {viewingBeneficiary.vulnerabilidades.tieneNinos && (viewingBeneficiary.vulnerabilidades.ninosInfo || []).length > 0 && (
                  <div className="bg-blue-50/80 p-2.5 rounded-lg border border-blue-200 text-blue-900 space-y-1">
                    <span className="font-bold flex items-center space-x-1">
                      <Baby className="w-3.5 h-3.5" />
                      <span>Niños en Hogar:</span>
                    </span>
                    {viewingBeneficiary.vulnerabilidades.ninosInfo?.map((c, i) => (
                      <div key={i} className="pl-4 text-[11px]">
                        • {c.edad} {c.requierePanales ? `| Pañales (${c.etapaPanal || 'Etapa 2'})` : ''} {c.requiereLeche ? `| Leche (${c.tipoLeche || 'Requerida'})` : ''}
                      </div>
                    ))}
                  </div>
                )}

                {viewingBeneficiary.vulnerabilidades.tieneAdultoMayor && (viewingBeneficiary.vulnerabilidades.adultosMayoresInfo || []).length > 0 && (
                  <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 text-amber-900 space-y-1">
                    <span className="font-bold flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Adultos Mayores:</span>
                    </span>
                    {viewingBeneficiary.vulnerabilidades.adultosMayoresInfo?.map((s, i) => (
                      <div key={i} className="pl-4 text-[11px]">
                        • {s.edad} {s.requierePanalesAdulto ? `| Pañales Adulto (Talla ${s.tallaPanalAdulto || 'L'})` : ''} {s.detalles ? `| ${s.detalles}` : ''}
                      </div>
                    ))}
                  </div>
                )}

                {viewingBeneficiary.vulnerabilidades.tieneDiscapacidad && (viewingBeneficiary.vulnerabilidades.discapacidadInfo || []).length > 0 && (
                  <div className="bg-purple-50/80 p-2.5 rounded-lg border border-purple-200 text-purple-900 space-y-1">
                    <span className="font-bold flex items-center space-x-1">
                      <Accessibility className="w-3.5 h-3.5" />
                      <span>Discapacidad:</span>
                    </span>
                    {viewingBeneficiary.vulnerabilidades.discapacidadInfo?.map((d, i) => (
                      <div key={i} className="pl-4 text-[11px]">
                        • {d.tipoDiscapacidad} {d.requierePanales ? `| Pañales (Talla ${d.tallaPanal || 'L'})` : ''} {d.requiereAyudaTecnica ? `| Requiere: ${d.tipoAyudaTecnica || 'Ayuda técnica'}` : ''}
                      </div>
                    ))}
                  </div>
                )}

                {viewingBeneficiary.vulnerabilidades.tieneMascotas && (viewingBeneficiary.vulnerabilidades.mascotasInfo || []).length > 0 && (
                  <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200 text-emerald-900 space-y-1">
                    <span className="font-bold flex items-center space-x-1">
                      <Dog className="w-3.5 h-3.5" />
                      <span>Mascotas (Censo Animal):</span>
                    </span>
                    {viewingBeneficiary.vulnerabilidades.mascotasInfo?.map((pet, i) => (
                      <div key={i} className="pl-4 text-[11px]">
                        • {pet.cantidad} {pet.tipo}(s) {pet.requiereAlimento ? '| Requiere alimento' : ''} {pet.detalles ? `(${pet.detalles})` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Delivery History Log */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Historial de Entregas Recibidas
              </h4>

              {viewingBeneficiary.historialEntregas && viewingBeneficiary.historialEntregas.length > 0 ? (
                <div className="space-y-2">
                  {viewingBeneficiary.historialEntregas.map(del => (
                    <div key={del.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                        <span>Entrega Realizada</span>
                        <span className="text-emerald-600">
                          {new Date(del.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <div className="text-slate-600 space-y-0.5">
                        <p><strong>Responsable:</strong> {del.responsable}</p>
                        <p><strong>Insumos:</strong> {del.articulos.map(a => `${a.cantidad} ${a.unidad} ${a.itemNombre}`).join(', ')}</p>
                        {del.firmaDigital && <p className="text-slate-500 italic text-[11px] mt-1">Firma/Verificación: {del.firmaDigital}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs text-center font-medium">
                  Este beneficiario aún no ha recibido entrega de ayudas humanitarias en esta jornada.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setViewingBeneficiary(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
              {viewingBeneficiary.estadoEntrega !== 'ENTREGADO' && (
                <button
                  onClick={() => {
                    const target = viewingBeneficiary;
                    setViewingBeneficiary(null);
                    onSelectBeneficiaryForDelivery(target);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Registrar Entrega Ahora
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BENEFICIARY */}
      {editingBeneficiary && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Editar Beneficiario #{editingBeneficiary.no}</h3>
              <button
                onClick={() => setEditingBeneficiary(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={editingBeneficiary.nombre}
                    onFocus={e => e.target.select()}
                    onChange={e => setEditingBeneficiary({ ...editingBeneficiary, nombre: e.target.value })}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  {editingBeneficiary.nombre && (
                    <button
                      type="button"
                      onClick={() => setEditingBeneficiary({ ...editingBeneficiary, nombre: '' })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 cursor-pointer"
                      title="Borrar nombre"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo Doc. *</label>
                  <select
                    value={editingBeneficiary.tipoDocumento || 'CC'}
                    onChange={e => setEditingBeneficiary({ ...editingBeneficiary, tipoDocumento: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="CC">C.C.</option>
                    <option value="TI">T.I.</option>
                    <option value="CE">C.E.</option>
                    <option value="PPT">PPT</option>
                    <option value="PASAPORTE">PAS</option>
                    <option value="OTRO">OTRO</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Número de Documento *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={editingBeneficiary.cedula}
                      onFocus={e => e.target.select()}
                      onChange={e => setEditingBeneficiary({ ...editingBeneficiary, cedula: e.target.value })}
                      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    {editingBeneficiary.cedula && (
                      <button
                        type="button"
                        onClick={() => setEditingBeneficiary({ ...editingBeneficiary, cedula: '' })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 cursor-pointer"
                        title="Borrar documento"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sector *</label>
                  <select
                    value={editingBeneficiary.sector || 'Sector 1'}
                    onChange={e => {
                      const newSec = e.target.value;
                      const parsed = parseAptoCode(editingBeneficiary.direccion, newSec);
                      const isExt = editingBeneficiary.direccion.toLowerCase().includes('externo') || editingBeneficiary.direccion.toLowerCase().includes('fuera') || newSec.toLowerCase().includes('externo');
                      setEditingBeneficiary({
                        ...editingBeneficiary,
                        sector: newSec,
                        agrupacion: isExt ? 'Usuarios Externos' : (parsed.isParsed ? parsed.agrupacion : editingBeneficiary.agrupacion),
                        descripcion: isExt ? 'Usuario Externo al Sector' : (parsed.isParsed ? parsed.descripcion : editingBeneficiary.direccion)
                      });
                    }}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="Sector 1">Sector 1</option>
                    <option value="Sector 2">Sector 2</option>
                    <option value="Sector 3">Sector 3</option>
                    <option value="Sector 4">Sector 4</option>
                    <option value="Sector 5">Sector 5</option>
                    <option value="Sector 6">Sector 6</option>
                    <option value="Sector 7">Sector 7</option>
                    <option value="Usuarios Externos">Usuarios Externos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dirección / Apto *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ej. 2C15 o 4B42 o Usuario Externo"
                      value={editingBeneficiary.direccion}
                      onFocus={e => e.target.select()}
                      onChange={e => {
                        const newDir = e.target.value;
                        const parsed = parseAptoCode(newDir, editingBeneficiary.sector);
                        const isExt = newDir.toLowerCase().includes('externo') || newDir.toLowerCase().includes('fuera') || (editingBeneficiary.sector || '').toLowerCase().includes('externo');
                        setEditingBeneficiary({
                          ...editingBeneficiary,
                          direccion: newDir,
                          agrupacion: isExt ? 'Usuarios Externos' : (parsed.isParsed ? parsed.agrupacion : editingBeneficiary.agrupacion),
                          descripcion: isExt ? 'Usuario Externo al Sector' : (parsed.isParsed ? parsed.descripcion : newDir)
                        });
                      }}
                      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    {editingBeneficiary.direccion && (
                      <button
                        type="button"
                        onClick={() => setEditingBeneficiary({ ...editingBeneficiary, direccion: '' })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 cursor-pointer"
                        title="Borrar dirección"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editingBeneficiary.telefono}
                      onFocus={e => e.target.select()}
                      onChange={e => setEditingBeneficiary({ ...editingBeneficiary, telefono: e.target.value })}
                      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    {editingBeneficiary.telefono && (
                      <button
                        type="button"
                        onClick={() => setEditingBeneficiary({ ...editingBeneficiary, telefono: '' })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 cursor-pointer"
                        title="Borrar teléfono"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Agrupación</label>
                  <select
                    value={editingBeneficiary.agrupacion}
                    onChange={e => setEditingBeneficiary({ ...editingBeneficiary, agrupacion: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="Agrupación 1">Agrupación 1</option>
                    <option value="Agrupación 2">Agrupación 2</option>
                    <option value="Agrupación 3">Agrupación 3</option>
                    <option value="Agrupación 4">Agrupación 4</option>
                    <option value="Agrupación 5">Agrupación 5</option>
                    <option value="Torres y Aptos">Torres y Aptos</option>
                    <option value="Sector General">Sector General</option>
                    <option value="Usuarios Externos">Usuarios Externos</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      👥 Integrantes Hogar: *
                    </label>
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200">
                      {editingBeneficiary.integrantesHogar || 1} personas
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingBeneficiary(prev => prev ? ({ ...prev, integrantesHogar: Math.max(1, (prev.integrantesHogar || 1) - 1) }) : null)}
                        className="w-9 h-9 bg-white border-2 border-slate-300 active:scale-95 text-slate-800 rounded-xl font-black text-lg flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={25}
                        value={editingBeneficiary.integrantesHogar || ''}
                        onFocus={e => e.target.select()}
                        onChange={e => {
                          const val = e.target.value === '' ? '' : parseInt(e.target.value);
                          setEditingBeneficiary({ ...editingBeneficiary, integrantesHogar: val as any });
                        }}
                        onBlur={() => {
                          if (!editingBeneficiary.integrantesHogar || editingBeneficiary.integrantesHogar < 1) {
                            setEditingBeneficiary({ ...editingBeneficiary, integrantesHogar: 1 });
                          }
                        }}
                        className="w-14 h-9 text-center bg-white border-2 border-slate-300 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />

                      <button
                        type="button"
                        onClick={() => setEditingBeneficiary(prev => prev ? ({ ...prev, integrantesHogar: Math.min(25, (prev.integrantesHogar || 1) + 1) }) : null)}
                        className="w-9 h-9 bg-white border-2 border-slate-300 active:scale-95 text-slate-800 rounded-xl font-black text-lg flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex gap-1 overflow-x-auto">
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setEditingBeneficiary({ ...editingBeneficiary, integrantesHogar: num })}
                          className={`w-7 h-9 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            editingBeneficiary.integrantesHogar === num
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <VulnerabilitiesForm
                value={editingBeneficiary.vulnerabilidades}
                onChange={v => setEditingBeneficiary({ ...editingBeneficiary, vulnerabilidades: v })}
              />

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingBeneficiary(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CSV Import Confirmation Modal */}
      {pendingCSVData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100">
            <div className="flex items-center space-x-3 text-emerald-600 mb-4">
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Importación de Archivo CSV</h3>
                <p className="text-xs text-slate-500 font-medium">Se leyeron {pendingCSVData.length} registros del archivo</p>
              </div>
            </div>

            <div className="space-y-3 my-5 text-xs text-slate-600">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Registros en el archivo CSV subido:</span>
                  <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 font-mono text-sm">{pendingCSVData.length}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Registros con entregas anotadas:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 font-mono">
                    {pendingCSVData.filter(i => Boolean(i.fechaEntrega?.trim() || i.queSeEntrego?.trim())).length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Beneficiarios actuales en base de datos:</span>
                  <span className="font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 font-mono">{beneficiaries.length}</span>
                </div>
              </div>

              <p className="font-semibold text-slate-700">
                ¿Cómo desea procesar este archivo CSV?
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => handleConfirmImport(false)}
                className="w-full p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <p className="font-bold text-sm">1. Agregar y Actualizar (Unificar / Upsert)</p>
                  <p className="text-[11px] text-emerald-100 font-normal mt-0.5">
                    Mantiene los datos previos y fusiona o agrega los nuevos registros del CSV.
                  </p>
                </div>
                <Check className="w-5 h-5 ml-2 shrink-0" />
              </button>

              <button
                onClick={() => {
                  setShowCsvReplacePasswordModal(true);
                  setCsvReplacePassword('');
                  setCsvReplacePasswordError('');
                }}
                className="w-full p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-all flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <p className="font-bold text-sm text-amber-950">2. Reemplazar Base de Datos Completa</p>
                  <p className="text-[11px] text-amber-800 font-normal mt-0.5">
                    Borra los datos anteriores y deja exactamente los {pendingCSVData.length} registros del CSV recién subido.
                  </p>
                </div>
                <AlertCircle className="w-5 h-5 ml-2 text-amber-700 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setPendingCSVData(null)}
                className="w-full py-2.5 text-slate-500 hover:text-slate-700 font-bold text-xs text-center cursor-pointer transition-colors mt-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Replace Security Password Modal */}
      {showCsvReplacePasswordModal && pendingCSVData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="p-3 bg-amber-50 rounded-2xl">
                <Lock className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Autorización Requerida</h3>
                <p className="text-xs text-slate-500 font-medium">Reemplazo de Base de Datos</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Para reemplazar la base de datos con los <strong>{pendingCSVData.length} registros</strong> del CSV, ingresa la clave de seguridad de administrador:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isValidAdminPassword(csvReplacePassword)) {
                  setCsvReplacePasswordError('Contraseña incorrecta. Acción no autorizada.');
                  return;
                }
                handleConfirmImport(true);
                setShowCsvReplacePasswordModal(false);
                setCsvReplacePassword('');
                setCsvReplacePasswordError('');
              }}
              className="space-y-3"
            >
              <div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoFocus
                    value={csvReplacePassword}
                    onChange={(e) => {
                      setCsvReplacePassword(e.target.value);
                      if (csvReplacePasswordError) setCsvReplacePasswordError('');
                    }}
                    placeholder="Contraseña de administrador"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                {csvReplacePasswordError && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1.5 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 inline mr-1" />
                    <span>{csvReplacePasswordError}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Reemplazo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowCsvReplacePasswordModal(false);
                    setCsvReplacePassword('');
                    setCsvReplacePasswordError('');
                  }}
                  className="w-full py-2 text-slate-500 hover:text-slate-700 font-bold text-xs text-center cursor-pointer transition-colors"
                >
                  Volver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <Lock className="w-7 h-7 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Vaciar Base de Datos</h3>
                <p className="text-xs text-slate-500 font-medium">Acción protegida por clave de seguridad</p>
              </div>
            </div>

            <div className="bg-rose-50/80 p-3.5 rounded-2xl border border-rose-200/80 text-xs text-rose-900 space-y-1.5">
              <p className="font-semibold">
                ¿Está seguro de que desea vaciar toda la base de datos?
              </p>
              <p className="text-rose-700 text-[11px]">
                Se eliminarán los <strong>{beneficiaries.length} beneficiarios</strong> y todas las entregas registradas tanto de la nube como localmente.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isValidAdminPassword(clearPassword)) {
                  setClearPasswordError('Contraseña incorrecta. Acción no autorizada.');
                  return;
                }
                if (onClearAllData) {
                  onClearAllData();
                }
                setShowClearModal(false);
                setClearPassword('');
                setClearPasswordError('');
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ingrese la contraseña de seguridad para autorizar:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoFocus
                    value={clearPassword}
                    onChange={(e) => {
                      setClearPassword(e.target.value);
                      if (clearPasswordError) setClearPasswordError('');
                    }}
                    placeholder="Contraseña de seguridad"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
                {clearPasswordError && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1.5 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 inline mr-1" />
                    <span>{clearPasswordError}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirmar y Vaciar BD</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowClearModal(false);
                    setClearPassword('');
                    setClearPasswordError('');
                  }}
                  className="w-full py-2 text-slate-500 hover:text-slate-700 font-bold text-xs text-center cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deduplicate Preview & Merge Modal */}
      <DeduplicateModal
        isOpen={showDeduplicateModal}
        onClose={() => setShowDeduplicateModal(false)}
        beneficiaries={beneficiaries}
        onConfirmDeduplication={(finalList) => {
          if (onDeduplicateBeneficiaries) {
            onDeduplicateBeneficiaries(finalList);
          }
        }}
      />
    </div>
  );
};
