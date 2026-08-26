import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Building2,
  PackageCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Phone,
  User,
  CreditCard,
  Hash,
  Plus,
  Upload,
  Download,
  Users,
  UserPlus,
  MapPin,
  Edit3,
  UserCheck,
  Globe,
  X,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Dog,
  Baby,
  Accessibility,
  HeartHandshake,
  Lock,
  KeyRound
} from 'lucide-react';
import { Beneficiary, DeliveryRecord, HouseholdVulnerabilities } from '../types';
import { parseBeneficiariesCSV, downloadCSVTemplate } from '../lib/csvHelper';
import { parseAptoCode } from '../lib/aptoParser';
import { VulnerabilitiesForm } from './VulnerabilitiesForm';
import { formatDateToYMD, isDeliveryInDateRange, formatDisplayDateTime } from '../lib/dateUtils';

interface SimpleMarketDeliveryViewProps {
  beneficiaries: Beneficiary[];
  deliveries: DeliveryRecord[];
  onConfirmDelivery: (deliveryData: Omit<DeliveryRecord, 'id'>) => void;
  onDeleteDelivery?: (deliveryId: string) => void;
  onAddBeneficiary: (newBen: Omit<Beneficiary, 'id' | 'no' | 'estadoEntrega'>) => void;
  onEditBeneficiary?: (beneficiary: Beneficiary) => void;
  onImportBulkBeneficiaries?: (items: any[], replaceMode?: boolean) => void;
  onClearAllData?: () => void;
}

interface ApartmentGroup {
  key: string;
  direccion: string;
  descripcion: string;
  agrupacion: string;
  itemNo: number;
  residents: Beneficiary[];
  deliveries: DeliveryRecord[];
  isExternal?: boolean;
}

