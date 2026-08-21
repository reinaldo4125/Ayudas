import React, { useState, useMemo } from 'react';
import { FileText, Download, Printer, BarChart2, PieChart, CheckCircle2, Shield, Calendar, Search, X, FileSpreadsheet, Trash2, Baby, Accessibility, HeartHandshake, UserCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import { Beneficiary, InventoryItem, DeliveryRecord } from '../types';
import { exportDeliveriesToCSV, exportVulnerabilitiesToCSV } from '../lib/storage';

interface ReportsViewProps {
  beneficiaries: Beneficiary[];
  inventory: InventoryItem[];
  deliveries: DeliveryRecord[];
  onDeleteDelivery?: (deliveryId: string) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];

export const ReportsView: React.FC<ReportsViewProps> = ({
  beneficiaries,
  inventory,
  deliveries,
  onDeleteDelivery
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState<'ALL' | 'NINOS' | 'ABUELOS' | 'DISCAPACIDAD'>('ALL');
  const [vulnerabilityQuery, setVulnerabilityQuery] = useState('');
  const [selectedDeliveryForActa, setSelectedDeliveryForActa] = useState<DeliveryRecord | null>(null);

  // Filter beneficiaries with special needs
  const vulnerableBeneficiaries = useMemo(() => {
    return beneficiaries.filter(b => {
      const v = b.vulnerabilidades;
      if (!v || (!v.tieneNinos && !v.tieneAdultoMayor && !v.tieneDiscapacidad)) return false;

      if (vulnerabilityFilter === 'NINOS' && !v.tieneNinos) return false;
      if (vulnerabilityFilter === 'ABUELOS' && !v.tieneAdultoMayor) return false;
      if (vulnerabilityFilter === 'DISCAPACIDAD' && !v.tieneDiscapacidad) return false;

      if (!vulnerabilityQuery) return true;
      const q = vulnerabilityQuery.toLowerCase();
      return (
        b.nombre.toLowerCase().includes(q) ||
        b.cedula.toLowerCase().includes(q) ||
        b.direccion.toLowerCase().includes(q)
      );
    });
  }, [beneficiaries, vulnerabilityFilter, vulnerabilityQuery]);

  // Calculate Agrupaciones Chart Data
  const agrupacionData = React.useMemo(() => {
    const map: Record<string, { total: number; entregados: number }> = {};
    beneficiaries.forEach(b => {
      const ag = b.agrupacion || 'Sector General';
      if (!map[ag]) map[ag] = { total: 0, entregados: 0 };
      map[ag].total += 1;
      if (b.estadoEntrega === 'ENTREGADO') map[ag].entregados += 1;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      Entregados: data.entregados,
      Pendientes: data.total - data.entregados
    }));
  }, [beneficiaries]);

  // Inventory distribution Chart Data
  const inventoryChartData = React.useMemo(() => {
    return inventory.map(item => ({
      name: item.nombre.split(' ')[0] + ' ' + (item.nombre.split(' ')[1] || ''),
      Entregado: item.stockEntregado,
      Disponible: item.stockActual
    }));
  }, [inventory]);

  // Filtered Delivery History
  const filteredDeliveries = deliveries.filter(d => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      d.beneficiarioNombre.toLowerCase().includes(q) ||
      d.beneficiarioCedula.toLowerCase().includes(q) ||
      d.agrupacion.toLowerCase().includes(q) ||
      d.responsable.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reportes de Impacto & Actas Oficiales de Entrega</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas consolidadas en tiempo real para auditoría social y coordinación comunitaria Chiminangos.
          </p>
        </div>

        <button
          onClick={() => exportDeliveriesToCSV(deliveries)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Informe de Entregas (CSV)</span>
        </button>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Cobertura por Agrupación */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-600" />
            <span>Distribución de Beneficiarios por Agrupación (Entregados vs Pendientes)</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">Muestra la población atendida contra la lista censada.</p>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agrupacionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="Entregados" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pendientes" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Inventory Outflow */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            <span>Balance de Inventario en Bodega (Entregado vs Disponible)</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">Insumos entregados vs existencias remanentes.</p>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="Entregado" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Disponible" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SPECIAL NEEDS AND VULNERABILITIES DETAILED REPORT */}
      <div className="bg-white rounded-2xl border border-amber-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-50/50 to-orange-50/30">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-xs rounded-full mb-1 border border-amber-200">
              <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
              <span>Censo de Vulnerabilidad y Donaciones Requeridas</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Reporte de Familias con Necesidades Especiales (Pañales, Leche, Discapacidad)
            </h3>
            <p className="text-xs text-slate-500">
              Informe específico para consecución de apoyos y donaciones focalizadas.
            </p>
          </div>

          <button
            onClick={() => exportVulnerabilitiesToCSV(vulnerableBeneficiaries)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2 cursor-pointer self-start md:self-auto shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Reporte Ayudas (CSV)</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setVulnerabilityFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                vulnerabilityFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Todos ({beneficiaries.filter(b => b.vulnerabilidades && (b.vulnerabilidades.tieneNinos || b.vulnerabilidades.tieneAdultoMayor || b.vulnerabilidades.tieneDiscapacidad)).length})
            </button>
            <button
              onClick={() => setVulnerabilityFilter('NINOS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
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
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                vulnerabilityFilter === 'ABUELOS'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Adultos Mayores / Pañales</span>
            </button>
            <button
              onClick={() => setVulnerabilityFilter('DISCAPACIDAD')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                vulnerabilityFilter === 'DISCAPACIDAD'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-purple-800 hover:bg-purple-50 border border-purple-200'
              }`}
            >
              <Accessibility className="w-3.5 h-3.5" />
              <span>Discapacidad</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar por nombre, cédula o apto..."
              value={vulnerabilityQuery}
              onChange={e => setVulnerabilityQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        {/* Table of Vulnerabilities */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-center w-12">#</th>
                <th className="px-4 py-3">Beneficiario / Cédula</th>
                <th className="px-4 py-3">Dirección & Apto</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Detalle Necesidades / Ayudas Requeridas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {vulnerableBeneficiaries.map(b => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-center font-bold text-slate-400">{b.no}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    <div>{b.nombre}</div>
                    <div className="text-[11px] font-mono text-slate-500 font-normal">C.C. {b.cedula}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-bold">
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
                              {s.requierePanalesAdulto && <span> • Requiere Pañales Adulto (Talla {s.tallaPanalAdulto || 'L'})</span>}
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
                              {d.descripcionDiscapacidad && <span> ({d.descripcionDiscapacidad})</span>}
                              {d.requierePanales && <span> • Pañales (Talla {d.tallaPanal || 'L'})</span>}
                              {d.requiereAyudaTecnica && <span> • Ayuda Técnica: {d.tipoAyudaTecnica || 'Silla de Ruedas / Muletas'}</span>}
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

      {/* Deliveries Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Bitácora Oficial de Entregas</h3>
            <p className="text-xs text-slate-500">Registro histórico de comprobantes de despacho.</p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Cédula o Beneficiario..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">ID Entrega</th>
                <th className="px-6 py-3">Beneficiario / Cédula</th>
                <th className="px-6 py-3">Dirección / Agrupación</th>
                <th className="px-6 py-3">Insumos Entregados</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3 text-right">Acta Oficial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredDeliveries.map((del) => (
                <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">{del.id.slice(0, 12)}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-900">
                    {del.beneficiarioNombre}
                    <div className="font-normal font-mono text-slate-500 text-[11px]">C.C. {del.beneficiarioCedula}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="text-slate-800">{del.beneficiarioDireccion}</div>
                    <div className="text-slate-500 text-[11px]">{del.agrupacion}</div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-800">
                    {del.articulos.map(a => `${a.cantidad} ${a.unidad} ${a.itemNombre}`).join(', ')}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">
                    {new Date(del.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setSelectedDeliveryForActa(del)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
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
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 rounded-lg font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors"
                          title="Anular esta entrega y devolver el mercado al inventario de bodega"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Anular</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDeliveries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No se encontraron entregas que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: OFFICIAL DELIVERY CERTIFICATE / ACTA DE ENTREGA */}
      {selectedDeliveryForActa && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span>Acta de Entrega de Ayuda Humanitaria</span>
              </h3>
              <button
                onClick={() => setSelectedDeliveryForActa(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Certificate Body */}
            <div id="printable-acta" className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs space-y-3 font-sans">
              <div className="text-center border-b border-slate-200 pb-3">
                <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                  COMPROBANTE OFICIAL DE RECEPCIÓN
                </h4>
                <p className="text-[11px] text-slate-500">Jornada Comunitaria "ENTREGA DE MERCADOS CHIMINANGOS"</p>
                <p className="font-mono text-[10px] text-slate-400 mt-0.5">ID REGISTRO: {selectedDeliveryForActa.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px]">BENEFICIARIO:</span>
                  <span className="font-bold text-slate-900">{selectedDeliveryForActa.beneficiarioNombre}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px]">CÉDULA DE CIUDADANÍA:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedDeliveryForActa.beneficiarioCedula}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px]">DIRECCIÓN:</span>
                  <span className="font-medium">{selectedDeliveryForActa.beneficiarioDireccion}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px]">SECTOR / AGRUPACIÓN:</span>
                  <span className="font-medium">{selectedDeliveryForActa.agrupacion}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-bold text-[10px] uppercase mb-1">
                  DETALLE DE INSUMOS RECIBIDOS EN SATISFACCIÓN:
                </span>
                <ul className="list-disc list-inside space-y-0.5 font-bold text-slate-800">
                  {selectedDeliveryForActa.articulos.map((a, i) => (
                    <li key={i}>{a.cantidad} {a.unidad} - {a.itemNombre}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 text-slate-600 text-[11px] space-y-1">
                <p><strong>Fecha / Hora:</strong> {new Date(selectedDeliveryForActa.fecha).toLocaleString()}</p>
                <p><strong>Responsable de Entrega:</strong> {selectedDeliveryForActa.responsable}</p>
                <p><strong>Verificación / Firma:</strong> {selectedDeliveryForActa.firmaDigital || 'Verificación Documento Cédula'}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar PDF</span>
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
