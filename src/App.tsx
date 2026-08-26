/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { BeneficiariesView } from './components/BeneficiariesView';
import { InventoryView } from './components/InventoryView';
import { DeliveryModal } from './components/DeliveryModal';
import { ReportsView } from './components/ReportsView';
import { AIAssistantModal } from './components/AIAssistantModal';
import { SimpleMarketDeliveryView } from './components/SimpleMarketDeliveryView';
import { DevPanelModal } from './components/DevPanelModal';
import { OwnersView } from './components/OwnersView';
import { Beneficiary, InventoryItem, DeliveryRecord, PropertyRecord } from './types';
import {
  getStoredBeneficiaries,
  saveBeneficiaries,
  getStoredInventory,
  saveInventory,
  getStoredDeliveries,
  saveDeliveries,
  calculateSummaryStats,
  clearBeneficiariesAndDeliveries,
  getStoredProperties,
  saveProperties
} from './lib/storage';
import {
  initializeFirestoreDatabase,
  subscribeToBeneficiaries,
  subscribeToInventory,
  subscribeToDeliveries,
  subscribeToProperties,
  syncBeneficiaryToCloud,
  deleteBeneficiaryFromCloud,
  syncInventoryItemToCloud,
  deleteInventoryItemFromCloud,
  syncDeliveryToCloud,
  deleteDeliveryFromCloud,
  syncPropertyToCloud,
  bulkSavePropertiesToCloud,
  bulkSaveBeneficiariesToCloud,
  bulkSaveInventoryToCloud,
  bulkSaveDeliveriesToCloud,
  bulkReplaceBeneficiariesInCloud,
  bulkReplaceDeliveriesInCloud,
  clearAllCloudBeneficiariesAndDeliveries
} from './lib/firestoreService';
import { CheckCircle2, HeartHandshake } from 'lucide-react';
import { MultinyectoresLogo } from './components/MultinyectoresLogo';

