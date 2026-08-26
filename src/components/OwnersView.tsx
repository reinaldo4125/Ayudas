import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  UserCheck, 
  Home, 
  Key, 
  Mail, 
  Phone, 
  MessageSquare, 
  Download, 
  RefreshCw, 
  Edit3, 
  Check, 
  X, 
  AlertCircle, 
  Users, 
  Copy, 
  Send, 
  Layers, 
  ShieldAlert,
  Info,
  Sparkles,
  UserPlus,
  Trash2,
  Plus,
  FileText,
  Printer,
  UploadCloud,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { PropertyRecord, Beneficiary, PersonRecord } from '../types';
import { exportPropertiesToCSV, generateAllPropertiesSector1 } from '../lib/storage';
import { generateSignaturesDocx } from '../lib/docxExport';

interface OwnersViewProps {
  properties: PropertyRecord[];
  onUpdateProperty: (updated: PropertyRecord) => Promise<void>;
  onBulkUpdateProperties?: (list: PropertyRecord[]) => Promise<void>;
  beneficiaries?: Beneficiary[];
  onOpenDevPanel?: () => void;
}

export const OwnersView: React.FC<OwnersViewProps> = ({
  properties = [],
  onUpdateProperty,
  onBulkUpdateProperties,
  beneficiaries = [],
  onOpenDevPanel
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgrupacion, setSelectedAgrupacion] = useState<string>('TODAS');
  const [selectedTorre, setSelectedTorre] = useState<string>('TODAS');
  const [selectedPiso, setSelectedPiso] = useState<string>('TODOS');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [editingProperty, setEditingProperty] = useState<PropertyRecord | null>(null);
  const [showComunicadosModal, setShowComunicadosModal] = useState(false);
  const [isSyncingWithBens, setIsSyncingWithBens] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Announcement generator states
  const [comunicadoAsunto, setComunicadoAsunto] = useState('COMUNICADO OFICIAL - PROPIETARIOS SECTOR 1');
  const [comunicadoTipo, setComunicadoTipo] = useState<'asamblea' | 'mantenimiento' | 'cobro' | 'general'>('general');
  const [comunicadoDetalle, setComunicadoDetalle] = useState(
    'Estimados propietarios, les notificamos que se llevará a cabo una reunión informativa sobre las mejoras y gestión del Sector 1.'
  );

  // Export DOCX signatures state
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const handleExportSignaturesDocx = async () => {
    setIsExportingDocx(true);
    try {
      // Determine list to export: If user has a active search/filter, use filteredProperties; otherwise properties
      const filledInFiltered = filteredProperties.filter(
        p => p.propietario?.nombre && p.propietario.nombre.trim().length > 0
      );
      
      const targetList = filledInFiltered.length > 0 ? filteredProperties : properties;
      const count = targetList.filter(p => p.propietario?.nombre && p.propietario.nombre.trim().length > 0).length;

      if (count === 0) {
        alert('No se encontraron apartamentos con datos de propietario diligenciados para generar la planilla de firmas.');
        return;
      }

      await generateSignaturesDocx(targetList);
      setCopiedNotice(`✅ Planilla de firmas en Word (.docx) descargada exitosamente (${count} apartamentos diligenciados).`);
      setTimeout(() => setCopiedNotice(null), 5000);
    } catch (err) {
      console.error('Error al generar archivo Word:', err);
      alert('Ocurrió un error al generar el archivo Word de firmas.');
    } finally {
      setIsExportingDocx(false);
    }
  };
  const [newPersonNombre, setNewPersonNombre] = useState('');
  const [newPersonRol, setNewPersonRol] = useState<'COPROPIETARIO' | 'PROPIETARIO' | 'ARRENDATARIO' | 'HABITANTE' | 'FAMILIAR' | 'CONTACTO_EMERGENCIA'>('COPROPIETARIO');
  const [newPersonCedula, setNewPersonCedula] = useState('');
  const [newPersonTelefono, setNewPersonTelefono] = useState('');
  const [newPersonEmail, setNewPersonEmail] = useState('');
  const [newPersonObs, setNewPersonObs] = useState('');

  // Editing existing person state inside modal
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editPersonNombre, setEditPersonNombre] = useState('');
  const [editPersonRol, setEditPersonRol] = useState<'COPROPIETARIO' | 'PROPIETARIO' | 'ARRENDATARIO' | 'HABITANTE' | 'FAMILIAR' | 'CONTACTO_EMERGENCIA'>('COPROPIETARIO');
  const [editPersonCedula, setEditPersonCedula] = useState('');
  const [editPersonTelefono, setEditPersonTelefono] = useState('');
  const [editPersonEmail, setEditPersonEmail] = useState('');
  const [editPersonObs, setEditPersonObs] = useState('');

  // Stats calculation
  const stats = useMemo(() => {
    const total = properties.length;
    const habitados = properties.filter(p => p.estadoHabitabilidad === 'HABITADO').length;
    const desocupados = properties.filter(p => p.estadoHabitabilidad === 'DESOCUPADO').length;
    const viveDuenio = properties.filter(p => p.tipoOcupante === 'DUEÑO').length;
    const arrendados = properties.filter(p => p.tipoOcupante === 'ARRENDADO').length;
    const conEmail = properties.filter(p => p.propietario?.email && p.propietario.email.trim().length > 0).length;
    const conTelefono = properties.filter(p => p.propietario?.telefono && p.propietario.telefono.trim().length > 0).length;
    const conPropietarioNom = properties.filter(p => p.propietario?.nombre && p.propietario.nombre.trim().length > 0).length;

    const censados = properties.filter(p =>
      Boolean(
        (p.propietario?.nombre && p.propietario.nombre.trim().length > 0) ||
        (p.arrendatario?.nombre && p.arrendatario.nombre.trim().length > 0) ||
        (p.personasAdicionales && p.personasAdicionales.length > 0)
      )
    ).length;

    const pendientesCenso = total - censados;
    const porcentajeCenso = total > 0 ? Math.round((censados / total) * 100) : 0;

    return {
      total,
      habitados,
      desocupados,
      viveDuenio,
      arrendados,
      conEmail,
      conTelefono,
      conPropietarioNom,
      censados,
      pendientesCenso,
      porcentajeCenso,
      porcentajeCompletado: porcentajeCenso
    };
  }, [properties]);

  // Filtered Properties
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      // Search term match
      const term = searchTerm.toLowerCase().trim();
      if (term) {
        const matchCode = p.aptoCode.toLowerCase().includes(term);
        const matchOwnerName = (p.propietario?.nombre || '').toLowerCase().includes(term);
        const matchOwnerCedula = (p.propietario?.cedula || '').toLowerCase().includes(term);
        const matchOwnerPhone = (p.propietario?.telefono || '').toLowerCase().includes(term);
        const matchOwnerEmail = (p.propietario?.email || '').toLowerCase().includes(term);
        const matchTenantName = (p.arrendatario?.nombre || '').toLowerCase().includes(term);
        const matchAdditionalPerson = (p.personasAdicionales || []).some(pers =>
          pers.nombre.toLowerCase().includes(term) ||
          (pers.cedula || '').toLowerCase().includes(term) ||
          (pers.telefono || '').toLowerCase().includes(term) ||
          (pers.email || '').toLowerCase().includes(term)
        );
        if (!matchCode && !matchOwnerName && !matchOwnerCedula && !matchOwnerPhone && !matchOwnerEmail && !matchTenantName && !matchAdditionalPerson) {
          return false;
        }
      }

      // Agrupación match
      if (selectedAgrupacion !== 'TODAS' && p.agrupacion !== selectedAgrupacion) {
        return false;
      }

      // Torre match
      if (selectedTorre !== 'TODAS' && p.torre !== selectedTorre) {
        return false;
      }

      // Piso match
      if (selectedPiso !== 'TODOS' && p.piso !== parseInt(selectedPiso, 10)) {
        return false;
      }

      // Census status helper
      const isCensado = Boolean(
        (p.propietario?.nombre && p.propietario.nombre.trim().length > 0) ||
        (p.arrendatario?.nombre && p.arrendatario.nombre.trim().length > 0) ||
        (p.personasAdicionales && p.personasAdicionales.length > 0)
      );

      // Estado match
      if (selectedEstado === 'CENSADO' && !isCensado) return false;
      if ((selectedEstado === 'PENDIENTE_CENSO' || selectedEstado === 'SIN_PROPIETARIO') && isCensado) return false;
      if (selectedEstado === 'HABITADO' && p.estadoHabitabilidad !== 'HABITADO') return false;
      if (selectedEstado === 'DESOCUPADO' && p.estadoHabitabilidad !== 'DESOCUPADO') return false;
      if (selectedEstado === 'DUENO' && p.tipoOcupante !== 'DUEÑO') return false;
      if (selectedEstado === 'ARRENDADO' && p.tipoOcupante !== 'ARRENDADO') return false;
      if (selectedEstado === 'CON_PROPIETARIO' && (!p.propietario?.nombre || p.propietario.nombre.trim().length === 0)) return false;
      if (selectedEstado === 'CON_EMAIL' && (!p.propietario?.email || p.propietario.email.trim().length === 0)) return false;

      return true;
    });
  }, [properties, searchTerm, selectedAgrupacion, selectedTorre, selectedPiso, selectedEstado]);

  // Handle Save Property Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;

    await onUpdateProperty(editingProperty);
    setEditingProperty(null);
  };

  // Synchronize/Pre-fill from Beneficiaries Censo
  const handleSyncFromBeneficiaries = async () => {
    setIsSyncingWithBens(true);
    try {
      const generated = generateAllPropertiesSector1(beneficiaries);
      
      // Merge generated with existing properties to preserve email/notes already saved
      const existingMap = new Map<string, PropertyRecord>(properties.map(p => [p.aptoCode.toUpperCase(), p]));
      
      const mergedList: PropertyRecord[] = generated.map(gen => {
        const exist = existingMap.get(gen.aptoCode.toUpperCase());
        if (exist) {
          const hasPersonas = exist.personasAdicionales && exist.personasAdicionales.length > 0;
          return {
            ...exist,
            propietario: {
              ...exist.propietario,
              nombre: exist.propietario?.nombre || gen.propietario?.nombre || '',
              cedula: exist.propietario?.cedula || gen.propietario?.cedula || '',
              telefono: exist.propietario?.telefono || gen.propietario?.telefono || ''
            },
            personasAdicionales: hasPersonas ? exist.personasAdicionales : (gen.personasAdicionales || []),
            observaciones: exist.observaciones || gen.observaciones || ''
          };
        }
        return gen;
      });

      if (onBulkUpdateProperties) {
        await onBulkUpdateProperties(mergedList);
      }
      setCopiedNotice('Se actualizó el censo de 600 apartamentos sincronizando con beneficiarios.');
      setTimeout(() => setCopiedNotice(null), 4000);
    } catch (err) {
      console.error('Error syncing:', err);
    } finally {
      setIsSyncingWithBens(false);
    }
  };

  // Helper copy text
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotice(`¡Copiado ${label} al portapapeles!`);
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  // Handler to add an additional person to the currently edited property
  const handleAddPersonToEditingProperty = () => {
    if (!editingProperty) return;
    if (!newPersonNombre.trim()) return;

    const newPerson: PersonRecord = {
      id: `per_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nombre: newPersonNombre.trim(),
      rol: newPersonRol,
      cedula: newPersonCedula.trim(),
      telefono: newPersonTelefono.trim(),
      email: newPersonEmail.trim(),
      observaciones: newPersonObs.trim()
    };

    const currentList = editingProperty.personasAdicionales || [];
    setEditingProperty({
      ...editingProperty,
      personasAdicionales: [...currentList, newPerson]
    });

    // Reset mini form
    setNewPersonNombre('');
    setNewPersonCedula('');
    setNewPersonTelefono('');
    setNewPersonEmail('');
    setNewPersonObs('');
  };

  const handleRemovePersonFromEditingProperty = (personId: string) => {
    if (!editingProperty) return;
    const updatedList = (editingProperty.personasAdicionales || []).filter(p => p.id !== personId);
    setEditingProperty({
      ...editingProperty,
      personasAdicionales: updatedList
    });
    if (editingPersonId === personId) {
      setEditingPersonId(null);
    }
  };

  const handleStartEditPerson = (person: PersonRecord) => {
    setEditingPersonId(person.id);
    setEditPersonNombre(person.nombre);
    setEditPersonRol(person.rol);
    setEditPersonCedula(person.cedula || '');
    setEditPersonTelefono(person.telefono || '');
    setEditPersonEmail(person.email || '');
    setEditPersonObs(person.observaciones || '');
  };

  const handleSavePersonEdit = () => {
    if (!editingProperty || !editingPersonId) return;
    if (!editPersonNombre.trim()) return;

    const updatedList = (editingProperty.personasAdicionales || []).map(p => {
      if (p.id === editingPersonId) {
        return {
          ...p,
          nombre: editPersonNombre.trim(),
          rol: editPersonRol,
          cedula: editPersonCedula.trim(),
          telefono: editPersonTelefono.trim(),
          email: editPersonEmail.trim(),
          observaciones: editPersonObs.trim()
        };
      }
      return p;
    });

    setEditingProperty({
      ...editingProperty,
      personasAdicionales: updatedList
    });

    setEditingPersonId(null);
  };

  // Get recipient email list for comunicados (Including Propietarios and Personas Adicionales)
  const recipientEmails = useMemo(() => {
    const emailSet = new Set<string>();
    filteredProperties.forEach(p => {
      if (p.propietario?.email && p.propietario.email.trim().includes('@')) {
        emailSet.add(p.propietario.email.trim());
      }
      if (p.personasAdicionales) {
        p.personasAdicionales.forEach(pers => {
          if (pers.email && pers.email.trim().includes('@')) {
            emailSet.add(pers.email.trim());
          }
        });
      }
    });
    return Array.from(emailSet);
  }, [filteredProperties]);

  const recipientPhones = useMemo(() => {
    const phoneSet = new Set<string>();
    filteredProperties.forEach(p => {
      if (p.propietario?.telefono && p.propietario.telefono.trim().length >= 7) {
        phoneSet.add(p.propietario.telefono.trim().replace(/[^\d+]/g, ''));
      }
      if (p.arrendatario?.telefono && p.arrendatario.telefono.trim().length >= 7) {
        phoneSet.add(p.arrendatario.telefono.trim().replace(/[^\d+]/g, ''));
      }
      if (p.personasAdicionales) {
        p.personasAdicionales.forEach(pers => {
          if (pers.telefono && pers.telefono.trim().length >= 7) {
            phoneSet.add(pers.telefono.trim().replace(/[^\d+]/g, ''));
          }
        });
      }
    });
    return Array.from(phoneSet);
  }, [filteredProperties]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-900/40 via-purple-900/20 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2.5 bg-indigo-600/30 rounded-xl border border-indigo-500/40 text-indigo-300">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30">
                Base de Datos Aparte • Sector 1
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Censo Oficial de Propietarios
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Registro independiente de apartamentos del Sector 1 (5 Agrupaciones, Torres A-F, 5 Pisos). Permite controlar estado de ocupación, propietarios, arrendatarios y emisión de comunicados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowComunicadosModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-950/50 flex items-center space-x-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>📢 Crear / Enviar Comunicado</span>
            </button>

            <button
              onClick={handleSyncFromBeneficiaries}
              disabled={isSyncingWithBens}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 font-medium text-sm rounded-xl transition-all flex items-center space-x-2 cursor-pointer"
              title="Genera o sincroniza los 600 apartamentos con el censo de beneficiarios existente"
            >
              <RefreshCw className={`w-4 h-4 text-sky-400 ${isSyncingWithBens ? 'animate-spin' : ''}`} />
              <span>Sincronizar 600 Aptos</span>
            </button>

            <button
              onClick={() => exportPropertiesToCSV(filteredProperties)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-medium text-sm rounded-xl transition-all flex items-center space-x-2 cursor-pointer"
              title="Exporta los apartamentos a Excel / CSV"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={handleExportSignaturesDocx}
              disabled={isExportingDocx}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-950/50 flex items-center space-x-2 cursor-pointer border border-indigo-400/30"
              title="Genera un documento Word (.docx) con la lista de apartamentos con dueño para imprimir y firmar"
            >
              <FileText className={`w-4 h-4 text-indigo-200 ${isExportingDocx ? 'animate-bounce' : ''}`} />
              <span>{isExportingDocx ? 'Generando Word...' : '✍️ Planilla Firmas (.docx)'}</span>
            </button>

            {onOpenDevPanel && (
              <button
                onClick={onOpenDevPanel}
                className="px-4 py-2.5 bg-purple-700/90 hover:bg-purple-600 active:bg-purple-800 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-purple-950/50 flex items-center space-x-2 cursor-pointer border border-purple-400/40"
                title="Abrir panel de mantenimiento para pasar datos de Desarrollo a Producción"
              >
                <UploadCloud className="w-4 h-4 text-purple-200" />
                <span>🚀 Pasar a Producción</span>
              </button>
            )}
          </div>
        </div>

        {/* Copy Notice Alert */}
        {copiedNotice && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{copiedNotice}</span>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          {/* Card 1 & 2: Censados Progress */}
          <div className="bg-emerald-950/50 border border-emerald-500/40 p-3 rounded-xl col-span-2 sm:col-span-2 lg:col-span-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Apartamentos Censados
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl font-black text-white">{stats.censados}</span>
                  <span className="text-xs text-emerald-200/80 font-semibold">de {stats.total} Aptos</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-emerald-400">{stats.porcentajeCenso}%</span>
                <span className="text-[10px] text-emerald-200/80 block font-medium">Avance Censo</span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-800/80 h-2 rounded-full mt-2.5 overflow-hidden border border-emerald-500/20">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${stats.porcentajeCenso}%` }} 
              />
            </div>
          </div>

          {/* Card 3: Pendientes por Censar */}
          <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl col-span-1">
            <span className="text-amber-300 text-xs font-bold uppercase tracking-wider block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Pendientes
            </span>
            <span className="text-2xl font-black text-amber-200 mt-1 block">{stats.pendientesCenso}</span>
            <span className="text-[10px] text-amber-300/80 block mt-0.5 font-medium">Sin datos en censo</span>
          </div>

          {/* Card 4: Habitados / Desocupados */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl col-span-1">
            <span className="text-slate-400 text-xs font-medium block">Habitados / Vacíos</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-xl font-bold text-emerald-300">{stats.habitados}</span>
              <span className="text-xs text-slate-500">/</span>
              <span className="text-sm font-semibold text-slate-400">{stats.desocupados}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">{stats.total > 0 ? Math.round((stats.habitados/stats.total)*100) : 0}% ocupación</span>
          </div>

          {/* Card 5: Vive Dueño / Arrendado */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl col-span-1">
            <span className="text-indigo-400 text-xs font-medium block">Dueño / Arrendado</span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-xl font-bold text-indigo-300">{stats.viveDuenio}</span>
              <span className="text-xs text-slate-500">/</span>
              <span className="text-sm font-semibold text-amber-300">{stats.arrendados}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Propietario vs Alquiler</span>
          </div>

          {/* Card 6: Con Correo / Teléfono */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl col-span-1">
            <span className="text-purple-400 text-xs font-medium block">Con Correo / Tel.</span>
            <span className="text-xl font-bold text-purple-300">{stats.conEmail} / {stats.conTelefono}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Datos comunicados</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-4">
        {/* Quick Filter Pill Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filtro Rápido Censo:
          </span>

          <button
            onClick={() => setSelectedEstado('TODOS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedEstado === 'TODOS'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({stats.total})
          </button>

          <button
            onClick={() => setSelectedEstado('CENSADO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedEstado === 'CENSADO'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Censados ({stats.censados})
          </button>

          <button
            onClick={() => setSelectedEstado('PENDIENTE_CENSO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedEstado === 'PENDIENTE_CENSO' || selectedEstado === 'SIN_PROPIETARIO'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Pendientes por Censar ({stats.pendientesCenso})
          </button>

          <button
            onClick={() => setSelectedEstado('DUENO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedEstado === 'DUENO'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60'
            }`}
          >
            🏠 Vive Dueño ({stats.viveDuenio})
          </button>

          <button
            onClick={() => setSelectedEstado('ARRENDADO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedEstado === 'ARRENDADO'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60'
            }`}
          >
            🔑 Arrendados ({stats.arrendados})
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          {/* Search Bar */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por apto (ej: 2E42), dueño, cédula, tel..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Agrupación */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-500 font-medium">Agrupación:</span>
              <select
                value={selectedAgrupacion}
                onChange={e => setSelectedAgrupacion(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="TODAS">Todas (1 a 5)</option>
                <option value="Agrupación 1">Agrupación 1</option>
                <option value="Agrupación 2">Agrupación 2</option>
                <option value="Agrupación 3">Agrupación 3</option>
                <option value="Agrupación 4">Agrupación 4</option>
                <option value="Agrupación 5">Agrupación 5</option>
              </select>
            </div>

            {/* Torre */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-500 font-medium">Torre:</span>
              <select
                value={selectedTorre}
                onChange={e => setSelectedTorre(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="TODAS">Todas (A..F)</option>
                <option value="Torre A">Torre A</option>
                <option value="Torre B">Torre B</option>
                <option value="Torre C">Torre C</option>
                <option value="Torre D">Torre D</option>
                <option value="Torre E">Torre E</option>
                <option value="Torre F">Torre F</option>
              </select>
            </div>

            {/* Piso */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-500 font-medium">Piso:</span>
              <select
                value={selectedPiso}
                onChange={e => setSelectedPiso(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="TODOS">Todos (1..5)</option>
                <option value="1">Piso 1</option>
                <option value="2">Piso 2</option>
                <option value="3">Piso 3</option>
                <option value="4">Piso 4</option>
                <option value="5">Piso 5</option>
              </select>
            </div>

            {/* Estado */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-500 font-medium">Estado:</span>
              <select
                value={selectedEstado}
                onChange={e => setSelectedEstado(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="TODOS">Todos</option>
                <option value="CENSADO">✅ Censados ({stats.censados})</option>
                <option value="PENDIENTE_CENSO">⏳ Pendientes de Censo ({stats.pendientesCenso})</option>
                <option value="HABITADO">🟢 Habitados</option>
                <option value="DESOCUPADO">⚪ Desocupados</option>
                <option value="DUENO">🏠 Vive el Dueño</option>
                <option value="ARRENDADO">🔑 Arrendados</option>
                <option value="CON_EMAIL">📧 Con Correo Electrónico</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                  viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista cuadrícula de aptos"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Matriz</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                  viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista tabla detallada"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabla</span>
              </button>
            </div>
          </div>
        </div>

        {/* Counter Results */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Mostrando <strong>{filteredProperties.length}</strong> de <strong>{properties.length}</strong> apartamentos.
          </span>

          {(selectedAgrupacion !== 'TODAS' || selectedTorre !== 'TODAS' || selectedPiso !== 'TODOS' || selectedEstado !== 'TODOS' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedAgrupacion('TODAS');
                setSelectedTorre('TODAS');
                setSelectedPiso('TODOS');
                setSelectedEstado('TODOS');
                setSearchTerm('');
              }}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Content Display */}
      {viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProperties.map(p => {
            const isHabitado = p.estadoHabitabilidad === 'HABITADO';
            const isArrendado = p.tipoOcupante === 'ARRENDADO';
            const isDueño = p.tipoOcupante === 'DUEÑO';
            const hasOwnerName = Boolean(p.propietario?.nombre && p.propietario.nombre.trim().length > 0);
            const isCensado = Boolean(
              hasOwnerName ||
              (p.arrendatario?.nombre && p.arrendatario.nombre.trim().length > 0) ||
              (p.personasAdicionales && p.personasAdicionales.length > 0)
            );

            return (
              <div
                key={p.id}
                onClick={() => setEditingProperty(p)}
                className={`group rounded-xl border p-3.5 transition-all cursor-pointer relative hover:shadow-md ${
                  !isHabitado
                    ? 'bg-slate-50 border-slate-200/80 text-slate-500'
                    : isArrendado
                    ? 'bg-amber-50/40 border-amber-200/80 hover:border-amber-400'
                    : 'bg-white border-slate-200 hover:border-indigo-400'
                }`}
              >
                {/* Header Code and Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                      {p.aptoCode}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Piso {p.piso}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Census Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        isCensado
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/60'
                          : 'bg-amber-100 text-amber-800 border border-amber-300/60'
                      }`}
                      title={isCensado ? "Apartamento Censado" : "Pendiente por Censar"}
                    >
                      {isCensado ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Censado</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Sin Censar</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Subtitle location */}
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span>{p.agrupacion} • {p.torre}</span>
                  <span className={`font-semibold ${isArrendado ? 'text-amber-700' : isDueño ? 'text-indigo-700' : 'text-slate-400'}`}>
                    {p.tipoOcupante === 'DUEÑO' ? '🏠 Vive Dueño' : p.tipoOcupante === 'ARRENDADO' ? '🔑 Arrendado' : '⚪ Desocupado'}
                  </span>
                </div>

                {/* Owner Information */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Propietario</span>
                    <button className="text-slate-300 group-hover:text-indigo-600 transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {hasOwnerName ? (
                    <div>
                      <p className="text-xs font-bold text-slate-800 truncate" title={p.propietario.nombre}>
                        {p.propietario.nombre}
                      </p>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                        {p.propietario.cedula && <span>C.C. {p.propietario.cedula}</span>}
                        {p.propietario.telefono && (
                          <span className="flex items-center text-slate-600 font-medium">
                            <Phone className="w-3 h-3 mr-0.5 text-slate-400" />
                            {p.propietario.telefono}
                          </span>
                        )}
                      </div>
                      {p.propietario.email && (
                        <p className="text-[10px] text-indigo-600 font-medium truncate mt-0.5 flex items-center">
                          <Mail className="w-3 h-3 mr-1 flex-shrink-0 text-indigo-400" />
                          {p.propietario.email}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic font-medium flex items-center">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 mr-1 flex-shrink-0" />
                      Sin registrar (Clic para editar)
                    </p>
                  )}

                  {/* Tenant info if rented */}
                  {isArrendado && p.arrendatario?.nombre && (
                    <div className="pt-2 border-t border-amber-100 mt-2">
                      <span className="text-[10px] uppercase tracking-wider text-amber-700 font-bold block">Arrendatario</span>
                      <p className="text-xs font-semibold text-slate-700 truncate">{p.arrendatario.nombre}</p>
                      {p.arrendatario.telefono && (
                        <span className="text-[10px] text-slate-500 block">Tel: {p.arrendatario.telefono}</span>
                      )}
                    </div>
                  )}

                  {/* Additional registered persons badge if any */}
                  {p.personasAdicionales && p.personasAdicionales.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 mt-2">
                      <span className="text-[10px] uppercase tracking-wider text-purple-700 font-bold flex items-center">
                        <Users className="w-3 h-3 mr-1 text-purple-600" />
                        {p.personasAdicionales.length} {p.personasAdicionales.length === 1 ? 'Persona adicional' : 'Personas adicionales'}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {p.personasAdicionales.slice(0, 2).map((per, idx) => (
                          <p key={idx} className="text-[11px] text-slate-700 font-medium truncate">
                            • {per.nombre} <span className="text-[10px] text-purple-600 font-semibold">({per.rol})</span>
                          </p>
                        ))}
                        {p.personasAdicionales.length > 2 && (
                          <p className="text-[10px] text-slate-400 italic">
                            +{p.personasAdicionales.length - 2} persona(s) más
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Apto</th>
                  <th className="py-3.5 px-4">Ubicación</th>
                  <th className="py-3.5 px-4">Estado Censo</th>
                  <th className="py-3.5 px-4">Habitabilidad</th>
                  <th className="py-3.5 px-4">Ocupación</th>
                  <th className="py-3.5 px-4">Propietario Principal</th>
                  <th className="py-3.5 px-4">Contacto Propietario</th>
                  <th className="py-3.5 px-4">Arrendatario</th>
                  <th className="py-3.5 px-4">Otras Personas</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProperties.map(p => {
                  const isCensado = Boolean(
                    (p.propietario?.nombre && p.propietario.nombre.trim().length > 0) ||
                    (p.arrendatario?.nombre && p.arrendatario.nombre.trim().length > 0) ||
                    (p.personasAdicionales && p.personasAdicionales.length > 0)
                  );

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                        {p.aptoCode}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.agrupacion} • {p.torre} (Piso {p.piso})
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-max ${
                          isCensado
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/60'
                            : 'bg-amber-100 text-amber-800 border border-amber-300/60'
                        }`}>
                          {isCensado ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Censado</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Sin Censar</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.estadoHabitabilidad === 'HABITADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {p.estadoHabitabilidad}
                        </span>
                      </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {p.tipoOcupante === 'DUEÑO' ? '🏠 Vive Dueño' : p.tipoOcupante === 'ARRENDADO' ? '🔑 Arrendado' : '⚪ Desocupado'}
                    </td>
                    <td className="py-3 px-4">
                      {p.propietario?.nombre ? (
                        <div>
                          <p className="font-bold text-slate-800">{p.propietario.nombre}</p>
                          <p className="text-[10px] text-slate-500">C.C. {p.propietario.cedula || 'N/A'}</p>
                        </div>
                      ) : (
                        <span className="text-amber-600 italic">Sin datos</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        {p.propietario?.telefono && <p className="text-slate-700 font-medium">📞 {p.propietario.telefono}</p>}
                        {p.propietario?.email && <p className="text-indigo-600 font-medium">📧 {p.propietario.email}</p>}
                        {!p.propietario?.telefono && !p.propietario?.email && <span className="text-slate-400">-</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.tipoOcupante === 'ARRENDADO' && p.arrendatario?.nombre ? (
                        <div>
                          <p className="font-semibold text-slate-800">{p.arrendatario.nombre}</p>
                          <p className="text-[10px] text-slate-500">{p.arrendatario.telefono}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.personasAdicionales && p.personasAdicionales.length > 0 ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 font-bold text-[11px] rounded-lg inline-flex items-center">
                          <Users className="w-3 h-3 mr-1 text-purple-600" />
                          {p.personasAdicionales.length} persona(s)
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setEditingProperty(p)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT PROPERTY MODAL */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header (Fixed) */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-600 rounded-xl text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    Editar Apto {editingProperty.aptoCode}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingProperty.agrupacion} • {editingProperty.torre} • Piso {editingProperty.piso}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProperty(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Container */}
            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                  {/* LEFT COLUMN: Main Property & Owner Data */}
                  <div className="lg:col-span-6 space-y-3.5">
                    {/* Status Toggles */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Estado Ocupación
                        </label>
                        <select
                          value={editingProperty.estadoHabitabilidad}
                          onChange={e => setEditingProperty({
                            ...editingProperty,
                            estadoHabitabilidad: e.target.value as 'HABITADO' | 'DESOCUPADO',
                            tipoOcupante: e.target.value === 'DESOCUPADO' ? 'DESOCUPADO' : editingProperty.tipoOcupante
                          })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="HABITADO">🟢 HABITADO</option>
                          <option value="DESOCUPADO">⚪ DESOCUPADO</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Tipo Ocupante
                        </label>
                        <select
                          value={editingProperty.tipoOcupante}
                          onChange={e => setEditingProperty({
                            ...editingProperty,
                            tipoOcupante: e.target.value as 'DUEÑO' | 'ARRENDADO' | 'DESOCUPADO' | 'OTRO',
                            estadoHabitabilidad: e.target.value === 'DESOCUPADO' ? 'DESOCUPADO' : 'HABITADO'
                          })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="DUEÑO">🏠 Vive el Dueño</option>
                          <option value="ARRENDADO">🔑 Arrendado</option>
                          <option value="DESOCUPADO">⚪ Desocupado</option>
                          <option value="OTRO">📌 Otro</option>
                        </select>
                      </div>
                    </div>

                    {/* Owner Information */}
                    <div className="border border-indigo-100 rounded-xl p-3 bg-indigo-50/20 space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center">
                        <UserCheck className="w-4 h-4 mr-1.5 text-indigo-600" />
                        Propietario Principal (Titular)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nombre Completo *</label>
                          <input
                            type="text"
                            placeholder="Ej: Shirley Lourido Blandón"
                            value={editingProperty.propietario?.nombre || ''}
                            onChange={e => setEditingProperty({
                              ...editingProperty,
                              propietario: {
                                ...editingProperty.propietario,
                                nombre: e.target.value
                              }
                            })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Cédula / Documento</label>
                          <input
                            type="text"
                            placeholder="Ej: 38889600"
                            value={editingProperty.propietario?.cedula || ''}
                            onChange={e => setEditingProperty({
                              ...editingProperty,
                              propietario: {
                                ...editingProperty.propietario,
                                cedula: e.target.value
                              }
                            })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Teléfono / Celular</label>
                          <input
                            type="text"
                            placeholder="Ej: 3107385071"
                            value={editingProperty.propietario?.telefono || ''}
                            onChange={e => setEditingProperty({
                              ...editingProperty,
                              propietario: {
                                ...editingProperty.propietario,
                                telefono: e.target.value
                              }
                            })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Correo Electrónico (Email)</label>
                          <input
                            type="email"
                            placeholder="propietario@gmail.com"
                            value={editingProperty.propietario?.email || ''}
                            onChange={e => setEditingProperty({
                              ...editingProperty,
                              propietario: {
                                ...editingProperty.propietario,
                                email: e.target.value
                              }
                            })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tenant Information if Arrendado */}
                    {editingProperty.tipoOcupante === 'ARRENDADO' && (
                      <div className="border border-amber-200 rounded-xl p-3 bg-amber-50/40 space-y-2.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center">
                          <Key className="w-4 h-4 mr-1.5 text-amber-600" />
                          Datos del Arrendatario (Inquilino)
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nombre Arrendatario</label>
                            <input
                              type="text"
                              placeholder="Nombre inquilino"
                              value={editingProperty.arrendatario?.nombre || ''}
                              onChange={e => setEditingProperty({
                                ...editingProperty,
                                arrendatario: {
                                  ...editingProperty.arrendatario,
                                  nombre: e.target.value,
                                  telefono: editingProperty.arrendatario?.telefono || ''
                                }
                              })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Teléfono Inquilino</label>
                            <input
                              type="text"
                              placeholder="Ej: 3125550000"
                              value={editingProperty.arrendatario?.telefono || ''}
                              onChange={e => setEditingProperty({
                                ...editingProperty,
                                arrendatario: {
                                  ...editingProperty.arrendatario,
                                  nombre: editingProperty.arrendatario?.nombre || '',
                                  telefono: e.target.value
                                }
                              })}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Observaciones */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-0.5">Observaciones / Notas de Comunicación</label>
                      <textarea
                        rows={2}
                        placeholder="Ej: Pendiente confirmar copia de cédula, entrega recibos, etc."
                        value={editingProperty.observaciones || ''}
                        onChange={e => setEditingProperty({ ...editingProperty, observaciones: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Additional Persons / Co-owners */}
                  <div className="lg:col-span-6 border border-purple-200 rounded-xl p-3.5 bg-purple-50/30 space-y-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center">
                          <Users className="w-4 h-4 mr-1.5 text-purple-600" />
                          Otras Personas / Copropietarios ({editingProperty.personasAdicionales?.length || 0})
                        </h4>
                        <span className="text-[10px] text-purple-700 font-medium">
                          Convivientes y copropietarios
                        </span>
                      </div>

                      {/* Scrollable list of existing registered additional persons */}
                      {editingProperty.personasAdicionales && editingProperty.personasAdicionales.length > 0 ? (
                        <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                          {editingProperty.personasAdicionales.map(person => {
                            const isEditingThis = editingPersonId === person.id;
                            if (isEditingThis) {
                              return (
                                <div key={person.id} className="bg-purple-100/80 p-3 rounded-xl border border-purple-300 space-y-2 shadow-sm animate-in fade-in duration-100">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-purple-900 flex items-center">
                                      <Edit3 className="w-3.5 h-3.5 mr-1 text-purple-700" />
                                      Modificar Datos de Persona
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setEditingPersonId(null)}
                                      className="text-slate-400 hover:text-slate-600 p-0.5"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="sm:col-span-2">
                                      <label className="block text-[10px] font-semibold text-purple-900 mb-0.5">Nombre Completo *</label>
                                      <input
                                        type="text"
                                        value={editPersonNombre}
                                        onChange={e => setEditPersonNombre(e.target.value)}
                                        className="w-full px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-semibold text-purple-900 mb-0.5">Rol / Vinculación</label>
                                      <select
                                        value={editPersonRol}
                                        onChange={e => setEditPersonRol(e.target.value as any)}
                                        className="w-full px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500"
                                      >
                                        <option value="COPROPIETARIO">🏢 Copropietario(a)</option>
                                        <option value="PROPIETARIO">🏠 Propietario(a)</option>
                                        <option value="FAMILIAR">👨‍👩‍👧 Familiar / Residente</option>
                                        <option value="ARRENDATARIO">🔑 Arrendatario / Inquilino</option>
                                        <option value="HABITANTE">👤 Habitante</option>
                                        <option value="CONTACTO_EMERGENCIA">🚨 Emergencia</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-semibold text-purple-900 mb-0.5">Cédula / Documento</label>
                                      <input
                                        type="text"
                                        value={editPersonCedula}
                                        onChange={e => setEditPersonCedula(e.target.value)}
                                        className="w-full px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-semibold text-purple-900 mb-0.5">Teléfono / Celular</label>
                                      <input
                                        type="text"
                                        value={editPersonTelefono}
                                        onChange={e => setEditPersonTelefono(e.target.value)}
                                        className="w-full px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-semibold text-purple-900 mb-0.5">Correo (Email)</label>
                                      <input
                                        type="email"
                                        value={editPersonEmail}
                                        onChange={e => setEditPersonEmail(e.target.value)}
                                        className="w-full px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                                      />
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className="block text-[10px] font-semibold text-purple-900 mb-0.5">Observaciones</label>
                                      <input
                                        type="text"
                                        placeholder="Notas adicionales..."
                                        value={editPersonObs}
                                        onChange={e => setEditPersonObs(e.target.value)}
                                        className="w-full px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-end space-x-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingPersonId(null)}
                                      className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      disabled={!editPersonNombre.trim()}
                                      onClick={handleSavePersonEdit}
                                      className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Guardar Cambios</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div key={person.id} className="bg-white p-2.5 rounded-xl border border-purple-200 flex items-start justify-between shadow-xs hover:border-purple-300 transition-colors">
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-xs text-slate-900">{person.nombre}</span>
                                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                                      {person.rol}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-600 mt-0.5">
                                    {person.cedula && <span>C.C. {person.cedula}</span>}
                                    {person.telefono && <span className="font-semibold text-slate-800">📞 {person.telefono}</span>}
                                    {person.email && <span className="text-indigo-600 font-medium">📧 {person.email}</span>}
                                  </div>
                                  {person.observaciones && (
                                    <p className="text-[10px] text-slate-400 italic mt-0.5">{person.observaciones}</p>
                                  )}
                                </div>

                                <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditPerson(person)}
                                    className="p-1 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                    title="Editar datos de esta persona"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePersonFromEditingProperty(person.id)}
                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Eliminar esta persona"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic bg-white p-2.5 rounded-xl border border-dashed border-purple-200 text-center">
                          No hay otras personas registradas para este apto.
                        </p>
                      )}
                    </div>

                    {/* Sub-form to add a new person */}
                    <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-2.5 mt-auto">
                      <h5 className="text-xs font-bold text-purple-900 flex items-center">
                        <UserPlus className="w-3.5 h-3.5 mr-1 text-purple-600" />
                        Agregar Persona / Copropietario
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Nombre Completo *</label>
                          <input
                            type="text"
                            placeholder="Ej: María Elena Blandón"
                            value={newPersonNombre}
                            onChange={e => setNewPersonNombre(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Rol / Vinculación</label>
                          <select
                            value={newPersonRol}
                            onChange={e => setNewPersonRol(e.target.value as any)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="COPROPIETARIO">🏢 Copropietario(a)</option>
                            <option value="PROPIETARIO">🏠 Propietario(a)</option>
                            <option value="FAMILIAR">👨‍👩‍👧 Familiar / Residente</option>
                            <option value="ARRENDATARIO">🔑 Arrendatario / Inquilino</option>
                            <option value="HABITANTE">👤 Habitante</option>
                            <option value="CONTACTO_EMERGENCIA">🚨 Emergencia</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Cédula / Documento</label>
                          <input
                            type="text"
                            placeholder="Cédula"
                            value={newPersonCedula}
                            onChange={e => setNewPersonCedula(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Teléfono / Celular</label>
                          <input
                            type="text"
                            placeholder="Ej: 3150000000"
                            value={newPersonTelefono}
                            onChange={e => setNewPersonTelefono(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Correo (Email)</label>
                          <input
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={newPersonEmail}
                            onChange={e => setNewPersonEmail(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-0.5">
                        <button
                          type="button"
                          disabled={!newPersonNombre.trim()}
                          onClick={handleAddPersonToEditingProperty}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:bg-slate-200 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Agregar Persona</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer (Fixed Action Buttons Always Visible) */}
              <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-end space-x-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-indigo-900/30 cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMUNICADOS / NOTIFICACIONES MODAL */}
      {showComunicadosModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-600/50 rounded-xl text-white border border-indigo-400/40">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    Generador de Comunicados y Notificaciones
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Exporta listas de correo (BCC) y teléfonos de propietarios para avisos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowComunicadosModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-indigo-800/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Recipient Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 block font-medium">Destinatarios Seleccionados</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {filteredProperties.length} Apartamentos filtrados ({selectedAgrupacion}, {selectedTorre})
                  </p>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="px-3 py-1.5 bg-indigo-100 text-indigo-800 font-bold rounded-lg flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                    {recipientEmails.length} Correos
                  </span>
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold rounded-lg flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    {recipientPhones.length} Teléfonos
                  </span>
                </div>
              </div>

              {/* Copy Email List Option */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      1. Difusión por Correo Electrónico (BCC / CCO)
                    </h4>
                  </div>
                  <button
                    disabled={recipientEmails.length === 0}
                    onClick={() => copyToClipboard(recipientEmails.join('; '), 'Correos de Propietarios')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Todos los Correos</span>
                  </button>
                </div>

                {recipientEmails.length > 0 ? (
                  <textarea
                    readOnly
                    rows={2}
                    value={recipientEmails.join('; ')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-none"
                  />
                ) : (
                  <p className="text-xs text-amber-600 italic bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    ⚠️ No hay correos registrados en los apartamentos de este filtro. Edite los apartamentos para agregar los emails de los propietarios.
                  </p>
                )}
              </div>

              {/* Copy Phone List for WhatsApp */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      2. Difusión por WhatsApp / Mensajería
                    </h4>
                  </div>
                  <button
                    disabled={recipientPhones.length === 0}
                    onClick={() => copyToClipboard(recipientPhones.join(', '), 'Teléfonos de Propietarios')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Todos los Teléfonos</span>
                  </button>
                </div>

                {recipientPhones.length > 0 ? (
                  <textarea
                    readOnly
                    rows={2}
                    value={recipientPhones.join(', ')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-none"
                  />
                ) : (
                  <p className="text-xs text-slate-500 italic">Sin teléfonos registrados en este filtro.</p>
                )}
              </div>

              {/* Comunicado Template Creator */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1.5 text-purple-600" />
                  3. Plantilla de Comunicado Notificatorio
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Asunto del Comunicado</label>
                    <input
                      type="text"
                      value={comunicadoAsunto}
                      onChange={e => setComunicadoAsunto(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Cuerpo del Mensaje</label>
                    <textarea
                      rows={3}
                      value={comunicadoDetalle}
                      onChange={e => setComunicadoDetalle(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        const fullText = `ASUNTO: ${comunicadoAsunto}\n\n${comunicadoDetalle}\n\nAtentamente,\nJunta Directiva / Administración Sector 1 - Chiminangos`;
                        copyToClipboard(fullText, 'Texto del Comunicado');
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-purple-400" />
                      <span>Copiar Texto Completo del Comunicado</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowComunicadosModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
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
