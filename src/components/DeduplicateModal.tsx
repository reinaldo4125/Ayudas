import React, { useState, useEffect } from 'react';
import { UserCheck, X, CheckCircle2, AlertTriangle, User, Phone, MapPin, Users, FileText, PackageCheck, Layers } from 'lucide-react';
import { Beneficiary, DeliveryRecord } from '../types';

interface DeduplicateGroupState {
  cedulaKey: string;
  originalRecords: Beneficiary[];
  selectedMasterId: string;
  editedNombre: string;
  editedCedula: string;
  editedDireccion: string;
  editedSector: string;
  editedAgrupacion: string;
  editedTelefono: string;
  editedIntegrantes: number;
  editedObservaciones: string;
  allDeliveries: DeliveryRecord[];
}

interface DeduplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  beneficiaries: Beneficiary[];
  onConfirmDeduplication: (finalBeneficiariesList: Beneficiary[]) => void;
}

export const DeduplicateModal: React.FC<DeduplicateModalProps> = ({
  isOpen,
  onClose,
  beneficiaries,
  onConfirmDeduplication
}) => {
  const [groupsState, setGroupsState] = useState<DeduplicateGroupState[]>([]);

  // Detect and prepare duplicate groups whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    const mapByCedula = new Map<string, Beneficiary[]>();

    beneficiaries.forEach(b => {
      const cleanCed = (b.cedula || '').trim().replace(/[^\d]/g, '');
      if (cleanCed && cleanCed !== '0' && b.cedula !== 'S/N' && b.cedula !== 'SN') {
        const existing = mapByCedula.get(cleanCed) || [];
        existing.push(b);
        mapByCedula.set(cleanCed, existing);
      }
    });

    const preparedGroups: DeduplicateGroupState[] = [];

    mapByCedula.forEach((records, cedulaKey) => {
      if (records.length >= 2) {
        // Pick best master record
        const master = records.find(r => r.telefono && r.telefono !== 'Sin teléfono' && r.telefono.trim() !== '') || records[0];
        const bestPhone = records.map(r => r.telefono).find(t => t && t !== 'Sin teléfono' && t.trim() !== '') || master.telefono || '';
        const bestDir = records.map(r => r.direccion).find(d => d && d !== 'Usuario Externo' && d.trim() !== '') || master.direccion || '';
        const bestName = records.map(r => r.nombre).find(n => n && n.trim() !== '' && n !== 'Beneficiario') || master.nombre;

        // Combine all delivery histories without duplicate delivery IDs
        const combinedDeliveriesMap = new Map<string, DeliveryRecord>();
        records.forEach(r => {
          (r.historialEntregas || []).forEach(del => {
            combinedDeliveriesMap.set(del.id, del);
          });
        });

        const allDeliveries = Array.from(combinedDeliveriesMap.values());
        const maxIntegrantes = Math.max(...records.map(r => r.integrantesHogar || 0));

        preparedGroups.push({
          cedulaKey,
          originalRecords: records,
          selectedMasterId: master.id,
          editedNombre: bestName,
          editedCedula: master.cedula || cedulaKey,
          editedDireccion: bestDir,
          editedSector: master.sector || 'Sector 1',
          editedAgrupacion: master.agrupacion || 'Sector General',
          editedTelefono: bestPhone,
          editedIntegrantes: maxIntegrantes > 0 ? maxIntegrantes : 3,
          editedObservaciones: records.map(r => r.observaciones).filter(Boolean).join(' | ') || '',
          allDeliveries
        });
      }
    });

    setGroupsState(preparedGroups);
  }, [isOpen, beneficiaries]);

  if (!isOpen) return null;

  const handleSelectMaster = (groupIndex: number, masterId: string) => {
    setGroupsState(prev => {
      const next = [...prev];
      const g = { ...next[groupIndex] };
      const selectedMaster = g.originalRecords.find(r => r.id === masterId);
      if (selectedMaster) {
        g.selectedMasterId = masterId;
        g.editedNombre = selectedMaster.nombre || g.editedNombre;
        g.editedCedula = selectedMaster.cedula || g.editedCedula;
        g.editedDireccion = selectedMaster.direccion || g.editedDireccion;
        g.editedSector = selectedMaster.sector || g.editedSector;
        g.editedAgrupacion = selectedMaster.agrupacion || g.editedAgrupacion;
        g.editedTelefono = selectedMaster.telefono || g.editedTelefono;
      }
      next[groupIndex] = g;
      return next;
    });
  };

  const handleUpdateGroupField = (groupIndex: number, field: keyof DeduplicateGroupState, value: any) => {
    setGroupsState(prev => {
      const next = [...prev];
      next[groupIndex] = {
        ...next[groupIndex],
        [field]: value
      };
      return next;
    });
  };

  const handleConfirmAll = () => {
    // Set of IDs being unmapped/replaced
    const duplicateIdsToRemove = new Set<string>();
    const unifiedBeneficiariesMap = new Map<string, Beneficiary>();

    groupsState.forEach(group => {
      group.originalRecords.forEach(r => duplicateIdsToRemove.add(r.id));

      const master = group.originalRecords.find(r => r.id === group.selectedMasterId) || group.originalRecords[0];
      const isDelivered = group.originalRecords.some(r => r.estadoEntrega === 'ENTREGADO') || group.allDeliveries.length > 0;
      const latestFecha = group.allDeliveries.map(d => d.fecha).filter(Boolean).sort().pop();

      const mergedBen: Beneficiary = {
        ...master,
        nombre: group.editedNombre.trim() || master.nombre,
        cedula: group.editedCedula.trim() || master.cedula,
        direccion: group.editedDireccion.trim() || master.direccion,
        sector: group.editedSector || master.sector || 'Sector 1',
        agrupacion: group.editedAgrupacion || master.agrupacion || 'Sector General',
        telefono: group.editedTelefono.trim() || 'Sin teléfono',
        integrantesHogar: Number(group.editedIntegrantes) || 3,
        observaciones: group.editedObservaciones.trim() || undefined,
        censoActualizado: true,
        estadoEntrega: isDelivered ? 'ENTREGADO' : 'PENDIENTE',
        fechaUltimaEntrega: latestFecha || master.fechaUltimaEntrega,
        historialEntregas: group.allDeliveries
      };

      unifiedBeneficiariesMap.set(mergedBen.id, mergedBen);
    });

    // Build final beneficiaries list
    const finalList: Beneficiary[] = [];

    beneficiaries.forEach(b => {
      if (!duplicateIdsToRemove.has(b.id)) {
        finalList.push(b);
      }
    });

    // Append unified master beneficiaries
    unifiedBeneficiariesMap.forEach(unified => {
      finalList.push(unified);
    });

    // Sort by 'no' ascending
    finalList.sort((a, b) => (a.no || 0) - (b.no || 0));

    onConfirmDeduplication(finalList);
    onClose();
  };

  const totalDuplicatesCount = groupsState.reduce((sum, g) => sum + (g.originalRecords.length - 1), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <UserCheck className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">Unificación y Depuración de Registros Duplicados</h3>
              <p className="text-xs text-amber-100/90 mt-0.5">
                Se encontraron <strong className="text-white font-bold">{groupsState.length} grupo(s) de duplicados</strong> (afectando a <strong className="text-white font-bold">{totalDuplicatesCount} registro(s) repetidos</strong>). Revisa y edita los datos antes de unificar.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-amber-100 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content / Group List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-slate-50/50">
          {groupsState.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-slate-800">¡No hay registros duplicados por cédula!</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Todos los beneficiarios en la base de datos cuentan con cédulas únicas o están clasificados como sin cédula (S/N).
              </p>
            </div>
          ) : (
            groupsState.map((group, groupIdx) => (
              <div key={group.cedulaKey} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                
                {/* Group Header */}
                <div className="bg-amber-50/80 px-6 py-3 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-amber-600 text-white font-black text-xs rounded-lg">
                      Grupo #{groupIdx + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      Cédula / Doc: <code className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-bold text-xs">{group.cedulaKey}</code>
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-200/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-amber-700" />
                    {group.originalRecords.length} Registros repetidos
                  </span>
                </div>

                {/* Grid Layout: Left (Duplicates) & Right (Edit Result) */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Duplicate Entries to Merge */}
                  <div className="lg:col-span-5 space-y-3 border-r border-slate-100 pr-0 lg:pr-6">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-600" />
                      Registros Duplicados Encontrados:
                    </h4>
                    
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {group.originalRecords.map((record) => {
                        const isSelected = group.selectedMasterId === record.id;
                        return (
                          <div
                            key={record.id}
                            onClick={() => handleSelectMaster(groupIdx, record.id)}
                            className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/30 shadow-sm'
                                : 'bg-slate-50/80 border-slate-200 hover:border-amber-300 hover:bg-slate-100/80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-extrabold text-slate-900 text-sm">
                                  #{record.no} - {record.nombre}
                                </span>
                                <p className="text-slate-500 font-medium text-[11px] mt-0.5 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  {record.direccion} ({record.sector || 'Sector 1'})
                                </p>
                              </div>
                              <input
                                type="radio"
                                name={`master-${group.cedulaKey}`}
                                checked={isSelected}
                                onChange={() => handleSelectMaster(groupIdx, record.id)}
                                className="mt-1 text-amber-600 focus:ring-amber-500 cursor-pointer"
                              />
                            </div>

                            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                              <span>Tel: <strong>{record.telefono || 'S/N'}</strong></span>
                              <span>Habitantes: <strong>{record.integrantesHogar || 3}</strong></span>
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                record.estadoEntrega === 'ENTREGADO' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {record.estadoEntrega}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Editable Merged Result */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Resultado Unificado (Puedes corregir los datos):
                      </h4>
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                        <PackageCheck className="w-3 h-3" />
                        {group.allDeliveries.length} entregas unificadas
                      </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      
                      {/* Name & Document */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre Completo</label>
                          <div className="relative">
                            <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                              type="text"
                              value={group.editedNombre}
                              onChange={(e) => handleUpdateGroupField(groupIdx, 'editedNombre', e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              placeholder="Nombre del beneficiario"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Cédula / Documento</label>
                          <input
                            type="text"
                            value={group.editedCedula}
                            onChange={(e) => handleUpdateGroupField(groupIdx, 'editedCedula', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
                            placeholder="Número de cédula"
                          />
                        </div>
                      </div>

                      {/* Address & Sector */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Dirección / Apartamento</label>
                          <div className="relative">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                              type="text"
                              value={group.editedDireccion}
                              onChange={(e) => handleUpdateGroupField(groupIdx, 'editedDireccion', e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              placeholder="Ej: 3A44 o Sector 1 Apto 44"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Sector</label>
                          <input
                            type="text"
                            value={group.editedSector}
                            onChange={(e) => handleUpdateGroupField(groupIdx, 'editedSector', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            placeholder="Sector 1"
                          />
                        </div>
                      </div>

                      {/* Phone & Integrantes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Teléfono</label>
                          <div className="relative">
                            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                              type="text"
                              value={group.editedTelefono}
                              onChange={(e) => handleUpdateGroupField(groupIdx, 'editedTelefono', e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                              placeholder="Teléfono de contacto"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Habitantes / Integrantes Hogar</label>
                          <div className="relative">
                            <Users className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={group.editedIntegrantes}
                              onChange={(e) => handleUpdateGroupField(groupIdx, 'editedIntegrantes', parseInt(e.target.value) || 1)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Observaciones */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Observaciones</label>
                        <div className="relative">
                          <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            value={group.editedObservaciones}
                            onChange={(e) => handleUpdateGroupField(groupIdx, 'editedObservaciones', e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            placeholder="Notas u observaciones de la unificación"
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 px-6 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {groupsState.length > 0 && (
            <button
              onClick={handleConfirmAll}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow-lg shadow-amber-600/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Confirmar y Unificar {totalDuplicatesCount} Registros</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