export const SimpleMarketDeliveryView: React.FC<SimpleMarketDeliveryViewProps> = ({
  beneficiaries,
  deliveries,
  onConfirmDelivery,
  onDeleteDelivery,
  onAddBeneficiary,
  onEditBeneficiary,
  onImportBulkBeneficiaries,
  onClearAllData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SECTOR' | 'EXTERNAL' | 'PENDING' | 'DELIVERED' | 'TODAY' | 'DATE_RANGE' | 'MULTIPLE'>('ALL');
  const [customDeliveryStartDate, setCustomDeliveryStartDate] = useState<string>('');
  const [customDeliveryEndDate, setCustomDeliveryEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  
  // Track active/selected resident per apartment group key
  const [activeResidentMap, setActiveResidentMap] = useState<Record<string, string>>({});

  // CSV Upload File Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delivery confirmation modal state
  const [selectedAptGroupForDelivery, setSelectedAptGroupForDelivery] = useState<ApartmentGroup | null>(null);
  const [selectedResidentId, setSelectedResidentId] = useState<string>(''); // beneficiary ID or 'NEW_PERSON'
  
  // Edit beneficiary modal state
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);

  // Fields if a new person is being registered during delivery
  const [anotherPersonNombre, setAnotherPersonNombre] = useState('');
  const [anotherPersonCedula, setAnotherPersonCedula] = useState('');
  const [anotherPersonTelefono, setAnotherPersonTelefono] = useState('');

  // Census members count state during delivery
  const [censusCountInput, setCensusCountInput] = useState<number>(3);

  const [responsableInput, setResponsableInput] = useState('Voluntario Chiminangos');
  const [observacionesInput, setObservacionesInput] = useState('Entrega de Mercado Familiar');
  
  // New Apt/Beneficiary Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSector, setNewSector] = useState('Sector 1');
  const [newDireccion, setNewDireccion] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newTipoDocumento, setNewTipoDocumento] = useState('CC');
  const [newCedula, setNewCedula] = useState('');
  const [newTelefono, setNewTelefono] = useState('');
  const [newAgrupacion, setNewAgrupacion] = useState('Agrupación 1');
  const [newIntegrantesHogar, setNewIntegrantesHogar] = useState<number>(3);

  // Group beneficiaries into unique Apartment Groups or Individual External Cards
  const apartmentGroups = useMemo(() => {
    const groupsMap = new Map<string, ApartmentGroup>();

    beneficiaries.forEach(b => {
      const parsed = parseAptoCode(b.direccion);
      
      const isExternal = 
        b.direccion.toLowerCase().includes('externo') || 
        b.agrupacion?.toLowerCase().includes('externo') ||
        b.descripcion?.toLowerCase().includes('externo') ||
        b.cedula.toLowerCase().includes('externo');

      // Key logic: External users get their own distinct card so they aren't merged into 1 card!
      const key = isExternal
        ? `external-${b.id}`
        : (parsed.descripcion || b.direccion).trim().toLowerCase();

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          direccion: isExternal ? 'Usuario Externo' : b.direccion,
          descripcion: isExternal ? `Usuario Externo (${b.nombre})` : (parsed.descripcion || b.direccion),
          agrupacion: isExternal ? 'Usuarios Externos' : (b.agrupacion || parsed.agrupacion || 'Sector General'),
          itemNo: b.no,
          residents: [],
          deliveries: [],
          isExternal
        });
      }

      const group = groupsMap.get(key)!;
      group.residents.push(b);
    });

    // Populate and sort deliveries for each group
    groupsMap.forEach(group => {
      const residentIds = new Set(group.residents.map(r => r.id));
      const residentCedulas = new Set(group.residents.map(r => r.cedula));
      const normalizedGroupAddr = group.direccion.trim().toLowerCase();

      group.deliveries = deliveries.filter(d => {
        if (d.beneficiarioId && residentIds.has(d.beneficiarioId)) return true;
        if (d.beneficiarioCedula && d.beneficiarioCedula !== 'S/N' && residentCedulas.has(d.beneficiarioCedula)) return true;
        if (!group.isExternal && d.beneficiarioDireccion && d.beneficiarioDireccion.trim().toLowerCase() === normalizedGroupAddr) return true;
        
        const dParsed = parseAptoCode(d.beneficiarioDireccion);
        if (!group.isExternal && dParsed.descripcion && dParsed.descripcion.trim().toLowerCase() === group.key) return true;
        return false;
      }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    });

    return Array.from(groupsMap.values());
  }, [beneficiaries, deliveries]);

  const todayStr = useMemo(() => formatDateToYMD(new Date()), []);

  // Group or filter apartment groups by search query and status
  const filteredApartmentGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return apartmentGroups.filter(group => {
      const deliveryCount = group.deliveries.length;
      const hasDeliveries = deliveryCount > 0;

      // Category filter
      if (filterStatus === 'SECTOR' && group.isExternal) return false;
      if (filterStatus === 'EXTERNAL' && !group.isExternal) return false;

      // Status filter
      if (filterStatus === 'PENDING' && hasDeliveries) return false;
      if (filterStatus === 'DELIVERED' && !hasDeliveries) return false;
      if (filterStatus === 'MULTIPLE' && deliveryCount < 2) return false;

      // Date filters
      if (filterStatus === 'TODAY') {
        const hasTodayDelivery = group.deliveries.some(d => isDeliveryInDateRange(d.fecha, todayStr, todayStr));
        if (!hasTodayDelivery) return false;
      }
      if (filterStatus === 'DATE_RANGE') {
        const hasRangeDelivery = group.deliveries.some(d => isDeliveryInDateRange(d.fecha, customDeliveryStartDate, customDeliveryEndDate));
        if (!hasRangeDelivery) return false;
      }

      // Search match by Apt/Dirección, Descripcion, Resident Name, Cédula, Teléfono, ITEM #
      if (!q) return true;

      const aptMatch = group.direccion.toLowerCase().includes(q) || group.descripcion.toLowerCase().includes(q);
      const residentMatch = group.residents.some(r =>
        r.nombre.toLowerCase().includes(q) ||
        r.cedula.toLowerCase().includes(q) ||
        (r.telefono || '').toLowerCase().includes(q) ||
        r.no.toString() === q ||
        `#${r.no}` === q
      );

      return aptMatch || residentMatch;
    });
  }, [apartmentGroups, searchQuery, filterStatus, todayStr, customDeliveryStartDate, customDeliveryEndDate]);

  // Total pages and sliced paginated items
  const totalPages = Math.max(1, Math.ceil(filteredApartmentGroups.length / pageSize));
  
  // Ensure current page stays in valid range when filter/search changes
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedApartmentGroups = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredApartmentGroups.slice(startIndex, startIndex + pageSize);
  }, [filteredApartmentGroups, validCurrentPage, pageSize]);

  // Overall quick stats
  const totalApartmentsCount = apartmentGroups.length;
  const sectorGroupsCount = apartmentGroups.filter(g => !g.isExternal).length;
  const externalGroupsCount = apartmentGroups.filter(g => g.isExternal).length;
  const totalDeliveredApartmentsCount = apartmentGroups.filter(g => g.deliveries.length > 0).length;
  const totalPendingApartmentsCount = totalApartmentsCount - totalDeliveredApartmentsCount;
  const multipleDeliveriesApartmentsCount = apartmentGroups.filter(g => g.deliveries.length > 1).length;
  const totalDeliveriesMade = deliveries.length;

  // Deliveries made today
  const deliveriesTodayCount = useMemo(() => {
    return deliveries.filter(d => isDeliveryInDateRange(d.fecha, todayStr, todayStr)).length;
  }, [deliveries, todayStr]);

  const apartmentsDeliveredTodayCount = useMemo(() => {
    return apartmentGroups.filter(g => g.deliveries.some(d => isDeliveryInDateRange(d.fecha, todayStr, todayStr))).length;
  }, [apartmentGroups, todayStr]);

  const [pendingCSVData, setPendingCSVData] = useState<any[] | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
  const [clearPasswordError, setClearPasswordError] = useState('');
  const [csvReplacePassword, setCsvReplacePassword] = useState('');
  const [csvReplacePasswordError, setCsvReplacePasswordError] = useState('');
  const [showCsvReplacePasswordModal, setShowCsvReplacePasswordModal] = useState(false);

  const ADMIN_PASSWORD = 'Salome2016.';

  // Handle CSV file upload
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const parsed = parseBeneficiariesCSV(text);
      if (parsed.length === 0) {
        alert('No se encontraron registros válidos en el archivo CSV. Asegúrese de incluir encabezados: Dirección, Nombre, Cédula, Teléfono.');
        return;
      }

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

  // Open delivery modal for an apartment group
  const handleOpenDeliveryModal = (aptGroup: ApartmentGroup) => {
    setSelectedAptGroupForDelivery(aptGroup);
    // Default selected resident is either active or first resident
    const activeResId = activeResidentMap[aptGroup.key] || (aptGroup.residents[0] ? aptGroup.residents[0].id : '');
    setSelectedResidentId(activeResId);

    const activeRes = aptGroup.residents.find(r => r.id === activeResId);
    if (activeRes && activeRes.censoActualizado && activeRes.integrantesHogar > 0) {
      setCensusCountInput(activeRes.integrantesHogar);
    } else {
      setCensusCountInput(3);
    }

    setAnotherPersonNombre('');
    setAnotherPersonCedula('');
    setAnotherPersonTelefono('');
    setObservacionesInput('Entrega de Mercado Familiar');
  };

  // Handle delivery confirmation submit
  const handleConfirmDeliverySubmit = () => {
    if (!selectedAptGroupForDelivery) return;

    let targetBen: {
      id: string;
      nombre: string;
      cedula: string;
      direccion: string;
      sector?: string;
      agrupacion: string;
    };

    const validatedMembersCount = Math.max(1, censusCountInput || 1);

    if (selectedResidentId === 'NEW_PERSON') {
      if (!anotherPersonNombre.trim()) {
        alert('Por favor ingrese el nombre de la persona que retira el mercado.');
        return;
      }

      const newPersonData = {
        direccion: selectedAptGroupForDelivery.direccion,
        nombre: anotherPersonNombre.trim(),
        cedula: anotherPersonCedula.trim() || 'S/N',
        telefono: anotherPersonTelefono.trim() || 'Sin teléfono',
        sector: selectedAptGroupForDelivery.isExternal ? 'Usuarios Externos' : 'Sector 1',
        agrupacion: selectedAptGroupForDelivery.agrupacion || 'Sector General',
        integrantesHogar: validatedMembersCount,
        censoActualizado: true,
        prioridadEspecial: false
      };

      onAddBeneficiary(newPersonData);

      targetBen = {
        id: `ben-user-${Date.now()}`,
        nombre: newPersonData.nombre,
        cedula: newPersonData.cedula,
        direccion: newPersonData.direccion,
        sector: newPersonData.sector,
        agrupacion: newPersonData.agrupacion
      };
    } else {
      const existing = selectedAptGroupForDelivery.residents.find(r => r.id === selectedResidentId);
      if (!existing) {
        alert('Por favor seleccione una persona para registrar la entrega.');
        return;
      }

      // Automatically save/update the beneficiary's census count to profile
      if (onEditBeneficiary) {
        onEditBeneficiary({
          ...existing,
          integrantesHogar: validatedMembersCount,
          censoActualizado: true
        });
      }

      targetBen = {
        id: existing.id,
        nombre: existing.nombre,
        cedula: existing.cedula,
        direccion: existing.direccion,
        sector: existing.sector || 'Sector 1',
        agrupacion: existing.agrupacion || 'Sector General'
      };
    }

    const nowISO = new Date().toISOString();

    onConfirmDelivery({
      beneficiarioId: targetBen.id,
      beneficiarioNombre: targetBen.nombre,
      beneficiarioCedula: targetBen.cedula,
      beneficiarioDireccion: targetBen.direccion,
      sector: targetBen.sector || 'Sector 1',
      agrupacion: targetBen.agrupacion,
      fecha: nowISO,
      articulos: [
        {
          itemId: 'inv-1',
          itemNombre: 'Mercado Familiar de Alimentos',
          cantidad: 1,
          unidad: 'Kit'
        }
      ],
      responsable: responsableInput.trim() || 'Voluntario Chiminangos',
      observaciones: observacionesInput.trim(),
      estado: 'COMPLETADO',
      integrantesHogar: validatedMembersCount,
      censoActualizado: true
    });

    // Reset modal state
    setSelectedAptGroupForDelivery(null);
    setSelectedResidentId('');
    setAnotherPersonNombre('');
    setAnotherPersonCedula('');
    setAnotherPersonTelefono('');
  };

  const handleCreateBeneficiarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDireccion.trim() || !newNombre.trim()) {
      alert('Por favor ingrese al menos el número de Apto/Dirección y el Nombre.');
      return;
    }

    const isExt = newDireccion.toLowerCase().includes('externo') || newDireccion.toLowerCase().includes('fuera') || newSector.toLowerCase().includes('externo');
    const selectedSector = isExt ? 'Usuarios Externos' : newSector;
    const parsed = parseAptoCode(newDireccion.trim(), selectedSector);

    onAddBeneficiary({
      direccion: isExt ? 'Usuario Externo' : newDireccion.trim(),
      nombre: newNombre.trim(),
      tipoDocumento: newTipoDocumento || 'CC',
      cedula: newCedula.trim() || 'S/N',
      telefono: newTelefono.trim() || 'Sin teléfono',
      sector: selectedSector,
      agrupacion: isExt ? 'Usuarios Externos' : (parsed.isParsed ? parsed.agrupacion : newAgrupacion),
      descripcion: isExt ? 'Usuario Externo al Sector' : parsed.descripcion,
      integrantesHogar: newIntegrantesHogar || 1,
      prioridadEspecial: false
    });

    setNewSector('Sector 1');
    setNewDireccion('');
    setNewNombre('');
    setNewTipoDocumento('CC');
    setNewCedula('');
    setNewTelefono('');
    setNewAgrupacion('Agrupación 1');
    setNewIntegrantesHogar(3);
    setIsAddModalOpen(false);
  };

  // Open modal to add a person to an existing apartment address
  const handleOpenAddPersonToApto = (address: string) => {
    setNewDireccion(address);
    setNewNombre('');
    setNewCedula('');
    setNewTelefono('');
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Hidden File Input for CSV */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,.txt"
        className="hidden"
        onChange={handleCSVUpload}
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-emerald-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30 mb-2">
              <PackageCheck className="w-4 h-4" />
              <span>Buscador y Registro de Mercados</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Control Sencillo por Número de Apto
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Busque por número de apartamento o dirección para consultar las entregas por habitante, o agregue nuevas personas a cada apartamento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {/* CSV Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs sm:text-sm rounded-xl border border-emerald-500/40 shadow-md flex items-center space-x-2 transition-all cursor-pointer"
              title="Subir archivo CSV con datos del censo"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Subir Archivo CSV</span>
            </button>

            {/* Download CSV Template */}
            <button
              onClick={downloadCSVTemplate}
              className="px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Descargar plantilla de ejemplo CSV"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Plantilla CSV</span>
            </button>

            {onClearAllData && beneficiaries.length > 0 && (
              <button
                onClick={() => {
                  setClearPassword('');
                  setClearPasswordError('');
                  setShowClearModal(true);
                }}
                className="px-2.5 py-2 bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 hover:text-rose-300 font-bold text-xs rounded-xl border border-rose-800/40 shadow-sm flex items-center space-x-1 transition-all cursor-pointer"
                title="Protegido por contraseña - Vaciar Base de Datos"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Vaciar BD</span>
              </button>
            )}

            {/* Add New Apt/Person */}
            <button
              onClick={() => {
                setNewDireccion('');
                setNewNombre('');
                setNewCedula('');
                setNewTelefono('');
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Apto / Beneficiario</span>
            </button>
          </div>
        </div>

        {/* Big Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-400">
            <Search className="w-6 h-6" />
          </div>
          <input
            type="text"
            autoFocus
            placeholder="Escriba el NÚMERO DE APTO (ej. 5D43, 4B42, 3E43), Cédula, Nombre o Celular..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-13 pr-10 py-4 bg-white/95 text-slate-900 placeholder-slate-400 font-bold text-sm sm:text-base rounded-2xl shadow-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/60 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Borrar
            </button>
          )}
        </div>

        {/* Quick Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="text-slate-400 font-semibold mr-1">Filtrar:</span>
            <button
              onClick={() => {
                setFilterStatus('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todos ({totalApartmentsCount})
            </button>

            <button
              onClick={() => {
                setFilterStatus('SECTOR');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                filterStatus === 'SECTOR'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Residentes Sector ({sectorGroupsCount})
            </button>

            <button
              onClick={() => {
                setFilterStatus('EXTERNAL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                filterStatus === 'EXTERNAL'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Usuarios Externos ({externalGroupsCount})
            </button>

            <button
              onClick={() => {
                setFilterStatus('PENDING');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                filterStatus === 'PENDING'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Sin entregar ({totalPendingApartmentsCount})
            </button>

            <button
              onClick={() => {
                setFilterStatus('DELIVERED');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                filterStatus === 'DELIVERED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Con entregas ({totalDeliveredApartmentsCount})
            </button>

            <button
              onClick={() => {
                setFilterStatus('MULTIPLE');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer border ${
                filterStatus === 'MULTIPLE'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950/50'
                  : 'bg-slate-800 text-purple-300 border-purple-500/30 hover:bg-purple-950/50'
              }`}
            >
              Múltiples Mercados (2+) ({multipleDeliveriesApartmentsCount})
            </button>

            <button
              onClick={() => {
                setFilterStatus(filterStatus === 'TODAY' ? 'ALL' : 'TODAY');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer border flex items-center space-x-1.5 ${
                filterStatus === 'TODAY'
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-950/50'
                  : 'bg-slate-800 text-cyan-300 border-cyan-500/30 hover:bg-cyan-950/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Entregados Hoy ({apartmentsDeliveredTodayCount})</span>
            </button>

            <button
              onClick={() => {
                if (filterStatus === 'DATE_RANGE') {
                  setFilterStatus('ALL');
                } else {
                  setFilterStatus('DATE_RANGE');
                  if (!customDeliveryStartDate) setCustomDeliveryStartDate(todayStr);
                  if (!customDeliveryEndDate) setCustomDeliveryEndDate(todayStr);
                }
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer border flex items-center space-x-1.5 ${
                filterStatus === 'DATE_RANGE'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-950/50'
                  : 'bg-slate-800 text-indigo-300 border-indigo-500/30 hover:bg-indigo-950/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Filtrar por Rango de Fechas</span>
            </button>
          </div>

          <div className="text-slate-300 font-medium text-[11px] bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2">
            <span><strong>{totalDeliveriesMade}</strong> Mercados Entregados</span>
            <span className="text-slate-500">•</span>
            <span><strong>{deliveriesTodayCount}</strong> Hoy</span>
            <span className="text-slate-500">•</span>
            <span><strong>{totalApartmentsCount}</strong> Viviendas Únicas</span>
            {multipleDeliveriesApartmentsCount > 0 && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-purple-300 font-bold"><strong>{multipleDeliveriesApartmentsCount}</strong> Aptos con 2+ Mercados</span>
              </>
            )}
          </div>
        </div>

        {/* Date range picker bar if DATE_RANGE active */}
        {filterStatus === 'DATE_RANGE' && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-indigo-500/30 text-white">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
              <Calendar className="w-4 h-4" />
              <span>Seleccionar Período de Entregas:</span>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-[11px] text-slate-400 font-medium">Desde:</label>
              <input
                type="date"
                value={customDeliveryStartDate}
                onChange={e => {
                  setCustomDeliveryStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 bg-slate-800 text-white border border-slate-700 rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-[11px] text-slate-400 font-medium">Hasta:</label>
              <input
                type="date"
                value={customDeliveryEndDate}
                onChange={e => {
                  setCustomDeliveryEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 bg-slate-800 text-white border border-slate-700 rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => {
                setCustomDeliveryStartDate('');
                setCustomDeliveryEndDate('');
                setFilterStatus('ALL');
                setCurrentPage(1);
              }}
              className="text-xs text-indigo-300 hover:text-white underline cursor-pointer ml-auto"
            >
              Limpiar filtro de fecha
            </button>
          </div>
        )}
      </div>

      {/* Results List / Cards Grouped by Apartment */}
      <div className="space-y-4">
        {paginatedApartmentGroups.map(aptGroup => {
          const deliveryCount = aptGroup.deliveries.length;
          const hasDeliveries = deliveryCount > 0;

          // Determine currently active displayed resident
          const activeResidentId = activeResidentMap[aptGroup.key] || (aptGroup.residents[0] ? aptGroup.residents[0].id : '');
          const activeResident = aptGroup.residents.find(r => r.id === activeResidentId) || aptGroup.residents[0];

          return (
            <div
              key={aptGroup.key}
              className={`bg-white rounded-2xl border transition-all p-5 shadow-sm hover:shadow-md ${
                aptGroup.isExternal
                  ? 'border-amber-300/80 bg-amber-50/10'
                  : hasDeliveries
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Left Side: Apartment Header & Resident Info */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                    <span className="px-3 py-1 bg-slate-900 text-white font-mono font-extrabold text-xs rounded-xl flex items-center space-x-1">
                      <Hash className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ITEM #{activeResident?.no || aptGroup.itemNo}</span>
                    </span>

                    {aptGroup.isExternal ? (
                      <span className="px-3.5 py-1 bg-amber-100 text-amber-950 font-extrabold text-sm rounded-xl border border-amber-300 flex items-center space-x-1.5">
                        <Globe className="w-4 h-4 text-amber-700" />
                        <span>USUARIO EXTERNO AL SECTOR</span>
                      </span>
                    ) : (
                      <span className="px-3.5 py-1 bg-emerald-100 text-emerald-900 font-extrabold text-sm rounded-xl border border-emerald-200 flex items-center space-x-1.5">
                        <Building2 className="w-4 h-4 text-emerald-700" />
                        <span>APTO: {aptGroup.direccion}</span>
                      </span>
                    )}

                    <span className="px-3 py-1 bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200/90 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{aptGroup.descripcion}</span>
                    </span>

                    <span className="px-3 py-1 bg-indigo-50 text-indigo-900 font-bold text-xs rounded-xl border border-indigo-200 flex items-center space-x-1.5 shadow-2xs">
                      <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{activeResident?.integrantesHogar || 1} {(activeResident?.integrantesHogar || 1) === 1 ? 'Persona' : 'Personas'} en Apto</span>
                    </span>

                    {hasDeliveries ? (
                      <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-full flex items-center space-x-1 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{deliveryCount} Mercado(s) Entregado(s)</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-200">
                        0 Mercados entregados (Pendiente)
                      </span>
                    )}
                  </div>

                  {/* Active Resident Details */}
                  {activeResident && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60">
                      <div className="flex items-center space-x-2 text-slate-800">
                        <User className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Beneficiario / Titular:</span>
                          <strong className="text-slate-900 text-sm">{activeResident.nombre}</strong>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-slate-800">
                        <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Documento ID:</span>
                          <div className="flex items-center space-x-1.5">
                            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 font-bold text-[10px] rounded uppercase">
                              {activeResident.tipoDocumento || 'CC'}
                            </span>
                            <span className="font-mono font-bold text-slate-900">{activeResident.cedula}</span>
                            {onEditBeneficiary && (
                              <button
                                onClick={() => setEditingBeneficiary(activeResident)}
                                className="p-1 hover:bg-slate-200 text-slate-500 rounded transition-colors cursor-pointer"
                                title="Editar cédula, personas o datos de este beneficiario"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-slate-800">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Teléfono:</span>
                          <span className="font-medium text-slate-700">{activeResident.telefono || 'Sin teléfono'}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-slate-800">
                        <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Personas en Apto:</span>
                          <span className="font-extrabold text-indigo-900">{activeResident.integrantesHogar || 1} {(activeResident.integrantesHogar || 1) === 1 ? 'persona' : 'personas'}</span>
                        </div>
                      </div>

                      {/* Special Needs & Pets Badges for this household */}
                      {activeResident.vulnerabilidades && (
                        <div className="col-span-1 sm:col-span-3 flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-200/60">
                          <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Censo Especial:</span>
                          {activeResident.vulnerabilidades.tieneNinos && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-md flex items-center space-x-1">
                              <Baby className="w-3 h-3" />
                              <span>Niños {(activeResident.vulnerabilidades.ninosInfo || []).length > 0 ? `(${activeResident.vulnerabilidades.ninosInfo?.length})` : ''}</span>
                            </span>
                          )}
                          {activeResident.vulnerabilidades.tieneAdultoMayor && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-md flex items-center space-x-1">
                              <UserCheck className="w-3 h-3" />
                              <span>Adulto Mayor {(activeResident.vulnerabilidades.adultosMayoresInfo || []).length > 0 ? `(${activeResident.vulnerabilidades.adultosMayoresInfo?.length})` : ''}</span>
                            </span>
                          )}
                          {activeResident.vulnerabilidades.tieneDiscapacidad && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold text-[10px] rounded-md flex items-center space-x-1">
                              <Accessibility className="w-3 h-3" />
                              <span>Discapacidad</span>
                            </span>
                          )}
                          {activeResident.vulnerabilidades.tieneMascotas && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md flex items-center space-x-1" title={(activeResident.vulnerabilidades.mascotasInfo || []).map(p => `${p.cantidad} ${p.tipo}`).join(', ')}>
                              <Dog className="w-3 h-3" />
                              <span>🐾 Mascotas ({activeResident.vulnerabilidades.mascotasInfo?.reduce((sum, p) => sum + (p.cantidad || 1), 0) || 'Sí'})</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* All Persons Registered for this Apartment (Only show if > 1 resident or sector apt) */}
                  {!aptGroup.isExternal && aptGroup.residents.length > 0 && (
                    <div className="p-2.5 bg-slate-100/90 rounded-xl border border-slate-200/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Todas las personas registradas en este Apto ({aptGroup.residents.length}):</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {aptGroup.residents.map(r => {
                          const isSelected = r.id === activeResident?.id;
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setActiveResidentMap(prev => ({ ...prev, [aptGroup.key]: r.id }))}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all flex items-center space-x-1 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm scale-102'
                                  : 'bg-white hover:bg-slate-200 text-slate-800 border-slate-300'
                              }`}
                              title="Haga clic para ver la información de este habitante"
                            >
                              <span>👤 {r.nombre}</span>
                              <span className="opacity-80 font-mono text-[10px]">(C.C. {r.cedula})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Actions: Deliver & Add Person */}
                <div className="shrink-0 flex flex-col sm:flex-row md:flex-col justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => handleOpenDeliveryModal(aptGroup)}
                    className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-900/20 flex items-center justify-center space-x-2 cursor-pointer transition-transform hover:scale-102"
                  >
                    <PackageCheck className="w-5 h-5" />
                    <span>+ Entregar Mercado</span>
                  </button>

                  <button
                    onClick={() => handleOpenAddPersonToApto(aptGroup.direccion)}
                    className="w-full sm:w-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center space-x-1.5 cursor-pointer"
                    title="Agregar a otra persona que vive en este apartamento"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Personas en este Apto</span>
                  </button>
                </div>
              </div>

              {/* Delivery History Box for this Apartment */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 bg-slate-50/80 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Historial de Entregas ({deliveryCount} realizadas en este Apto):</span>
                  </span>
                  {hasDeliveries && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                      Última entrega: {formatDisplayDateTime(aptGroup.deliveries[0].fecha)}
                    </span>
                  )}
                </div>

                {hasDeliveries ? (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {aptGroup.deliveries.map((rec, idx) => (
                      <div
                        key={rec.id || idx}
                        className="bg-white p-2.5 rounded-lg border border-slate-200/90 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                            Mercado #{aptGroup.deliveries.length - idx}
                          </span>
                          <span className="text-slate-900 font-bold">
                            • Retirado por: <span className="text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{rec.beneficiarioNombre}</span>
                            {rec.beneficiarioCedula && rec.beneficiarioCedula !== 'S/N' && (
                              <span className="font-mono text-slate-500 text-[11px] ml-1">(C.C. {rec.beneficiarioCedula})</span>
                            )}
                          </span>
                          <span className="text-slate-500">• {rec.responsable}</span>
                        </div>

                        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                          <div className="flex items-center space-x-1.5 text-slate-700 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-md">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{formatDisplayDateTime(rec.fecha)}</span>
                          </div>

                          {onDeleteDelivery && (
                            <button
                              onClick={() => onDeleteDelivery(rec.id)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200/80 rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                              title="Anular esta entrega y reintegrar el mercado al inventario de bodega"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Anular</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-1">
                    No se han registrado entregas de mercado para este apartamento aún.
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {filteredApartmentGroups.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span>
                Mostrando <strong className="text-slate-900 font-bold">{Math.min(filteredApartmentGroups.length, (validCurrentPage - 1) * pageSize + 1)}</strong> - <strong className="text-slate-900 font-bold">{Math.min(filteredApartmentGroups.length, validCurrentPage * pageSize)}</strong> de <strong className="text-slate-900 font-bold">{filteredApartmentGroups.length}</strong> viviendas
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

        {filteredApartmentGroups.length === 0 && (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-3">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              No se encontró ningún Apto o Dirección con "{searchQuery}"
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Verifique el número de apartamento o haga clic en el botón a continuación para registrar un nuevo beneficiario.
            </p>
            <button
              onClick={() => {
                setNewDireccion(searchQuery);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer inline-flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Apto "{searchQuery}" ahora</span>
            </button>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL FOR DELIVERING A MARKET */}
      {selectedAptGroupForDelivery && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md">
                <PackageCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirmar Entrega de Mercado</h3>
                <p className="text-xs text-slate-500">
                  Apto / Dirección: <strong className="text-slate-800 font-bold">{selectedAptGroupForDelivery.direccion}</strong> ({selectedAptGroupForDelivery.descripcion})
                </p>
              </div>
            </div>

            {/* Select Person in this Apartment */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-800">
                ¿A quién se le entrega el mercado en este Apto? *
              </label>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {selectedAptGroupForDelivery.residents.map(r => (
                  <label
                    key={r.id}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedResidentId === r.id
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2 text-xs">
                      <input
                        type="radio"
                        name="deliveryResident"
                        value={r.id}
                        checked={selectedResidentId === r.id}
                        onChange={() => {
                          setSelectedResidentId(r.id);
                          if (r.integrantesHogar && r.integrantesHogar > 0) {
                            setCensusCountInput(r.integrantesHogar);
                          }
                        }}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>👤 {r.nombre}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">C.C. {r.cedula}</span>
                  </label>
                ))}

                {/* Option to register a new person */}
                <label
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedResidentId === 'NEW_PERSON'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-xs">
                    <input
                      type="radio"
                      name="deliveryResident"
                      value="NEW_PERSON"
                      checked={selectedResidentId === 'NEW_PERSON'}
                      onChange={() => setSelectedResidentId('NEW_PERSON')}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-emerald-700">+ Otra persona nueva en este Apto</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Registrar y entregar</span>
                </label>
              </div>
            </div>

            {/* Inputs if NEW_PERSON is selected */}
            {selectedResidentId === 'NEW_PERSON' && (
              <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs space-y-2.5 animate-fadeIn">
                <p className="text-[11px] text-emerald-900 font-bold">
                  Ingrese los datos de la persona que retira para agregarla al censo de este apartamento:
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Pedro Pérez"
                    value={anotherPersonNombre}
                    onChange={e => setAnotherPersonNombre(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Cédula:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 113000000"
                      value={anotherPersonCedula}
                      onChange={e => setAnotherPersonCedula(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Teléfono:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 3150000000"
                      value={anotherPersonTelefono}
                      onChange={e => setAnotherPersonTelefono(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Censo Alert & Update Block */}
            {(() => {
              const currentRes = selectedAptGroupForDelivery?.residents.find(r => r.id === selectedResidentId);
              const isNotCensused = selectedResidentId === 'NEW_PERSON' || !currentRes?.censoActualizado || (currentRes?.integrantesHogar || 0) === 0;

              return (
                <div className={`p-3.5 rounded-2xl shadow-sm space-y-2.5 animate-fadeIn ${
                  isNotCensused
                    ? 'bg-amber-50 border-2 border-amber-400/90'
                    : 'bg-emerald-50/80 border border-emerald-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-extrabold text-slate-900">
                      {isNotCensused ? (
                        <>
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                          <span className="text-amber-950 font-black">👥 N° de Integrantes en el Hogar: *</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-emerald-950 font-bold">👥 Integrantes en el Hogar:</span>
                        </>
                      )}
                    </div>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-white border border-slate-300 text-slate-900">
                      {censusCountInput} personas
                    </span>
                  </div>

                  {/* Touch Stepper & Big Presets for Mobile */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCensusCountInput(prev => Math.max(1, prev - 1))}
                        className="w-11 h-11 bg-white border-2 border-slate-300 active:scale-95 text-slate-800 rounded-xl font-black text-xl flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="1"
                        max="25"
                        value={censusCountInput}
                        onChange={e => setCensusCountInput(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 h-11 text-center bg-white border-2 border-slate-400 rounded-xl text-xl font-black text-slate-900 focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => setCensusCountInput(prev => Math.min(25, prev + 1))}
                        className="w-11 h-11 bg-white border-2 border-slate-300 active:scale-95 text-slate-800 rounded-xl font-black text-xl flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick 1-Tap Pills for instant selection */}
                    <div className="flex gap-1 justify-center flex-wrap">
                      {[1, 2, 3, 4, 5, 6, 8].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setCensusCountInput(num)}
                          className={`w-9 h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            censusCountInput === num
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Responsable / Voluntario:
                </label>
                <input
                  type="text"
                  value={responsableInput}
                  onChange={e => setResponsableInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observación o Nota (Opcional):
                </label>
                <input
                  type="text"
                  value={observacionesInput}
                  onChange={e => setObservacionesInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAptGroupForDelivery(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeliverySubmit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/30 flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar y Guardar Fecha</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE BENEFICIARY / APT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Registrar Apto / Beneficiario</h3>
                <p className="text-xs text-slate-500">Agregue una nueva persona o apartamento al censo</p>
              </div>
            </div>

            <form onSubmit={handleCreateBeneficiarySubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sector *
                  </label>
                  <select
                    value={newSector}
                    onChange={e => setNewSector(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/50"
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
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Apto o Dirección *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 4B42, 3E43, 2C21"
                    value={newDireccion}
                    onChange={e => {
                      const val = e.target.value;
                      setNewDireccion(val);
                      const parsed = parseAptoCode(val, newSector);
                      if (parsed.isParsed) {
                        setNewAgrupacion(parsed.agrupacion);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo del Titular *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Carlos Pérez"
                    value={newNombre}
                    onFocus={e => e.target.select()}
                    onChange={e => setNewNombre(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  {newNombre && (
                    <button
                      type="button"
                      onClick={() => setNewNombre('')}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo Doc. *
                  </label>
                  <select
                    value={newTipoDocumento}
                    onChange={e => setNewTipoDocumento(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="CC">C.C. - Cédula</option>
                    <option value="TI">T.I. - T. Identidad</option>
                    <option value="CE">C.E. - C. Extranjería</option>
                    <option value="PPT">PPT - Permiso Temp.</option>
                    <option value="PASAPORTE">PAS - Pasaporte</option>
                    <option value="OTRO">OTRO - S/N</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cédula:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ej. 113000000"
                      value={newCedula}
                      onFocus={e => e.target.select()}
                      onChange={e => setNewCedula(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    {newCedula && (
                      <button
                        type="button"
                        onClick={() => setNewCedula('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 cursor-pointer"
                        title="Borrar cédula"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ej. 3150000000"
                      value={newTelefono}
                      onFocus={e => e.target.select()}
                      onChange={e => setNewTelefono(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    {newTelefono && (
                      <button
                        type="button"
                        onClick={() => setNewTelefono('')}
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
                    value={newAgrupacion}
                    onChange={e => setNewAgrupacion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                      👥 Personas en Apto: *
                    </label>
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200">
                      {newIntegrantesHogar || 1} personas
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNewIntegrantesHogar(Math.max(1, (newIntegrantesHogar || 1) - 1))}
                        className="w-9 h-9 bg-white border-2 border-slate-300 active:scale-95 text-slate-800 rounded-xl font-black text-lg flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={25}
                        value={newIntegrantesHogar || ''}
                        onFocus={e => e.target.select()}
                        onChange={e => {
                          const val = e.target.value === '' ? '' : parseInt(e.target.value);
                          setNewIntegrantesHogar(val as any);
                        }}
                        onBlur={() => {
                          if (!newIntegrantesHogar || newIntegrantesHogar < 1) {
                            setNewIntegrantesHogar(1);
                          }
                        }}
                        className="w-14 h-9 text-center bg-white border-2 border-slate-300 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />

                      <button
                        type="button"
                        onClick={() => setNewIntegrantesHogar(Math.min(25, (newIntegrantesHogar || 1) + 1))}
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
                          onClick={() => setNewIntegrantesHogar(num)}
                          className={`w-7 h-9 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            newIntegrantesHogar === num
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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
                >
                  Guardar en Censo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* EDIT BENEFICIARY MODAL */}
      {editingBeneficiary && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Editar Beneficiario #{editingBeneficiary.no}</h3>
                  <p className="text-xs text-slate-500">Corregir Cédula, Nombre, Dirección y Censo Especial/Mascotas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBeneficiary(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingBeneficiary) return;
                const isExt = editingBeneficiary.direccion.toLowerCase().includes('externo') || (editingBeneficiary.sector || '').toLowerCase().includes('externo');
                const selectedSector = isExt ? 'Usuarios Externos' : (editingBeneficiary.sector || 'Sector 1');
                const parsed = parseAptoCode(editingBeneficiary.direccion, selectedSector);
                const updated: Beneficiary = {
                  ...editingBeneficiary,
                  sector: selectedSector,
                  agrupacion: isExt ? 'Usuarios Externos' : (parsed.isParsed ? parsed.agrupacion : editingBeneficiary.agrupacion),
                  descripcion: isExt ? 'Usuario Externo al Sector' : parsed.descripcion,
                  censoActualizado: true
                };
                if (onEditBeneficiary) {
                  onEditBeneficiary(updated);
                }
                setEditingBeneficiary(null);
              }}
              className="space-y-3"
            >
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
                    <option value="CC">C.C. - Cédula</option>
                    <option value="TI">T.I. - T. Identidad</option>
                    <option value="CE">C.E. - C. Extranjería</option>
                    <option value="PPT">PPT - Permiso Temp.</option>
                    <option value="PASAPORTE">PAS - Pasaporte</option>
                    <option value="OTRO">OTRO - S/N</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Número de Documento *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ej. 1130608151 o S/N"
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
                      const isExt = editingBeneficiary.direccion.toLowerCase().includes('externo') || newSec.toLowerCase().includes('externo');
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
                      placeholder="Ej. 2C15 o 4B42"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono Móvil</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editingBeneficiary.telefono}
                      onFocus={e => e.target.select()}
                      onChange={e => setEditingBeneficiary({ ...editingBeneficiary, telefono: e.target.value })}
                      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBeneficiary(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
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
                <Upload className="w-7 h-7 text-emerald-600" />
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
                <CheckCircle2 className="w-5 h-5 ml-2 shrink-0" />
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
                if (csvReplacePassword !== ADMIN_PASSWORD) {
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
                  <CheckCircle2 className="w-4 h-4" />
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
                if (clearPassword !== ADMIN_PASSWORD) {
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
    </div>
  );
};
