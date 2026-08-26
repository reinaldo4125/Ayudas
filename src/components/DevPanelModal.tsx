import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, Database, Copy, Trash2, Check, X, ShieldAlert, Sparkles, RefreshCw, ArrowRight, Server, CheckCircle2, Building2, UploadCloud, DownloadCloud } from 'lucide-react';
import { isDevEnvironment, copyProdToDevInCloud, copyDevToProdPropertiesInCloud, copyDevToProdAllInCloud, copyProdToDevPropertiesInCloud } from '../lib/firestoreService';

interface DevPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAllData?: () => void;
  totalBeneficiarios: number;
  totalDeliveries: number;
  totalProperties?: number;
}

export const DevPanelModal: React.FC<DevPanelModalProps> = ({
  isOpen,
  onClose,
  onClearAllData,
  totalBeneficiarios,
  totalDeliveries,
  totalProperties = 0
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Interactive Confirmation & Progress States (no window.confirm/alert)
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  const [showCopyPropsConfirm, setShowCopyPropsConfirm] = useState(false);
  const [showPromotePropsConfirm, setShowPromotePropsConfirm] = useState(false);
  const [showPromoteAllConfirm, setShowPromoteAllConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [successBanner, setSuccessBanner] = useState<{
    title: string;
    description: string;
    stats?: { label: string; value: number }[];
  } | null>(null);
  const [actionError, setActionError] = useState('');
  const [clearSuccessMsg, setClearSuccessMsg] = useState('');

  if (!isOpen) return null;

  const isDev = isDevEnvironment();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = passwordInput.trim();
    if (cleanPass === 'Salome2016' || cleanPass === 'Salome2016.') {
      setIsAuthenticated(true);
      setErrorMsg('');
      setPasswordInput('');
    } else {
      setErrorMsg('Contraseña incorrecta. Acceso denegado.');
    }
  };

  // 1. Copy ALL Prod to Dev
  const handleExecuteCopyProdToDev = async () => {
    try {
      setIsProcessing(true);
      setActionError('');
      setSuccessBanner(null);
      setShowCopyConfirm(false);

      const res = await copyProdToDevInCloud((step) => {
        setProgressStep(step);
      });

      setSuccessBanner({
        title: '¡Clonación (PROD ➔ DEV) Exitosa!',
        description: 'Todos los datos de Producción fueron copiados a las colecciones de prueba de Desarrollo:',
        stats: [
          { label: '👥 Beneficiarios', value: res.beneficiariesCount },
          { label: '📦 Entregas', value: res.deliveriesCount },
          { label: '🛒 Inventario', value: res.inventoryCount },
          { label: '🏢 Viviendas/Censo', value: res.propertiesCount }
        ]
      });
    } catch (err: any) {
      console.error('Error in copyProdToDev:', err);
      setActionError(err.message || 'Error desconocido al clonar base de datos.');
    } finally {
      setIsProcessing(false);
      setProgressStep('');
    }
  };

  // 2. Copy Properties ONLY from Prod to Dev
  const handleExecuteCopyProdProperties = async () => {
    try {
      setIsProcessing(true);
      setActionError('');
      setSuccessBanner(null);
      setShowCopyPropsConfirm(false);

      const res = await copyProdToDevPropertiesInCloud((step) => {
        setProgressStep(step);
      });

      setSuccessBanner({
        title: '¡Propietarios copiados a Desarrollo con Éxito!',
        description: 'Los datos de la colección oficial de Producción ("properties") fueron clonados hacia Desarrollo ("dev_properties").',
        stats: [
          { label: '🏢 Apartamentos / Censo Copiados', value: res.count }
        ]
      });
    } catch (err: any) {
      console.error('Error in copy prod properties to dev:', err);
      setActionError(err.message || 'Error al copiar propietarios a Desarrollo.');
    } finally {
      setIsProcessing(false);
      setProgressStep('');
    }
  };

  // 3. Promote ONLY Properties from Dev to Prod
  const handleExecutePromoteProperties = async () => {
    try {
      setIsProcessing(true);
      setActionError('');
      setSuccessBanner(null);
      setShowPromotePropsConfirm(false);

      const res = await copyDevToProdPropertiesInCloud((step) => {
        setProgressStep(step);
      });

      setSuccessBanner({
        title: '¡Propietarios pasados a Producción con Éxito!',
        description: 'La colección oficial de Producción ("properties") ahora contiene los datos registrados en Desarrollo.',
        stats: [
          { label: '🏢 Apartamentos / Censo Copiados', value: res.count }
        ]
      });
    } catch (err: any) {
      console.error('Error in promote properties:', err);
      setActionError(err.message || 'Error al pasar propietarios a Producción.');
    } finally {
      setIsProcessing(false);
      setProgressStep('');
    }
  };

  // 4. Promote ALL collections from Dev to Prod
  const handleExecutePromoteAll = async () => {
    try {
      setIsProcessing(true);
      setActionError('');
      setSuccessBanner(null);
      setShowPromoteAllConfirm(false);

      const res = await copyDevToProdAllInCloud((step) => {
        setProgressStep(step);
      });

      setSuccessBanner({
        title: '¡Toda la Base de Datos Promovida a Producción!',
        description: 'Los beneficiarios, entregas, inventario y propietarios de Desarrollo han sido guardados en Producción.',
        stats: [
          { label: '👥 Beneficiarios', value: res.beneficiariesCount },
          { label: '📦 Entregas', value: res.deliveriesCount },
          { label: '🛒 Inventario', value: res.inventoryCount },
          { label: '🏢 Viviendas/Censo', value: res.propertiesCount }
        ]
      });
    } catch (err: any) {
      console.error('Error in promote all:', err);
      setActionError(err.message || 'Error al promover base de datos a Producción.');
    } finally {
      setIsProcessing(false);
      setProgressStep('');
    }
  };

  const handleExecuteClear = () => {
    if (!onClearAllData) return;
    onClearAllData();
    setShowClearConfirm(false);
    setClearSuccessMsg('La base de datos del entorno actual ha sido vaciada con éxito.');
  };

  const handleCloseAll = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
    setErrorMsg('');
    setShowCopyConfirm(false);
    setShowCopyPropsConfirm(false);
    setShowPromotePropsConfirm(false);
    setShowPromoteAllConfirm(false);
    setShowClearConfirm(false);
    setSuccessBanner(null);
    setActionError('');
    setClearSuccessMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-700/80 space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Close button */}
        <button
          onClick={handleCloseAll}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30 text-purple-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Panel de Mantenimiento BD</span>
              <span className="text-[10px] px-2 py-0.5 bg-purple-500/30 text-purple-300 rounded-full border border-purple-500/40 uppercase font-extrabold tracking-wider">
                Exclusivo Desarrollador
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Herramientas de sincronización, migración y mantenimiento
            </p>
          </div>
        </div>

        {/* Auth form if not authenticated */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-white">🔐 Ingreso restringido</p>
              <p className="text-slate-400">
                Ingrese la contraseña de desarrollador para desbloquear las opciones de clonación y pase a producción.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña de acceso:
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Ingrese contraseña..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-slate-500"
                />
              </div>
              {errorMsg && (
                <p className="text-xs text-rose-400 font-semibold mt-2 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-950/60 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Desbloquear Panel</span>
            </button>
          </form>
        ) : (
          /* Unlocked Developer Options */
          <div className="space-y-5 pt-1">
            {/* Environment status banner */}
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Entorno actual:</span>
                {isDev ? (
                  <span className="font-bold text-purple-400 bg-purple-500/20 px-2.5 py-0.5 rounded-md border border-purple-500/40">
                    🧪 DESARROLLO (dev_collections)
                  </span>
                ) : (
                  <span className="font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-md border border-emerald-500/40">
                    🚀 PRODUCCIÓN (Colección Oficial)
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Beneficiarios en memoria/nube:</span>
                <strong className="text-white">{totalBeneficiarios}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Entregas registradas:</span>
                <strong className="text-white">{totalDeliveries}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Censo Propietarios (Aptos):</span>
                <strong className="text-white">{totalProperties || 600}</strong>
              </div>
            </div>

            {/* Clear Database Success Msg */}
            {clearSuccessMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{clearSuccessMsg}</span>
              </div>
            )}

            {/* Success Banner */}
            {successBanner && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-xs space-y-2 text-emerald-200">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{successBanner.title}</span>
                </div>
                <p className="text-[11px] text-emerald-300/80">
                  {successBanner.description}
                </p>
                {successBanner.stats && (
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    {successBanner.stats.map((s, idx) => (
                      <div key={idx} className="bg-emerald-900/40 p-2 rounded-lg border border-emerald-500/30">
                        {s.label}: <strong>{s.value}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Error Banner */}
            {actionError && (
              <div className="p-3.5 bg-rose-950/70 border border-rose-500/50 rounded-2xl text-xs text-rose-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Error en la operación</span>
                </div>
                <p className="text-[11px] font-mono">{actionError}</p>
              </div>
            )}

            {/* Progress display during any execution */}
            {isProcessing && (
              <div className="p-3.5 bg-indigo-950/70 border border-indigo-500/50 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-indigo-200">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-300 shrink-0" />
                  <span>{progressStep || 'Procesando operación en Firestore...'}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-400 h-full w-full animate-pulse"></div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* SECTION 1: PRODUCCIÓN -> DESARROLLO */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DownloadCloud className="w-4 h-4 text-emerald-400" />
                  <span>Clonación: Producción ➔ Desarrollo</span>
                </p>

                {/* 1A: FULL PROD -> DEV */}
                <div className="p-4 bg-slate-800/90 rounded-2xl border border-emerald-500/40 hover:border-emerald-400 transition-colors space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                      <DownloadCloud className="w-4 h-4 text-emerald-400" />
                      <span>Clonar TODA la BD (PRODUCCIÓN ➔ DESARROLLO)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Copia toda la base oficial de Producción (beneficiarios, entregas, inventario y censo) a las colecciones de pruebas de Desarrollo (<code>dev_*</code>).
                    </p>
                  </div>

                  {showCopyConfirm && !isProcessing ? (
                    <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl space-y-3 text-xs">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white">¿Confirmar clonación a Desarrollo?</p>
                          <p className="text-slate-300 text-[11px] mt-0.5">
                            Se leerán los datos de <strong>Producción</strong> y sobrescribirán las colecciones de <strong>Desarrollo (dev_*)</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={handleExecuteCopyProdToDev}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow flex items-center justify-center gap-1.5"
                        >
                          <DownloadCloud className="w-3.5 h-3.5" />
                          <span>Sí, Clonar a Desarrollo</span>
                        </button>
                        <button
                          onClick={() => setShowCopyConfirm(false)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    !isProcessing && (
                      <button
                        onClick={() => {
                          setActionError('');
                          setSuccessBanner(null);
                          setShowCopyConfirm(true);
                        }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-2 mt-1"
                      >
                        <DownloadCloud className="w-4 h-4" />
                        <span>Clonar TODA la BD (PROD ➔ DEV)</span>
                      </button>
                    )
                  )}
                </div>

                {/* 1B: PROD PROPS -> DEV PROPS */}
                <div className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700 hover:border-slate-600 transition-colors space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>Copiar Propietarios (PRODUCCIÓN ➔ DESARROLLO)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Copia específicamente los datos del censo y propietarios de Producción hacia la colección de Desarrollo (<code>dev_properties</code>).
                    </p>
                  </div>

                  {showCopyPropsConfirm && !isProcessing ? (
                    <div className="p-3.5 bg-slate-950/80 border border-slate-600 rounded-xl space-y-3 text-xs">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white">¿Copiar Propietarios a Desarrollo?</p>
                          <p className="text-slate-300 text-[11px] mt-0.5">
                            Se leerá el censo de Producción y se guardará en <code>dev_properties</code>.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={handleExecuteCopyProdProperties}
                          className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow flex items-center justify-center gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sí, Copiar Censo a Desarrollo</span>
                        </button>
                        <button
                          onClick={() => setShowCopyPropsConfirm(false)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    !isProcessing && (
                      <button
                        onClick={() => {
                          setActionError('');
                          setSuccessBanner(null);
                          setShowCopyPropsConfirm(true);
                        }}
                        className="w-full py-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-2 mt-1"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copiar Propietarios (PROD ➔ DEV)</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* SECTION 2: DESARROLLO -> PRODUCCIÓN */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-purple-400" />
                  <span>Pase a Producción: Desarrollo ➔ Producción</span>
                </p>

                {/* 2A: FULL DEV -> PROD */}
                <div className="p-4 bg-slate-800/90 rounded-2xl border border-purple-500/40 hover:border-purple-400 transition-colors space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-purple-300 flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-purple-400" />
                      <span>Promover TODA la BD (DESARROLLO ➔ PRODUCCIÓN)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Pasa todos los beneficiarios, entregas, inventario y propietarios desde Desarrollo a la colección oficial de Producción.
                    </p>
                  </div>

                  {showPromoteAllConfirm && !isProcessing ? (
                    <div className="p-3.5 bg-purple-950/70 border border-purple-500/50 rounded-xl space-y-3 text-xs">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white">¿Promover TODA la base a Producción?</p>
                          <p className="text-slate-300 text-[11px] mt-0.5">
                            Esto actualizará todas las colecciones oficiales con los datos que tienes en Desarrollo.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={handleExecutePromoteAll}
                          className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow flex items-center justify-center gap-1.5"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Sí, Promover Todo a Producción</span>
                        </button>
                        <button
                          onClick={() => setShowPromoteAllConfirm(false)}
                          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    !isProcessing && (
                      <button
                        onClick={() => {
                          setActionError('');
                          setSuccessBanner(null);
                          setShowPromoteAllConfirm(true);
                        }}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-2 mt-1"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Promover TODA la BD (DEV ➔ PROD)</span>
                      </button>
                    )
                  )}
                </div>

                {/* 2B: DEV PROPS -> PROD PROPS */}
                <div className="p-4 bg-slate-800/90 rounded-2xl border border-indigo-500/40 hover:border-indigo-400 transition-colors space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-indigo-300 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      <span>Pasar Propietarios (DESARROLLO ➔ PRODUCCIÓN)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Copia específicamente los datos del censo y propietarios desde Desarrollo hacia la colección oficial de Producción (<code>properties</code>).
                    </p>
                  </div>

                  {showPromotePropsConfirm && !isProcessing ? (
                    <div className="p-3.5 bg-indigo-950/70 border border-indigo-500/50 rounded-xl space-y-3 text-xs">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white">¿Pasar Censo Propietarios a Producción?</p>
                          <p className="text-slate-300 text-[11px] mt-0.5">
                            Los datos del módulo de Propietarios en Desarrollo sobrescribirán la colección oficial de Producción.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={handleExecutePromoteProperties}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow flex items-center justify-center gap-1.5"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Sí, Pasar a Producción</span>
                        </button>
                        <button
                          onClick={() => setShowPromotePropsConfirm(false)}
                          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    !isProcessing && (
                      <button
                        onClick={() => {
                          setActionError('');
                          setSuccessBanner(null);
                          setShowPromotePropsConfirm(true);
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-2 mt-1"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Copiar Propietarios (DEV ➔ PROD)</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* ACTION D: VACIAR BD */}
              <div className="p-4 bg-slate-800/90 rounded-2xl border border-rose-900/40 hover:border-rose-500/50 transition-colors space-y-3">
                <div>
                  <h4 className="font-bold text-sm text-rose-400 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Vaciar Base de Datos ({isDev ? 'DESARROLLO' : 'PRODUCCIÓN'})</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Elimina la lista de beneficiarios y el historial de entregas del entorno actual ({isDev ? 'Desarrollo' : 'Producción'}).
                  </p>
                </div>

                {showClearConfirm ? (
                  <div className="p-3.5 bg-rose-950/60 border border-rose-500/40 rounded-xl space-y-3 text-xs">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-rose-200">⚠️ ¿Confirmas VACIAR la base de datos?</p>
                        <p className="text-slate-300 text-[11px] mt-0.5">
                          Se eliminarán los <strong>{totalBeneficiarios}</strong> beneficiarios y las <strong>{totalDeliveries}</strong> entregas del entorno actual.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleExecuteClear}
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Sí, Vaciar Ahora</span>
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setClearSuccessMsg('');
                      setShowClearConfirm(true);
                    }}
                    className="w-full py-2 bg-rose-700 hover:bg-rose-600 active:bg-rose-800 text-white font-bold text-xs rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-2 mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Vaciar Base de Datos ({isDev ? 'DEV' : 'PROD'})</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={handleCloseAll}
                className="text-xs text-slate-400 hover:text-slate-200 font-semibold underline cursor-pointer"
              >
                Cerrar Sesión de Mantenimiento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
