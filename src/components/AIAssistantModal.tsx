import React, { useState } from 'react';
import { Bot, Send, Sparkles, Loader2, RefreshCw, FileText, BarChart3, AlertCircle } from 'lucide-react';
import { Beneficiary, InventoryItem, DeliveryRecord, SummaryStats } from '../types';

interface AIAssistantModalProps {
  stats: SummaryStats;
  beneficiaries: Beneficiary[];
  inventory: InventoryItem[];
  deliveries: DeliveryRecord[];
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  stats,
  beneficiaries,
  inventory,
  deliveries
}) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: `Hola. Soy el **Asistente Inteligente Gemini** para la gestión de entregas en Chiminangos.
Puedes pedirme resúmenes ejecutivos, análisis de sectores con baja cobertura, redactar comunicados oficiales, o consultar recomendaciones de abastecimiento en tiempo real.`
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "Generar informe ejecutivo de cobertura de entregas Chiminangos",
    "¿Cuáles agrupaciones presentan mayor atraso en la entrega?",
    "Redactar borrador de comunicado comunitario para las familias pendientes",
    "Analizar el estado de insumos en bodega y alertar sobre reabastecimiento"
  ];

  const handleSend = async (customPrompt?: string) => {
    const promptToUse = (customPrompt || inputPrompt).trim();
    if (!promptToUse || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: promptToUse }]);
    if (!customPrompt) setInputPrompt('');
    setLoading(true);

    try {
      // Build lightweight context data
      const contextData = {
        resumenGeneral: stats,
        inventarioBodega: inventory.map(i => ({ nombre: i.nombre, disponible: i.stockActual, entregado: i.stockEntregado, alerta: i.stockActual <= i.stockMinimoAlerta })),
        agrupacionesAvance: beneficiaries.reduce((acc: any, b) => {
          const ag = b.agrupacion || 'Sector General';
          if (!acc[ag]) acc[ag] = { total: 0, entregados: 0 };
          acc[ag].total += 1;
          if (b.estadoEntrega === 'ENTREGADO') acc[ag].entregados += 1;
          return acc;
        }, {})
      };

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToUse, contextData })
      });

      const data = await res.json();
      if (res.ok && data.result) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.result }]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ ${data.error || 'No se pudo conectar con el servicio de IA Gemini. Por favor intente nuevamente.'}`
          }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Error de comunicación con el servidor. Verifique su conexión.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg border border-emerald-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Inteligencia Artificial Gemini 2.5 Flash</span>
          </div>
          <h2 className="text-xl font-bold">Asistente de Análisis & Reportación de Impacto</h2>
          <p className="text-slate-300 text-xs mt-1">
            Genera reportes de gestión social, analiza brechas de cobertura e identifica alertas de inventario.
          </p>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reiniciar Chat</span>
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Sugerencias Rápidas de Consulta:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              disabled={loading}
              className="p-3 bg-white hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 rounded-xl text-left text-xs font-medium text-slate-800 transition-all shadow-sm hover:shadow flex items-center justify-between group cursor-pointer disabled:opacity-50"
            >
              <span>{qp}</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 min-h-[380px] max-h-[500px] overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-start space-x-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 shadow-md">
                <Bot className="w-5 h-5" />
              </div>
            )}

            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-2xl whitespace-pre-line ${
                m.role === 'user'
                  ? 'bg-slate-900 text-white font-medium rounded-tr-none'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none'
              }`}
            >
              {m.content}
            </div>

            {m.role === 'user' && (
              <div className="p-2 bg-slate-200 text-slate-700 rounded-xl shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-3 text-slate-500 text-xs py-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <span>Gemini está analizando los datos de la entrega en Chiminangos...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Escriba su consulta o instrucción para el asistente de IA..."
          value={inputPrompt}
          onChange={e => setInputPrompt(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSend();
          }}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !inputPrompt.trim()}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
        >
          <span>Enviar</span>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
