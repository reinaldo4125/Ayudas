import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Package, User, Plus, Trash2, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Beneficiary, InventoryItem, DeliveryItem, DeliveryRecord } from '../types';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  beneficiaries: Beneficiary[];
  inventory: InventoryItem[];
  preSelectedBeneficiary?: Beneficiary | null;
  onConfirmDelivery: (delivery: Omit<DeliveryRecord, 'id'>) => void;
  onEditBeneficiary?: (beneficiary: Beneficiary) => void;
}

export const DeliveryModal: React.FC<DeliveryModalProps> = ({
  isOpen,
  onClose,
  beneficiaries,
  inventory,
  preSelectedBeneficiary,
  onConfirmDelivery,
  onEditBeneficiary
}) => {
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>('');
  const [responsable, setResponsable] = useState<string>('Operador Voluntario - Brigada Chiminangos');
  const [firmaDigital, setFirmaDigital] = useState<string>('Verificación presencial C.C.');
  const [observaciones, setObservaciones] = useState<string>('Entrega efectuada en punto comunitario sin novedades.');
  const [censusCount, setCensusCount] = useState<number>(3);
  
  // Selected items to deliver
  const [selectedItems, setSelectedItems] = useState<DeliveryItem[]>([]);

  useEffect(() => {
    if (preSelectedBeneficiary) {
      setSelectedBeneficiaryId(preSelectedBeneficiary.id);
    } else if (beneficiaries.length > 0 && !selectedBeneficiaryId) {
      // Pick first pending beneficiary if any
      const pending = beneficiaries.find(b => b.estadoEntrega === 'PENDIENTE');
      if (pending) setSelectedBeneficiaryId(pending.id);
      else setSelectedBeneficiaryId(beneficiaries[0].id);
    }

    // Default pre-loaded items: 1x Mercado Familiar, 1x Kit Aseo
    const mercadoItem = inventory.find(i => i.id === 'inv-1');
    const aseoItem = inventory.find(i => i.id === 'inv-2');
    
    const initialItems: DeliveryItem[] = [];
    if (mercadoItem) {
      initialItems.push({
        itemId: mercadoItem.id,
        itemNombre: mercadoItem.nombre,
        cantidad: 1,
        unidad: mercadoItem.unidadMedida
      });
    }
    if (aseoItem) {
      initialItems.push({
        itemId: aseoItem.id,
        itemNombre: aseoItem.nombre,
        cantidad: 1,
        unidad: aseoItem.unidadMedida
      });
    }
    setSelectedItems(initialItems);
  }, [preSelectedBeneficiary, isOpen]);

  if (!isOpen) return null;

  const currentBeneficiary = beneficiaries.find(b => b.id === selectedBeneficiaryId);

  const handleAddItemRow = (itemId: string) => {
    const inv = inventory.find(i => i.id === itemId);
    if (!inv) return;
    if (selectedItems.some(s => s.itemId === itemId)) return; // Already added

    setSelectedItems([
      ...selectedItems,
      {
        itemId: inv.id,
        itemNombre: inv.nombre,
        cantidad: 1,
        unidad: inv.unidadMedida
      }
    ]);
  };

  const handleQuantityChange = (itemId: string, qty: number) => {
    const inv = inventory.find(i => i.id === itemId);
    const maxQty = inv ? inv.stockActual : 99;
    const finalQty = Math.max(1, Math.min(maxQty, qty));

    setSelectedItems(selectedItems.map(item => {
      if (item.itemId === itemId) {
        return { ...item, cantidad: finalQty };
      }
      return item;
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(i => i.itemId !== itemId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBeneficiary) {
      alert('Por favor seleccione un beneficiario válido.');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Por favor seleccione al menos un insumo para entregar.');
      return;
    }

    // Check stock validation
    for (const item of selectedItems) {
      const inv = inventory.find(i => i.id === item.itemId);
      if (!inv || inv.stockActual < item.cantidad) {
        alert(`Stock insuficiente para "${item.itemNombre}". Stock disponible: ${inv?.stockActual || 0}`);
        return;
      }
    }

    if (currentBeneficiary && onEditBeneficiary) {
      onEditBeneficiary({
        ...currentBeneficiary,
        integrantesHogar: Math.max(1, censusCount || 1),
        censoActualizado: true
      });
    }

    onConfirmDelivery({
      beneficiarioId: currentBeneficiary.id,
      beneficiarioNombre: currentBeneficiary.nombre,
      beneficiarioCedula: currentBeneficiary.cedula,
      beneficiarioDireccion: currentBeneficiary.direccion,
      agrupacion: currentBeneficiary.agrupacion,
      fecha: new Date().toISOString(),
      articulos: selectedItems,
      responsable: responsable.trim() || 'Voluntario Brigada Chiminangos',
      firmaDigital: firmaDigital.trim() || 'Verificado C.C.',
      observaciones: observaciones.trim(),
      estado: 'COMPLETADO'
    });

    onClose();
  };

  // Remaining available items to add
  const availableItemsToAdd = inventory.filter(inv => !selectedItems.some(s => s.itemId === inv.id));

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Registrar Entrega de Ayudas</h3>
              <p className="text-xs text-slate-500">Comprobante de entrega presencial en tiempo real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Beneficiary Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              1. Seleccionar Beneficiario del Censo *
            </label>
            <select
              value={selectedBeneficiaryId}
              onChange={e => setSelectedBeneficiaryId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/50"
            >
              {beneficiaries.map(b => (
                <option key={b.id} value={b.id}>
                  #{b.no} - {b.nombre} (C.C. {b.cedula}{b.telefono ? ` - Tel: ${b.telefono}` : ''}) - {b.direccion} [{b.estadoEntrega}]
                </option>
              ))}
            </select>

            {currentBeneficiary && (
              <div className="mt-2 space-y-2">
                {(!currentBeneficiary.censoActualizado || (currentBeneficiary.integrantesHogar || 0) === 0) ? (
                  <div className="p-3.5 bg-amber-50 border-2 border-amber-400/90 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2 text-amber-950 font-extrabold text-xs">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>🚨 ALERTA: REGISTRO DE CENSO PENDIENTE</span>
                    </div>
                    <p className="text-xs text-amber-900 font-medium leading-relaxed">
                      Este hogar aún no ha registrado el censo de habitantes. Por favor confirme la cantidad real de integrantes que conviven en la vivienda para actualizar la base de datos:
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <label className="text-xs font-bold text-slate-800">
                        👥 Integrantes en el Hogar: *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="25"
                        value={censusCount}
                        onChange={e => setCensusCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 px-2 py-1 bg-white border border-amber-500 font-extrabold text-slate-900 rounded-lg text-xs text-center focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="text-xs font-bold text-amber-900">personas</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-emerald-950">
                        {currentBeneficiary.nombre} • {currentBeneficiary.agrupacion}
                      </p>
                      <p className="text-emerald-800 text-[11px] font-medium">
                        📍 {currentBeneficiary.direccion} • {censusCount} integrantes en el hogar
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md font-bold">Censo Confirmado</span>
                      <input
                        type="number"
                        min="1"
                        max="25"
                        value={censusCount}
                        onChange={e => setCensusCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 px-2 py-1 bg-white border border-emerald-300 font-bold text-slate-900 rounded-lg text-xs text-center"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Aid Items Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800">
                2. Insumos a Entregar *
              </label>

              {availableItemsToAdd.length > 0 && (
                <select
                  onChange={e => {
                    if (e.target.value) handleAddItemRow(e.target.value);
                    e.target.value = '';
                  }}
                  className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 cursor-pointer"
                >
                  <option value="">+ Agregar otro insumo del inventario...</option>
                  {availableItemsToAdd.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.nombre} (Disp: {inv.stockActual} {inv.unidadMedida})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {selectedItems.map((item) => {
                const inv = inventory.find(i => i.id === item.itemId);
                const stockAvailable = inv ? inv.stockActual : 0;

                return (
                  <div key={item.itemId} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 truncate">{item.itemNombre}</p>
                      <p className="text-[11px] text-slate-500">
                        Disponible en bodega: <strong className="text-slate-700">{stockAvailable} {item.unidad}</strong>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-slate-500 font-medium">Cant:</span>
                      <input
                        type="number"
                        min={1}
                        max={stockAvailable}
                        value={item.cantidad}
                        onChange={e => handleQuantityChange(item.itemId, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900"
                      />
                      <span className="text-slate-500 text-[11px]">{item.unidad}</span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.itemId)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {selectedItems.length === 0 && (
                <div className="p-4 bg-slate-50 text-slate-400 border border-dashed border-slate-200 rounded-xl text-center text-xs">
                  Seleccione al menos un insumo para realizar la entrega.
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Responsible Volunteer & Verification Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Responsable / Voluntario *</label>
              <input
                type="text"
                required
                value={responsable}
                onChange={e => setResponsable(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Verificación / Firma Digital</label>
              <input
                type="text"
                value={firmaDigital}
                onChange={e => setFirmaDigital(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones de la Entrega</label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar y Despachar Entrega</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