import { CSVImportRecord, parseCSVDate } from './lib/csvHelper';
import { parseAptoCode } from './lib/aptoParser';
import { getApartmentCanonicalKey } from './lib/householdUtils';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simple' | 'dashboard' | 'owners' | 'beneficiaries' | 'inventory' | 'reports' | 'ai'>('simple');

  // Application State
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Delivery Modal State
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [preSelectedBeneficiary, setPreSelectedBeneficiary] = useState<Beneficiary | null>(null);

  // Dev Panel Modal State
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);

  // Success Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize data on mount
  useEffect(() => {
    document.title = 'Ayudas Humanitarias Chiminangos';

    // 1. Initial immediate local cache load
    const loadedBens = getStoredBeneficiaries();
    const loadedDels = getStoredDeliveries();
    const loadedInv = getStoredInventory();
    const loadedProps = getStoredProperties(loadedBens);

    setBeneficiaries(loadedBens);
    setDeliveries(loadedDels);
    setInventory(loadedInv);
    setProperties(loadedProps);

    // 2. Connect & synchronize with Cloud Firestore
    setIsSyncing(true);
    let unsubBens: (() => void) | undefined;
    let unsubInv: (() => void) | undefined;
    let unsubDels: (() => void) | undefined;
    let unsubProps: (() => void) | undefined;

    initializeFirestoreDatabase()
      .then((initialData) => {
        if (initialData.beneficiaries.length > 0) {
          setBeneficiaries(initialData.beneficiaries);
        }
        if (initialData.inventory.length > 0) {
          setInventory(initialData.inventory);
        }
        if (initialData.deliveries.length > 0) {
          setDeliveries(initialData.deliveries);
        }
        setIsCloudSynced(true);
        setIsSyncing(false);

        // 3. Start real-time snapshot listeners for multi-device collaboration
        unsubBens = subscribeToBeneficiaries(
          (data) => {
            if (data.length > 0) {
              setBeneficiaries(data);
            }
          },
          () => setIsCloudSynced(false)
        );

        unsubInv = subscribeToInventory(
          (data) => {
            if (data.length > 0) {
              setInventory(data);
            }
          },
          () => setIsCloudSynced(false)
        );

        unsubDels = subscribeToDeliveries(
          (data) => {
            setDeliveries(data);
          },
          () => setIsCloudSynced(false)
        );

        unsubProps = subscribeToProperties(
          (data) => {
            if (data.length > 0) {
              setProperties(data);
            }
          },
          () => setIsCloudSynced(false)
        );
      })
      .catch((err) => {
        console.warn('Firestore init fallback to local storage:', err);
        setIsCloudSynced(false);
        setIsSyncing(false);
      });

    return () => {
      if (unsubBens) unsubBens();
      if (unsubInv) unsubInv();
      if (unsubDels) unsubDels();
      if (unsubProps) unsubProps();
    };
  }, []);

  const stats = calculateSummaryStats(beneficiaries, inventory, deliveries);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handlers
  const handleAddBeneficiary = (newBen: Omit<Beneficiary, 'id' | 'no' | 'estadoEntrega'>) => {
    const nextNo = beneficiaries.length > 0 ? Math.max(...beneficiaries.map(b => b.no)) + 1 : 1;
    const isExt = newBen.direccion.toLowerCase().includes('externo') || newBen.direccion.toLowerCase().includes('fuera') || (newBen.sector || '').toLowerCase().includes('externo');
    const selectedSector = isExt ? 'Usuarios Externos' : (newBen.sector || 'Sector 1');
    const parsed = parseAptoCode(newBen.direccion, selectedSector);

    const created: Beneficiary = {
      ...newBen,
      id: `ben-user-${Date.now()}`,
      no: nextNo,
      sector: selectedSector,
      agrupacion: isExt ? 'Usuarios Externos' : (parsed.isParsed ? parsed.agrupacion : (newBen.agrupacion || 'Sector General')),
      descripcion: isExt ? 'Usuario Externo al Sector' : (parsed.isParsed ? parsed.descripcion : (newBen.descripcion || newBen.direccion)),
      estadoEntrega: 'PENDIENTE',
      historialEntregas: []
    };

    const updated = [created, ...beneficiaries];
    setBeneficiaries(updated);
    saveBeneficiaries(updated);
    syncBeneficiaryToCloud(created);
    showToast(`Beneficiario ${created.nombre} guardado en la nube (${created.sector} - ${created.direccion}).`);
  };

  const handleDeleteBeneficiary = (id: string) => {
    const target = beneficiaries.find(b => b.id === id);
    const updated = beneficiaries.filter(b => b.id !== id);
    setBeneficiaries(updated);
    saveBeneficiaries(updated);
    deleteBeneficiaryFromCloud(id);
    showToast(`Beneficiario ${target ? target.nombre : ''} eliminado.`);
  };

  const handleDeduplicateBeneficiaries = async (updatedList?: Beneficiary[]) => {
    if (updatedList) {
      setBeneficiaries(updatedList);
      saveBeneficiaries(updatedList);
      try {
        await bulkReplaceBeneficiariesInCloud(updatedList);
        showToast('¡Registros duplicados unificados y eliminados de la nube exitosamente!');
      } catch (err) {
        console.error('Error al reemplazar beneficiarios duplicados en la nube:', err);
        showToast('Unificados localmente, pero hubo un error al sincronizar en la nube.');
      }
      return;
    }

    const groups = new Map<string, Beneficiary[]>();
    const nonCedulaList: Beneficiary[] = [];

    beneficiaries.forEach(b => {
      const cleanCed = (b.cedula || '').trim().replace(/[^\d]/g, '');
      if (cleanCed && cleanCed !== '0' && b.cedula !== 'S/N' && b.cedula !== 'SN') {
        const existing = groups.get(cleanCed) || [];
        existing.push(b);
        groups.set(cleanCed, existing);
      } else {
        nonCedulaList.push(b);
      }
    });

    let duplicatesFound = 0;
    const consolidated: Beneficiary[] = [];

    groups.forEach((list) => {
      if (list.length === 1) {
        consolidated.push(list[0]);
      } else {
        duplicatesFound += (list.length - 1);
        
        // Pick best master (one with phone number or lowest 'no')
        const master = list.find(b => b.telefono && b.telefono !== 'Sin teléfono' && b.telefono.trim() !== '') || list[0];
        const bestPhone = list.map(b => b.telefono).find(t => t && t !== 'Sin teléfono' && t.trim() !== '') || master.telefono;
        const bestDir = list.map(b => b.direccion).find(d => d && d !== 'Usuario Externo' && d.trim() !== '') || master.direccion;

        // Consolidate delivery history
        const allHistories: DeliveryRecord[] = [];
        list.forEach(b => {
          if (b.historialEntregas) {
            allHistories.push(...b.historialEntregas);
          }
        });

        // Deduplicate history items by id
        const uniqueHistories = Array.from(new Map(allHistories.map(h => [h.id, h])).values());

        const isDelivered = list.some(b => b.estadoEntrega === 'ENTREGADO');
        const latestFecha = list.map(b => b.fechaUltimaEntrega).filter(Boolean).sort().pop();

        const mergedBen: Beneficiary = {
          ...master,
          telefono: bestPhone,
          direccion: bestDir,
          estadoEntrega: isDelivered ? 'ENTREGADO' : 'PENDIENTE',
          fechaUltimaEntrega: latestFecha || master.fechaUltimaEntrega,
          historialEntregas: uniqueHistories
        };

        consolidated.push(mergedBen);
      }
    });

    const finalList = [...consolidated, ...nonCedulaList].sort((a, b) => a.no - b.no);
    setBeneficiaries(finalList);
    saveBeneficiaries(finalList);

    if (duplicatesFound > 0) {
      try {
        await bulkReplaceBeneficiariesInCloud(finalList);
        showToast(`¡Depuración completada! Se unificaron ${duplicatesFound} registro(s) duplicados y se eliminaron de la nube.`);
      } catch (err) {
        console.error('Error al depurar duplicados en la nube:', err);
        showToast(`Se unificaron ${duplicatesFound} duplicado(s) localmente, error al limpiar en la nube.`);
      }
    } else {
      showToast('No se encontraron beneficiarios duplicados por cédula.');
    }
  };

  const handleImportBulkBeneficiaries = async (items: CSVImportRecord[], replaceMode: boolean = false) => {
    let currentMaxNo = 0;
    const newDeliveries: DeliveryRecord[] = [];
    let updatedInventory = [...inventory];

    const matchInventory = (text?: string): InventoryItem => {
      if (!text || !text.trim()) {
        return updatedInventory.find(i => i.id === 'inv-1') || updatedInventory[0];
      }
      const cleanText = text.toLowerCase().trim();

      // Match by exact code or ID
      const byCode = updatedInventory.find(i => i.codigo.toLowerCase() === cleanText || i.id.toLowerCase() === cleanText);
      if (byCode) return byCode;

      // Match by full/partial name
      const byName = updatedInventory.find(i => i.nombre.toLowerCase().includes(cleanText) || cleanText.includes(i.nombre.toLowerCase()));
      if (byName) return byName;

      // Keyword matching
      if (cleanText.includes('aseo') || cleanText.includes('higiene') || cleanText.includes('jabon')) {
        return updatedInventory.find(i => i.id === 'inv-2') || updatedInventory[0];
      }
      if (cleanText.includes('cobija') || cleanText.includes('frazada') || cleanText.includes('manta')) {
        return updatedInventory.find(i => i.id === 'inv-3') || updatedInventory[0];
      }
      if (cleanText.includes('infantil') || cleanText.includes('pañal') || cleanText.includes('bebe') || cleanText.includes('niño')) {
        return updatedInventory.find(i => i.id === 'inv-4') || updatedInventory[0];
      }
      if (cleanText.includes('agua') || cleanText.includes('garrafa') || cleanText.includes('bebida')) {
        return updatedInventory.find(i => i.id === 'inv-5') || updatedInventory[0];
      }
      if (cleanText.includes('botiquin') || cleanText.includes('salud') || cleanText.includes('primeros auxilios') || cleanText.includes('medicina')) {
        return updatedInventory.find(i => i.id === 'inv-6') || updatedInventory[0];
      }
      if (cleanText.includes('escolar') || cleanText.includes('cuaderno') || cleanText.includes('colegio')) {
        return updatedInventory.find(i => i.id === 'inv-7') || updatedInventory[0];
      }

      // Default Mercado
      return updatedInventory.find(i => i.id === 'inv-1') || updatedInventory[0];
    };

    // Helper maps for high-precision upsert matching (by Cedula, by Item/No, and by Address+Name)
    const cedulaMap = new Map<string, Beneficiary>();
    const noMap = new Map<number, Beneficiary>();
    const addrNameMap = new Map<string, Beneficiary>();
    const updatedBeneficiariesList: Beneficiary[] = replaceMode ? [] : [...beneficiaries];

    if (!replaceMode) {
      currentMaxNo = beneficiaries.length > 0 ? Math.max(...beneficiaries.map(b => b.no)) : 0;
      updatedBeneficiariesList.forEach(b => {
        const cleanCed = (b.cedula || '').trim().replace(/[^\d]/g, '');
        if (cleanCed && cleanCed.length >= 4 && b.cedula !== 'S/N' && b.cedula !== 'SN') {
          cedulaMap.set(cleanCed, b);
        }
        if (b.no && b.no > 0) {
          noMap.set(b.no, b);
        }
        const addrKey = `${(b.direccion || '').toLowerCase().trim()}|${(b.nombre || '').toLowerCase().trim()}`;
        if (b.direccion && b.nombre) {
          addrNameMap.set(addrKey, b);
        }
      });
    }

    let newCount = 0;
    let mergedCount = 0;

    items.forEach((item, index) => {
      let cleanCedula = (item.cedula || '').trim();
      if (!cleanCedula || cleanCedula.toLowerCase().includes('externo') || cleanCedula.toLowerCase().includes('ext')) {
        cleanCedula = 'S/N';
      }

      const isExternalDir = (item.direccion || '').toLowerCase().includes('externo') || 
                            (item.direccion || '').toLowerCase().includes('fuera') || 
                            (item.sector || '').toLowerCase().includes('externo');
      const cleanDireccion = isExternalDir ? 'Usuario Externo' : (item.direccion || '').trim();
      const selectedSector = isExternalDir ? 'Usuarios Externos' : (item.sector || 'Sector 1');
      const parsed = parseAptoCode(cleanDireccion, selectedSector);

      const numericCed = cleanCedula.replace(/[^\d]/g, '');
      const hasValidCedula = numericCed && numericCed.length >= 4 && cleanCedula !== 'S/N' && cleanCedula !== 'SN';

      // 1. Try matching existing beneficiary
      let existing: Beneficiary | undefined = undefined;

      if (!replaceMode) {
        if (hasValidCedula && cedulaMap.has(numericCed)) {
          existing = cedulaMap.get(numericCed);
        } else if (item.no && item.no > 0 && noMap.has(item.no)) {
          existing = noMap.get(item.no);
        } else {
          const addrKey = `${cleanDireccion.toLowerCase().trim()}|${(item.nombre || '').toLowerCase().trim()}`;
          if (cleanDireccion && item.nombre && addrNameMap.has(addrKey)) {
            existing = addrNameMap.get(addrKey);
          }
        }
      }

      const hasDeliveryInfo = Boolean(item.fechaEntrega?.trim() || item.queSeEntrego?.trim());
      const isoDate = parseCSVDate(item.fechaEntrega);

      const benId = existing ? existing.id : `ben-csv-${Date.now()}-${index}`;

      let delRecord: DeliveryRecord | null = null;

      if (hasDeliveryInfo) {
        const invMatch = matchInventory(item.queSeEntrego);

        // Deduct 1 unit from inventory stock
        updatedInventory = updatedInventory.map(invItem => {
          if (invItem.id === invMatch.id) {
            const newActual = Math.max(0, invItem.stockActual - 1);
            const newEntregado = invItem.stockEntregado + 1;
            return {
              ...invItem,
              stockActual: newActual,
              stockEntregado: newEntregado
            };
          }
          return invItem;
        });

        delRecord = {
          id: `del-csv-${Date.now()}-${index}`,
          beneficiarioId: benId,
          beneficiarioNombre: item.nombre || (existing ? existing.nombre : 'Beneficiario'),
          beneficiarioTipoDocumento: item.tipoDocumento || (existing ? existing.tipoDocumento : 'CC'),
          beneficiarioCedula: cleanCedula !== 'S/N' ? cleanCedula : (existing ? existing.cedula : 'S/N'),
          beneficiarioDireccion: cleanDireccion || (existing ? existing.direccion : 'Usuario Externo'),
          sector: selectedSector,
          agrupacion: isExternalDir ? 'Usuarios Externos' : (parsed.isParsed ? parsed.agrupacion : (item.agrupacion || 'Sector General')),
          fecha: isoDate,
          articulos: [
            {
              itemId: invMatch.id,
              itemNombre: invMatch.nombre,
              cantidad: 1,
              unidad: invMatch.unidadMedida
            }
          ],
          responsable: item.responsable?.trim() || 'Importación CSV',
          observaciones: item.observaciones?.trim() || 'Entrega registrada desde archivo CSV',
          estado: 'COMPLETADO'
        };

        newDeliveries.push(delRecord);
      }

      if (existing) {
        mergedCount++;
        const targetIdx = updatedBeneficiariesList.findIndex(b => b.id === existing!.id);
        if (targetIdx !== -1) {
          const current = updatedBeneficiariesList[targetIdx];
          const bestPhone = (item.telefono && item.telefono !== 'Sin teléfono' && item.telefono.trim() !== '') ? item.telefono.trim() : current.telefono;
          const bestName = (item.nombre && item.nombre.trim() !== '' && item.nombre !== 'Beneficiario') ? item.nombre.trim() : current.nombre;
          const bestDir = (cleanDireccion && cleanDireccion !== 'Usuario Externo' && cleanDireccion.trim() !== '') ? cleanDireccion : current.direccion;
          const bestCedula = (cleanCedula && cleanCedula !== 'S/N' && cleanCedula.trim() !== '') ? cleanCedula : current.cedula;
          const bestTipoDoc = item.tipoDocumento || current.tipoDocumento || 'CC';

          const history = delRecord ? [...(current.historialEntregas || []), delRecord] : (current.historialEntregas || []);

          const updatedBen: Beneficiary = {
            ...current,
            nombre: bestName,
            tipoDocumento: bestTipoDoc,
            cedula: bestCedula,
            telefono: bestPhone,
            direccion: bestDir,
            sector: selectedSector,
            agrupacion: isExternalDir ? 'Usuarios Externos' : (parsed.isParsed ? parsed.agrupacion : (item.agrupacion || current.agrupacion)),
            descripcion: isExternalDir ? 'Usuario Externo al Sector' : parsed.descripcion,
            estadoEntrega: (current.estadoEntrega === 'ENTREGADO' || hasDeliveryInfo) ? 'ENTREGADO' : 'PENDIENTE',
            fechaUltimaEntrega: hasDeliveryInfo ? isoDate : current.fechaUltimaEntrega,
            observaciones: item.observaciones?.trim() || current.observaciones,
            historialEntregas: history
          };

          updatedBeneficiariesList[targetIdx] = updatedBen;

          // Update index maps
          if (hasValidCedula) cedulaMap.set(numericCed, updatedBen);
          if (updatedBen.no) noMap.set(updatedBen.no, updatedBen);
          addrNameMap.set(`${updatedBen.direccion.toLowerCase().trim()}|${updatedBen.nombre.toLowerCase().trim()}`, updatedBen);
        }
      } else {
        newCount++;
        let assignedNo = item.no && item.no > 0 && !noMap.has(item.no) ? item.no : (currentMaxNo + 1);
        if (assignedNo > currentMaxNo) {
          currentMaxNo = assignedNo;
        }

        const newBen: Beneficiary = {
          id: benId,
          no: assignedNo,
          nombre: item.nombre || 'Beneficiario',
          tipoDocumento: item.tipoDocumento || 'CC',
          cedula: cleanCedula,
          direccion: cleanDireccion || 'Usuario Externo',
          sector: selectedSector,
          agrupacion: isExternalDir ? 'Usuarios Externos' : (parsed.isParsed ? parsed.agrupacion : (item.agrupacion || 'Sector General')),
          descripcion: isExternalDir ? 'Usuario Externo al Sector' : parsed.descripcion,
          telefono: (item.telefono && item.telefono.trim() !== '') ? item.telefono.trim() : 'Sin teléfono',
          integrantesHogar: item.integrantesHogar || 0,
          censoActualizado: false,
          prioridadEspecial: item.prioridadEspecial || false,
          estadoEntrega: hasDeliveryInfo ? 'ENTREGADO' : 'PENDIENTE',
          fechaUltimaEntrega: hasDeliveryInfo ? isoDate : undefined,
          observaciones: item.observaciones?.trim(),
          historialEntregas: delRecord ? [delRecord] : []
        };

        updatedBeneficiariesList.push(newBen);

        // Update index maps
        if (hasValidCedula) cedulaMap.set(numericCed, newBen);
        noMap.set(newBen.no, newBen);
        addrNameMap.set(`${newBen.direccion.toLowerCase().trim()}|${newBen.nombre.toLowerCase().trim()}`, newBen);
      }
    });

    // Update state & storage
    setBeneficiaries(updatedBeneficiariesList);
    saveBeneficiaries(updatedBeneficiariesList);

    if (replaceMode) {
      await bulkReplaceBeneficiariesInCloud(updatedBeneficiariesList);
      if (newDeliveries.length > 0) {
        setDeliveries(newDeliveries);
        saveDeliveries(newDeliveries);
        await bulkReplaceDeliveriesInCloud(newDeliveries);
      }
    } else {
      bulkSaveBeneficiariesToCloud(updatedBeneficiariesList);
      if (newDeliveries.length > 0) {
        const mergedDeliveries = [...newDeliveries, ...deliveries];
        setDeliveries(mergedDeliveries);
        saveDeliveries(mergedDeliveries);
        bulkSaveDeliveriesToCloud(mergedDeliveries);
      }
    }

    setInventory(updatedInventory);
    saveInventory(updatedInventory);
    bulkSaveInventoryToCloud(updatedInventory);

    let msg = replaceMode
      ? `¡Base de datos reemplazada con éxito! ${updatedBeneficiariesList.length} beneficiarios totales cargados (${newDeliveries.length} entregas).`
      : `¡Éxito! Importación CSV procesada: ${newCount} nuevos beneficiarios agregados`;

    if (!replaceMode && mergedCount > 0) {
      msg += `, ${mergedCount} beneficiarios existentes actualizados`;
    }
    if (!replaceMode && newDeliveries.length > 0) {
      msg += ` (${newDeliveries.length} entregas registradas y sincronizadas con la nube)`;
    }
    showToast(msg);
  };

  const handleEditBeneficiary = (edited: Beneficiary) => {
    const isExt = edited.direccion.toLowerCase().includes('externo') || edited.direccion.toLowerCase().includes('fuera') || (edited.sector || '').toLowerCase().includes('externo');
    const selectedSector = isExt ? 'Usuarios Externos' : (edited.sector || 'Sector 1');
    const parsed = parseAptoCode(edited.direccion, selectedSector);

    const fullyUpdated: Beneficiary = {
      ...edited,
      sector: selectedSector,
      agrupacion: isExt ? 'Usuarios Externos' : (parsed.isParsed ? parsed.agrupacion : (edited.agrupacion || 'Sector General')),
      descripcion: isExt ? 'Usuario Externo al Sector' : (parsed.isParsed ? parsed.descripcion : (edited.descripcion || edited.direccion))
    };

    const targetAptKey = getApartmentCanonicalKey(fullyUpdated.direccion, fullyUpdated.sector, fullyUpdated.id);

    const updatedBeneficiaries = beneficiaries.map(b => {
      if (b.id === edited.id) {
        return fullyUpdated;
      }
      // If same non-external apartment, sync household member count and census status
      if (!isExt && targetAptKey !== 'sin-direccion') {
        const otherAptKey = getApartmentCanonicalKey(b.direccion, b.sector, b.id);
        if (otherAptKey === targetAptKey) {
          const synced: Beneficiary = {
            ...b,
            integrantesHogar: fullyUpdated.integrantesHogar,
            censoActualizado: true
          };
          syncBeneficiaryToCloud(synced);
          return synced;
        }
      }
      return b;
    });

    setBeneficiaries(updatedBeneficiaries);
    saveBeneficiaries(updatedBeneficiaries);
    syncBeneficiaryToCloud(fullyUpdated);

    // Synchronize delivery history with updated address, sector and agrupacion
    const updatedDeliveries = deliveries.map(d => {
      if (d.beneficiarioId === edited.id || (d.beneficiarioCedula && d.beneficiarioCedula !== 'S/N' && d.beneficiarioCedula === edited.cedula)) {
        const upD = {
          ...d,
          beneficiarioNombre: fullyUpdated.nombre,
          beneficiarioTipoDocumento: fullyUpdated.tipoDocumento || 'CC',
          beneficiarioCedula: fullyUpdated.cedula,
          beneficiarioDireccion: fullyUpdated.direccion,
          sector: fullyUpdated.sector,
          agrupacion: fullyUpdated.agrupacion
        };
        syncDeliveryToCloud(upD);
        return upD;
      }
      return d;
    });

    setDeliveries(updatedDeliveries);
    saveDeliveries(updatedDeliveries);

    showToast(`¡Beneficiario actualizado en la nube! ${fullyUpdated.nombre} en ${fullyUpdated.sector} - ${fullyUpdated.direccion}.`);
  };

  const handleAddInventoryItem = (newItem: Omit<InventoryItem, 'id' | 'stockEntregado'>) => {
    const created: InventoryItem = {
      ...newItem,
      id: `inv-user-${Date.now()}`,
      stockEntregado: 0
    };

    const updated = [created, ...inventory];
    setInventory(updated);
    saveInventory(updated);
    syncInventoryItemToCloud(created);
    showToast(`Insumo "${created.nombre}" agregado al inventario en la nube.`);
  };

  const handleUpdateStock = (itemId: string, addQuantity: number) => {
    let updatedItemObj: InventoryItem | undefined;
    const updated = inventory.map(item => {
      if (item.id === itemId) {
        const newStock = Math.max(0, item.stockActual + addQuantity);
        const up = {
          ...item,
          stockActual: newStock,
          fechaUltimoIngreso: new Date().toISOString()
        };
        updatedItemObj = up;
        return up;
      }
      return item;
    });

    setInventory(updated);
    saveInventory(updated);
    if (updatedItemObj) {
      syncInventoryItemToCloud(updatedItemObj);
    }
    const actionText = addQuantity >= 0 ? `Stock actualizado (+${addQuantity})` : `Stock ajustado/reducido (${addQuantity})`;
    showToast(`${actionText} y sincronizado con la nube.`);
  };

  const handleEditInventoryItem = (editedItem: InventoryItem) => {
    const updated = inventory.map(item => item.id === editedItem.id ? editedItem : item);
    setInventory(updated);
    saveInventory(updated);
    syncInventoryItemToCloud(editedItem);
    showToast(`Insumo "${editedItem.nombre}" actualizado con éxito en la nube.`);
  };

  const handleDeleteInventoryItem = (itemId: string) => {
    const target = inventory.find(i => i.id === itemId);
    const updated = inventory.filter(item => item.id !== itemId);
    setInventory(updated);
    saveInventory(updated);
    deleteInventoryItemFromCloud(itemId);
    showToast(`Insumo "${target?.nombre || 'Insumo'}" eliminado de la bodega.`);
  };

  const handleConfirmDelivery = (deliveryData: Omit<DeliveryRecord, 'id'>) => {
    const deliveryId = `del-${Date.now()}`;
    const newDelivery: DeliveryRecord = {
      ...deliveryData,
      id: deliveryId
    };

    // 1. Deduct Inventory Stock
    let changedInvItem: InventoryItem | undefined;
    const updatedInventory = inventory.map(item => {
      const deliveredItem = deliveryData.articulos.find(a => a.itemId === item.id);
      if (deliveredItem) {
        const up = {
          ...item,
          stockActual: Math.max(0, item.stockActual - deliveredItem.cantidad),
          stockEntregado: item.stockEntregado + deliveredItem.cantidad
        };
        changedInvItem = up;
        return up;
      }
      return item;
    });

    // 2. Update Beneficiary Status
    let changedBeneficiary: Beneficiary | undefined;
    const updatedBeneficiaries = beneficiaries.map(b => {
      if (b.id === deliveryData.beneficiarioId) {
        const history = b.historialEntregas || [];
        const confirmedMembers = deliveryData.integrantesHogar || b.integrantesHogar || 1;
        const up: Beneficiary = {
          ...b,
          integrantesHogar: confirmedMembers,
          censoActualizado: true,
          estadoEntrega: 'ENTREGADO' as const,
          fechaUltimaEntrega: newDelivery.fecha,
          historialEntregas: [newDelivery, ...history]
        };
        changedBeneficiary = up;
        return up;
      }
      return b;
    });

    // 3. Log Delivery
    const updatedDeliveries = [newDelivery, ...deliveries];

    setInventory(updatedInventory);
    saveInventory(updatedInventory);
    if (changedInvItem) {
      syncInventoryItemToCloud(changedInvItem);
    }

    setBeneficiaries(updatedBeneficiaries);
    saveBeneficiaries(updatedBeneficiaries);
    if (changedBeneficiary) {
      syncBeneficiaryToCloud(changedBeneficiary);
    }

    setDeliveries(updatedDeliveries);
    saveDeliveries(updatedDeliveries);
    syncDeliveryToCloud(newDelivery);

    showToast(`Entrega despachada a ${deliveryData.beneficiarioNombre} y guardada en la nube.`);
  };

  const handleDeleteDelivery = (deliveryId: string) => {
    const deliveryToDelete = deliveries.find(d => d.id === deliveryId);
    if (!deliveryToDelete) return;

    // Restore stock to inventory
    let changedInvItem: InventoryItem | undefined;
    const updatedInventory = inventory.map(item => {
      const deliveredArt = deliveryToDelete.articulos.find(a => a.itemId === item.id);
      if (deliveredArt) {
        const up = {
          ...item,
          stockActual: item.stockActual + deliveredArt.cantidad,
          stockEntregado: Math.max(0, item.stockEntregado - deliveredArt.cantidad)
        };
        changedInvItem = up;
        return up;
      }
      return item;
    });

    // Remove from delivery log
    const updatedDeliveries = deliveries.filter(d => d.id !== deliveryId);

    // Update beneficiary delivery state if no remaining deliveries
    let changedBeneficiary: Beneficiary | undefined;
    const updatedBeneficiaries = beneficiaries.map(b => {
      const isMatch = b.id === deliveryToDelete.beneficiarioId ||
                      (b.cedula && b.cedula !== 'S/N' && b.cedula === deliveryToDelete.beneficiarioCedula);
      if (isMatch) {
        const remainingHistory = (b.historialEntregas || []).filter(d => d.id !== deliveryId);
        const hasRemaining = remainingHistory.length > 0;
        const up = {
          ...b,
          estadoEntrega: hasRemaining ? ('ENTREGADO' as const) : ('PENDIENTE' as const),
          fechaUltimaEntrega: hasRemaining ? remainingHistory[0].fecha : undefined,
          historialEntregas: remainingHistory
        };
        changedBeneficiary = up;
        return up;
      }
      return b;
    });

    setInventory(updatedInventory);
    saveInventory(updatedInventory);
    if (changedInvItem) {
      syncInventoryItemToCloud(changedInvItem);
    }

    setBeneficiaries(updatedBeneficiaries);
    saveBeneficiaries(updatedBeneficiaries);
    if (changedBeneficiary) {
      syncBeneficiaryToCloud(changedBeneficiary);
    }

    setDeliveries(updatedDeliveries);
    saveDeliveries(updatedDeliveries);
    deleteDeliveryFromCloud(deliveryId);

    showToast(`Entrega de ${deliveryToDelete.beneficiarioNombre} anulada en la nube. Mercado reintegrado a bodega.`);
  };

  const handleClearAllData = async () => {
    setIsSyncing(true);
    try {
      // 1. Reset local storage
      clearBeneficiariesAndDeliveries();
      // 2. Clear cloud Firestore collections
      await clearAllCloudBeneficiariesAndDeliveries();
      // 3. Update React states
      setBeneficiaries([]);
      setDeliveries([]);
      const updatedInv = inventory.map(item => ({
        ...item,
        stockEntregado: 0,
        stockActual: item.stockInicial > 0 ? item.stockInicial : item.stockActual
      }));
      setInventory(updatedInv);
      saveInventory(updatedInv);
      await bulkSaveInventoryToCloud(updatedInv);

      setIsCloudSynced(true);
      showToast('Base de datos vaciada con éxito. Puedes cargar tu archivo limpio.');
    } catch (err) {
      console.error('Error clearing data:', err);
      showToast('Error al vaciar base de datos en la nube.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenDeliveryForBeneficiary = (beneficiary: Beneficiary) => {
    setPreSelectedBeneficiary(beneficiary);
    setIsDeliveryModalOpen(true);
  };

  const handleUpdateProperty = async (updated: PropertyRecord) => {
    const nextList = properties.map(p => p.id === updated.id ? updated : p);
    setProperties(nextList);
    saveProperties(nextList);
    await syncPropertyToCloud(updated);
    showToast(`Apartamento ${updated.aptoCode} actualizado en el Censo de Propietarios.`);
  };

  const handleBulkUpdateProperties = async (list: PropertyRecord[]) => {
    setProperties(list);
    saveProperties(list);
    await bulkSavePropertiesToCloud(list);
    showToast(`Censo masivo de 600 apartamentos actualizado en la nube.`);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased flex flex-col">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        isCloudSynced={isCloudSynced}
        isSyncing={isSyncing}
        onOpenNewDelivery={() => {
          setPreSelectedBeneficiary(null);
          setIsDeliveryModalOpen(true);
        }}
        onOpenDevPanel={() => setIsDevPanelOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'simple' && (
          <SimpleMarketDeliveryView
            beneficiaries={beneficiaries}
            deliveries={deliveries}
            onConfirmDelivery={handleConfirmDelivery}
            onDeleteDelivery={handleDeleteDelivery}
            onAddBeneficiary={handleAddBeneficiary}
            onEditBeneficiary={handleEditBeneficiary}
            onImportBulkBeneficiaries={handleImportBulkBeneficiaries}
            onClearAllData={handleClearAllData}
          />
        )}

        {activeTab === 'owners' && (
          <OwnersView
            properties={properties}
            onUpdateProperty={handleUpdateProperty}
            onBulkUpdateProperties={handleBulkUpdateProperties}
            beneficiaries={beneficiaries}
            onOpenDevPanel={() => setIsDevPanelOpen(true)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardOverview
            stats={stats}
            beneficiaries={beneficiaries}
            inventory={inventory}
            deliveries={deliveries}
            onOpenNewDelivery={() => {
              setPreSelectedBeneficiary(null);
              setIsDeliveryModalOpen(true);
            }}
            onNavigateTab={setActiveTab}
            onSelectBeneficiaryForDelivery={handleOpenDeliveryForBeneficiary}
          />
        )}

        {activeTab === 'beneficiaries' && (
          <BeneficiariesView
            beneficiaries={beneficiaries}
            onAddBeneficiary={handleAddBeneficiary}
            onEditBeneficiary={handleEditBeneficiary}
            onSelectBeneficiaryForDelivery={handleOpenDeliveryForBeneficiary}
            onImportBulkBeneficiaries={handleImportBulkBeneficiaries}
            onDeduplicateBeneficiaries={handleDeduplicateBeneficiaries}
            onDeleteBeneficiary={handleDeleteBeneficiary}
            onClearAllData={handleClearAllData}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            inventory={inventory}
            onAddInventoryItem={handleAddInventoryItem}
            onUpdateStock={handleUpdateStock}
            onEditInventoryItem={handleEditInventoryItem}
            onDeleteInventoryItem={handleDeleteInventoryItem}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            beneficiaries={beneficiaries}
            inventory={inventory}
            deliveries={deliveries}
            onDeleteDelivery={handleDeleteDelivery}
          />
        )}

        {activeTab === 'ai' && (
          <AIAssistantModal
            stats={stats}
            beneficiaries={beneficiaries}
            inventory={inventory}
            deliveries={deliveries}
          />
        )}
      </main>

      {/* Delivery Dialog Modal */}
      <DeliveryModal
        isOpen={isDeliveryModalOpen}
        onClose={() => {
          setIsDeliveryModalOpen(false);
          setPreSelectedBeneficiary(null);
        }}
        beneficiaries={beneficiaries}
        inventory={inventory}
        preSelectedBeneficiary={preSelectedBeneficiary}
        onConfirmDelivery={handleConfirmDelivery}
      />

      {/* Developer Maintenance Modal */}
      <DevPanelModal
        isOpen={isDevPanelOpen}
        onClose={() => setIsDevPanelOpen(false)}
        onClearAllData={handleClearAllData}
        totalBeneficiarios={beneficiaries.length}
        totalDeliveries={deliveries.length}
        totalProperties={properties.length}
      />

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-slate-900 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center space-x-3 text-xs sm:text-sm font-semibold animate-bounce">
          <div className="p-1.5 bg-emerald-600 rounded-lg text-white shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="truncate sm:whitespace-normal">{toastMessage}</span>
        </div>
      )}

      {/* Footer & Sponsors */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Official Sponsor Showcase Card */}
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 text-center sm:text-left">
              <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-sky-400 shrink-0">
                <HeartHandshake className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <p className="text-slate-300 text-xs max-w-xl">
                  Agradecimiento especial a <strong className="text-white">Multinyectores Colombia</strong> por apoyar el bienestar, la gestión comunitaria y el desarrollo tecnológico del programa de Ayudas Humanitarias Chiminangos.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <MultinyectoresLogo variant="dark" />
            </div>
          </div>

          {/* Bottom Info Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-slate-300">
                Sistema de Control de Inventario y Entregas Humanitarias • Chiminangos
              </p>
              <p className="text-slate-500 mt-0.5">
                Base de datos censada: {beneficiaries.length} familias registradas • Monitoreo en tiempo real
              </p>
            </div>

            <div className="flex items-center space-x-2 text-slate-400">
              <span>Desarrollado por</span>
              <a
                href="https://www.linkedin.com/in/reinaldo-duran-castro"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-emerald-400 hover:text-emerald-300 transition-colors underline underline-offset-4"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                Reinaldo Durán Castro
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
