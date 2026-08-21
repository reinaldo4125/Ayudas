import React from 'react';
import { Package, Users, BarChart3, Bot, FileCheck, HeartHandshake, AlertTriangle, Cloud, RefreshCw } from 'lucide-react';
import { SummaryStats } from '../types';

interface HeaderProps {
  activeTab: 'simple' | 'dashboard' | 'beneficiaries' | 'inventory' | 'reports' | 'ai';
  setActiveTab: (tab: 'simple' | 'dashboard' | 'beneficiaries' | 'inventory' | 'reports' | 'ai') => void;
  stats: SummaryStats;
  onOpenNewDelivery: () => void;
  isCloudSynced?: boolean;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  stats,
  onOpenNewDelivery,
  isCloudSynced = true,
  isSyncing = false
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Branding & Main Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-900/50 flex items-center justify-center">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Ayudas Humanitarias Chiminangos
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>En Vivo</span>
                </span>
                
                {/* Cloud Sync Indicator */}
                <div
                  title="Sincronización en tiempo real activa con Firestore (Nube)"
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    isSyncing
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : isCloudSynced
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin text-sky-400" />
                      <span>Sincronizando Nube...</span>
                    </>
                  ) : isCloudSynced ? (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-teal-400" />
                      <span>Nube Firestore Conectada</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-amber-400" />
                      <span>Modo Local</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Censo Oficial Chiminangos • Base de Datos en la Nube & Control de Entregas
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="hidden lg:flex items-center space-x-4 bg-slate-800/80 px-3.5 py-2 rounded-lg border border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block">Población Total</span>
                <span className="font-bold text-white text-sm">{stats.totalBeneficiarios} beneficiarios</span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <span className="text-slate-400 block">Cobertura Entregas</span>
                <span className="font-bold text-emerald-400 text-sm">{stats.porcentajeCobertura}% ({stats.beneficiariosEntregados}/{stats.totalBeneficiarios})</span>
              </div>
              {stats.itemsStockBajo > 0 && (
                <>
                  <div className="h-6 w-px bg-slate-700" />
                  <div className="flex items-center text-amber-400 gap-1.5 font-medium">
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                    <span>{stats.itemsStockBajo} Insumo(s) en alerta</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onOpenNewDelivery}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-all shadow-md hover:shadow-emerald-900/40 flex items-center space-x-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>+ Registrar Entrega</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-slate-800/80 pt-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('simple')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'simple'
                ? 'bg-emerald-600 text-white border-b-2 border-emerald-400 shadow'
                : 'text-emerald-400 hover:text-emerald-200 hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>🔍 Buscador por Apto & Entregas</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Panel Resumen</span>
          </button>

          <button
            onClick={() => setActiveTab('beneficiaries')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'beneficiaries'
                ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Beneficiarios ({stats.totalBeneficiarios})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Control Inventario</span>
            {stats.itemsStockBajo > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {stats.itemsStockBajo}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Reportes & Actas</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ai'
                ? 'bg-emerald-900/60 text-emerald-300 border-b-2 border-emerald-400'
                : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-900/30'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Asistente IA Gemini</span>
          </button>
        </div>
      </div>
    </header>
  );
};
