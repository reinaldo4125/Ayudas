import React, { useState } from 'react';
import { Package, Plus, AlertTriangle, CheckCircle2, Search, ArrowUpRight, ArrowDownRight, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { InventoryItem } from '../types';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onAddInventoryItem: (item: Omit<InventoryItem, 'id' | 'stockEntregado'>) => void;
  onUpdateStock: (itemId: string, addQuantity: number) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onAddInventoryItem,
  onUpdateStock
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(50);

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

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem || restockAmount <= 0) return;
    onUpdateStock(restockItem.id, restockAmount);
    setRestockItem(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Control de Inventario de Ayudas Humanitarias</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoreo en tiempo real de stock disponible, insumos entregados y nivel de alerta en bodega.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md flex items-center space-x-1.5 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Registrar Nuevo Insumo</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar insumo por nombre o código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto scrollbar-none py-0.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => {
          const isLow = item.stockActual <= item.stockMinimoAlerta;
          const pctAvailable = Math.round((item.stockActual / (item.stockInicial || 1)) * 100) || 0;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                isLow ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200/80'
              }`}
            >
              <div>
                {/* Card Top Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded">
                      {item.codigo}
                    </span>
                    <span className="ml-2 text-xs font-semibold text-slate-500 uppercase">
                      {item.categoria}
                    </span>
                  </div>

                  {isLow ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-extrabold rounded-full animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Stock Bajo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Disponible
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">
                  {item.nombre}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                  {item.descripcion || 'Sin descripción adicional.'}
                </p>

                {/* Stock Numbers */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Inicial</span>
                    <span className="text-xs font-bold text-slate-700">{item.stockInicial}</span>
                  </div>
                  <div className="border-x border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-semibold block">Entregado</span>
                    <span className="text-xs font-bold text-emerald-600">{item.stockEntregado}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Disponible</span>
                    <span className={`text-sm font-extrabold ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                      {item.stockActual} <span className="text-[10px] text-slate-500 font-normal">{item.unidadMedida}</span>
                    </span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Stock Disponible ({pctAvailable}%)</span>
                    <span>Alerta: &le;{item.stockMinimoAlerta} {item.unidadMedida}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isLow ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, pctAvailable)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Card Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  📍 {item.ubicacionBodega || 'Bodega Principal'}
                </span>

                <button
                  onClick={() => setRestockItem(item)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Reabastecer</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD NEW ITEM */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={newItemData.categoria}
                    onChange={e => setNewItemData({ ...newItemData, categoria: e.target.value as any })}
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
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidad Medida</label>
                  <select
                    value={newItemData.unidadMedida}
                    onChange={e => setNewItemData({ ...newItemData, unidadMedida: e.target.value as any })}
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    min={1}
                    value={newItemData.stockInicial}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setNewItemData({ ...newItemData, stockInicial: val, stockActual: val });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mín. Alerta</label>
                  <input
                    type="number"
                    min={1}
                    value={newItemData.stockMinimoAlerta}
                    onChange={e => setNewItemData({ ...newItemData, stockMinimoAlerta: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
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
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Guardar en Inventario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESTOCK / INBOUND SHIPMENT */}
      {restockItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Ingreso de Stock en Bodega</h3>
              <button
                onClick={() => setRestockItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Agregue nuevas unidades ingresadas para <strong>{restockItem.nombre}</strong>.
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cantidad a ingresar ({restockItem.unidadMedida})</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={restockAmount}
                  onChange={e => setRestockAmount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Stock actual:</span>
                  <span className="font-bold">{restockItem.stockActual} {restockItem.unidadMedida}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold mt-1">
                  <span>Nuevo stock total:</span>
                  <span>{restockItem.stockActual + restockAmount} {restockItem.unidadMedida}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Confirmar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
