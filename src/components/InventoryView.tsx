import React, { useState } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  X,
  ShieldAlert,
  Edit2,
  Trash2,
  Minus,
  Equal,
  Smartphone,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { InventoryItem } from '../types';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onAddInventoryItem: (item: Omit<InventoryItem, 'id' | 'stockEntregado'>) => void;
  onUpdateStock: (itemId: string, addQuantity: number) => void;
  onEditInventoryItem?: (item: InventoryItem) => void;
  onDeleteInventoryItem?: (itemId: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onAddInventoryItem,
  onUpdateStock,
  onEditInventoryItem,
  onDeleteInventoryItem
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Mobile-Optimized Stock Adjustment Modal
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [adjustMode, setAdjustMode] = useState<'subtract' | 'set' | 'add'>('subtract');
  const [adjustValue, setAdjustValue] = useState<number>(10);

  // New item form state
  const [newItemData, setNewItemData] = useState({
    codigo: '',
    nombre: '',
    categoria: 'Alimentos' as InventoryItem['categoria'],
    unidadMedida: 'Kits' as InventoryItem['unidadMedida'],
    stockInicial: 100,
    stockActual: 100,
    stockMinimoAlerta: 20,
    descripcion: '',
    ubicacionBodega: 'Estante Principal'
  });

  const categories = ['TODAS', 'Alimentos', 'Aseo', 'Infantil', 'Hogar', 'Salud', 'Otros'];

  const filteredItems = inventory.filter(item => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q ||
      item.nombre.toLowerCase().includes(q) ||
      item.codigo.toLowerCase().includes(q) ||
      item.categoria.toLowerCase().includes(q);

    const matchesCategory = selectedCategory === 'TODAS' || item.categoria === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.nombre.trim() || !newItemData.codigo.trim()) {
      alert('Por favor complete los campos obligatorios del insumo.');
      return;
    }

    onAddInventoryItem({
      ...newItemData,
      fechaUltimoIngreso: new Date().toISOString()
    });

    setShowAddModal(false);
    setNewItemData({
      codigo: '',
      nombre: '',
      categoria: 'Alimentos',
      unidadMedida: 'Kits',
      stockInicial: 100,
      stockActual: 100,
      stockMinimoAlerta: 20,
      descripcion: '',
      ubicacionBodega: 'Estante Principal'
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (onEditInventoryItem) {
      onEditInventoryItem(editingItem);
    }
    setEditingItem(null);
  };

  const handleOpenAdjustModal = (item: InventoryItem, initialMode: 'subtract' | 'set' | 'add' = 'subtract') => {
    setRestockItem(item);
    setAdjustMode(initialMode);
    if (initialMode === 'set') {
      setAdjustValue(item.stockActual);
    } else {
      setAdjustValue(1);
    }
  };

  const handleAdjustStockSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!restockItem) return;

    if (adjustMode === 'add') {
      onUpdateStock(restockItem.id, Math.abs(adjustValue));
    } else if (adjustMode === 'subtract') {
      onUpdateStock(restockItem.id, -Math.abs(adjustValue));
    } else if (adjustMode === 'set') {
      const delta = adjustValue - restockItem.stockActual;
      onUpdateStock(restockItem.id, delta);
    }

    setRestockItem(null);
  };

  const computeNewStock = (item: InventoryItem): number => {
    if (adjustMode === 'add') return item.stockActual + Math.abs(adjustValue);
    if (adjustMode === 'subtract') return Math.max(0, item.stockActual - Math.abs(adjustValue));
    if (adjustMode === 'set') return Math.max(0, adjustValue);
    return item.stockActual;
  };

  // Quick 1-click in-card adjustments
  const handleQuickCardStep = (itemId: string, delta: number) => {
    onUpdateStock(itemId, delta);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 max-w-6xl mx-auto px-2 sm:px-4">
      {/* Header & Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full mb-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Fácil Ajuste de Cantidades desde Celular</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Control de Inventario de Bodega</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Merme, aumente o fije el stock disponible rápidamente con botones táctiles grandes.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-md flex items-center justify-center space-x-1.5 cursor-pointer self-stretch sm:self-auto min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Registrar Nuevo Insumo</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap min-h-[38px] ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredItems.map(item => {
          const isLow = item.stockActual <= item.stockMinimoAlerta;
          const pctAvailable = Math.round((item.stockActual / (item.stockInicial || 1)) * 100) || 0;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                isLow ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Card Top Badge */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-mono font-bold rounded-lg border border-slate-200">
                      {item.codigo}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      {item.categoria}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Quick Edit */}
                    <button
                      onClick={() => setEditingItem({ ...item })}
                      className="p-2 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 rounded-xl transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                      title="Editar todos los datos del insumo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {isLow ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 text-[11px] font-extrabold rounded-full animate-pulse border border-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        Stock Bajo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 text-[11px] font-bold rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        Disponible
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 leading-snug">
                  {item.nombre}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                  {item.descripcion || 'Sin descripción adicional.'}
                </p>

                {/* Stock Numbers Summary Box */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-slate-50 p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 text-center mb-3">
                  <div className="py-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Inicial</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-700">{item.stockInicial}</span>
                  </div>
                  <div className="border-x border-slate-200 py-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Entregado</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-600">{item.stockEntregado}</span>
                  </div>
                  <div
                    onClick={() => handleOpenAdjustModal(item, 'set')}
                    className="py-1 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-purple-400 hover:shadow-xs transition-all"
                    title="Toca para cambiar la cifra disponible"
                  >
                    <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block">Disponible</span>
                    <span className={`text-base sm:text-lg font-extrabold ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                      {item.stockActual}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-normal -mt-0.5">{item.unidadMedida}</span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Stock Disponible ({pctAvailable}%)</span>
                    <span>Alerta: &le;{item.stockMinimoAlerta} {item.unidadMedida}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isLow ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, pctAvailable))}%` }}
                    />
                  </div>
                </div>

                {/* Direct Fast-Touch In-Card Quick Stepper (Ideal for Celular) */}
                <div className="bg-slate-100/80 p-2 rounded-2xl border border-slate-200 mb-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5 px-1">
                    <span>⚡ Ajuste Rápido al Toque:</span>
                    <span className="font-mono text-purple-700">Actual: {item.stockActual}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => handleQuickCardStep(item.id, -10)}
                      className="py-2 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition-transform cursor-pointer flex items-center justify-center min-h-[38px]"
                      title="Mermar/Restar 10"
                    >
                      -10
                    </button>
                    <button
                      onClick={() => handleQuickCardStep(item.id, -1)}
                      className="py-2 bg-rose-100 hover:bg-rose-200 active:scale-95 text-rose-800 font-extrabold text-xs rounded-xl border border-rose-300 transition-transform cursor-pointer flex items-center justify-center min-h-[38px]"
                      title="Mermar/Restar 1"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleQuickCardStep(item.id, 1)}
                      className="py-2 bg-emerald-100 hover:bg-emerald-200 active:scale-95 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-300 transition-transform cursor-pointer flex items-center justify-center min-h-[38px]"
                      title="Sumar 1"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleQuickCardStep(item.id, 10)}
                      className="py-2 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 font-extrabold text-xs rounded-xl border border-emerald-200 transition-transform cursor-pointer flex items-center justify-center min-h-[38px]"
                      title="Sumar 10"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Card Main Action Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-slate-400 text-[11px] truncate">
                  📍 {item.ubicacionBodega || 'Bodega Principal'}
                </span>

                <button
                  onClick={() => handleOpenAdjustModal(item, 'subtract')}
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer min-h-[42px]"
                  title="Abrir menú de merma o ajuste"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                  <span>Mermar / Ajustar Cifra</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MOBILE-OPTIMIZED MODAL: AJUSTAR, MERMAR O FIJAR NÚMERO DE MERCADOS        */}
      {/* ========================================================================= */}
      {restockItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                  Ajuste Rápido desde Celular
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                  {restockItem.nombre}
                </h3>
              </div>
              <button
                onClick={() => setRestockItem(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Current Stock Banner */}
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[11px] text-slate-400 font-semibold block">Stock Actual en Bodega:</span>
                <span className="text-2xl font-black text-white">{restockItem.stockActual}</span>
                <span className="text-xs text-slate-400 ml-1.5">{restockItem.unidadMedida}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-semibold block">Código:</span>
                <span className="text-xs font-mono font-bold bg-slate-800 px-2 py-1 rounded-lg text-emerald-400">
                  {restockItem.codigo}
                </span>
              </div>
            </div>

            {/* 3 Large Mode Buttons for Mobile */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                ¿Qué deseas hacer con la cantidad?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* 1. Mermar */}
                <button
                  type="button"
                  onClick={() => {
                    setAdjustMode('subtract');
                    setAdjustValue(1);
                  }}
                  className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[58px] ${
                    adjustMode === 'subtract'
                      ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Minus className="w-5 h-5" />
                  <span>Mermar (-)</span>
                </button>

                {/* 2. Fijar / Cambiar al número exacto */}
                <button
                  type="button"
                  onClick={() => {
                    setAdjustMode('set');
                    setAdjustValue(restockItem.stockActual);
                  }}
                  className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[58px] ${
                    adjustMode === 'set'
                      ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Equal className="w-5 h-5" />
                  <span>Fijar Total (=)</span>
                </button>

                {/* 3. Sumar / Reabastecer */}
                <button
                  type="button"
                  onClick={() => {
                    setAdjustMode('add');
                    setAdjustValue(10);
                  }}
                  className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[58px] ${
                    adjustMode === 'add'
                      ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span>Sumar (+)</span>
                </button>
              </div>
            </div>

            {/* Quick 1-Tap Preset Pills on Phone */}
            {adjustMode !== 'set' && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500">
                  {adjustMode === 'subtract' ? 'Toca una cantidad rápida para mermar:' : 'Toca una cantidad rápida para sumar:'}
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 5, 10, 25, 50].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAdjustValue(n)}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer min-h-[40px] ${
                        adjustValue === n
                          ? adjustMode === 'subtract'
                            ? 'bg-rose-100 border-rose-400 text-rose-900 font-black ring-1 ring-rose-400'
                            : 'bg-emerald-100 border-emerald-400 text-emerald-900 font-black ring-1 ring-emerald-400'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {adjustMode === 'subtract' ? `-${n}` : `+${n}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Large Stepper & Input for Mobile */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <label className="block text-xs font-bold text-slate-700 text-center">
                {adjustMode === 'subtract' && `¿Cuántos ${restockItem.unidadMedida} vas a restar/mermar?`}
                {adjustMode === 'set' && `Escribe la cantidad EXACTA que hay actualmente en bodega:`}
                {adjustMode === 'add' && `¿Cuántos ${restockItem.unidadMedida} vas a ingresar/sumar?`}
              </label>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustValue(prev => Math.max(adjustMode === 'set' ? 0 : 1, prev - (adjustMode === 'set' ? 5 : 1)))}
                  className="w-12 h-12 bg-white border-2 border-slate-300 hover:border-slate-400 active:scale-95 text-slate-700 rounded-2xl font-black text-xl flex items-center justify-center cursor-pointer shadow-xs"
                >
                  -
                </button>

                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={adjustMode === 'set' ? 0 : 1}
                  value={adjustValue}
                  onChange={e => setAdjustValue(parseInt(e.target.value) || 0)}
                  className={`w-32 h-12 text-center bg-white border-2 rounded-2xl text-2xl font-black focus:outline-none shadow-inner ${
                    adjustMode === 'subtract'
                      ? 'border-rose-400 text-rose-700 focus:ring-2 focus:ring-rose-500'
                      : adjustMode === 'set'
                      ? 'border-purple-400 text-purple-900 focus:ring-2 focus:ring-purple-500'
                      : 'border-emerald-400 text-emerald-700 focus:ring-2 focus:ring-emerald-500'
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setAdjustValue(prev => prev + (adjustMode === 'set' ? 5 : 1))}
                  className="w-12 h-12 bg-white border-2 border-slate-300 hover:border-slate-400 active:scale-95 text-slate-700 rounded-2xl font-black text-xl flex items-center justify-center cursor-pointer shadow-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Visual Result Preview */}
            <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Resultado Final:</span>
                <span className="text-slate-800 font-bold">
                  {restockItem.stockActual} &rarr;{' '}
                  <strong className={`text-base font-extrabold ${adjustMode === 'subtract' ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {computeNewStock(restockItem)} {restockItem.unidadMedida}
                  </strong>
                </span>
              </div>
              <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-700">
                {adjustMode === 'subtract' && `Mermando ${adjustValue}`}
                {adjustMode === 'set' && `Fijado en ${adjustValue}`}
                {adjustMode === 'add' && `Sumando +${adjustValue}`}
              </span>
            </div>

            {/* Mobile Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRestockItem(null)}
                className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl cursor-pointer order-2 sm:order-1 min-h-[48px]"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => handleAdjustStockSubmit()}
                className={`w-full flex-1 py-3.5 px-4 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2 min-h-[50px] ${
                  adjustMode === 'subtract'
                    ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700'
                    : adjustMode === 'set'
                    ? 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
                }`}
              >
                <Check className="w-5 h-5" />
                <span>Confirmar y Guardar Nuevo Stock</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW ITEM                                                      */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Registrar Insumo de Ayuda</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Insumo / Kit *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Kit Escolar Comunitario"
                  value={newItemData.nombre}
                  onChange={e => setNewItemData({ ...newItemData, nombre: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código Único *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. INS-ESC-008"
                    value={newItemData.codigo}
                    onChange={e => setNewItemData({ ...newItemData, codigo: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={newItemData.categoria}
                    onChange={e => setNewItemData({ ...newItemData, categoria: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  >
                    <option value="Alimentos">Alimentos</option>
                    <option value="Aseo">Aseo</option>
                    <option value="Vestuario">Vestuario</option>
                    <option value="Salud">Salud</option>
                    <option value="Infantil">Infantil</option>
                    <option value="Hogar">Hogar</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidad Medida</label>
                  <select
                    value={newItemData.unidadMedida}
                    onChange={e => setNewItemData({ ...newItemData, unidadMedida: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  >
                    <option value="Kits">Kits</option>
                    <option value="Unidades">Unidades</option>
                    <option value="Cajas">Cajas</option>
                    <option value="Bolsas">Bolsas</option>
                    <option value="Litros">Litros</option>
                    <option value="Kilos">Kilos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={newItemData.stockInicial}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setNewItemData({ ...newItemData, stockInicial: val, stockActual: val });
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mín. Alerta</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={newItemData.stockMinimoAlerta}
                    onChange={e => setNewItemData({ ...newItemData, stockMinimoAlerta: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción / Contenido</label>
                <textarea
                  rows={2}
                  placeholder="Detalles del contenido del kit o insumo..."
                  value={newItemData.descripcion}
                  onChange={e => setNewItemData({ ...newItemData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Guardar en Inventario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT ITEM DETAILS                                                  */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-purple-600" />
                  <span>Editar Insumo / Corregir Cifras</span>
                </h3>
                <p className="text-xs text-slate-500">Corrija manualmente cantidades, stock inicial o datos del insumo.</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Insumo / Kit *</label>
                <input
                  type="text"
                  required
                  value={editingItem.nombre}
                  onChange={e => setEditingItem({ ...editingItem, nombre: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código Único</label>
                  <input
                    type="text"
                    required
                    value={editingItem.codigo}
                    onChange={e => setEditingItem({ ...editingItem, codigo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={editingItem.categoria}
                    onChange={e => setEditingItem({ ...editingItem, categoria: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  >
                    <option value="Alimentos">Alimentos</option>
                    <option value="Aseo">Aseo</option>
                    <option value="Vestuario">Vestuario</option>
                    <option value="Salud">Salud</option>
                    <option value="Infantil">Infantil</option>
                    <option value="Hogar">Hogar</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidad Medida</label>
                  <select
                    value={editingItem.unidadMedida}
                    onChange={e => setEditingItem({ ...editingItem, unidadMedida: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  >
                    <option value="Kits">Kits</option>
                    <option value="Unidades">Unidades</option>
                    <option value="Cajas">Cajas</option>
                    <option value="Bolsas">Bolsas</option>
                    <option value="Litros">Litros</option>
                    <option value="Kilos">Kilos</option>
                  </select>
                </div>
              </div>

              {/* Editable Inventory Numbers Box */}
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-200/80 space-y-3">
                <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📊 Corrección Manual de Cantidades</span>
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stock Inicial</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={editingItem.stockInicial}
                      onChange={e => setEditingItem({ ...editingItem, stockInicial: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-700 mb-1">Entregados</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={editingItem.stockEntregado}
                      onChange={e => setEditingItem({ ...editingItem, stockEntregado: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">Disponible Real</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={editingItem.stockActual}
                      onChange={e => setEditingItem({ ...editingItem, stockActual: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-2 bg-white border border-purple-300 ring-2 ring-purple-400/20 rounded-xl text-xs font-extrabold text-purple-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stock Mínimo Alerta</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={editingItem.stockMinimoAlerta}
                      onChange={e => setEditingItem({ ...editingItem, stockMinimoAlerta: parseInt(e.target.value) || 5 })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ubicación Bodega</label>
                    <input
                      type="text"
                      value={editingItem.ubicacionBodega || ''}
                      onChange={e => setEditingItem({ ...editingItem, ubicacionBodega: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={editingItem.descripcion || ''}
                  onChange={e => setEditingItem({ ...editingItem, descripcion: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {onDeleteInventoryItem ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar el insumo "${editingItem.nombre}" del inventario?`)) {
                        onDeleteInventoryItem(editingItem.id);
                        setEditingItem(null);
                      }
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Insumo</span>
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
