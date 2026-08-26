import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { Beneficiary, DeliveryRecord, InventoryItem, PropertyRecord } from '../types';
import { seedBeneficiaries } from '../data/seedBeneficiaries';
import { seedInventory } from '../data/seedInventory';
import { getStoredBeneficiaries, getStoredDeliveries, getStoredInventory, saveBeneficiaries, saveDeliveries, saveInventory, getStoredProperties, saveProperties, generateAllPropertiesSector1 } from './storage';

export function isDevEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  const metaEnv = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
  return Boolean(metaEnv?.DEV) || host.includes('-dev-') || host.includes('localhost') || host === '127.0.0.1';
}

const COLLECTION_PREFIX = isDevEnvironment() ? 'dev_' : '';

const COLLECTIONS = {
  BENEFICIARIES: `${COLLECTION_PREFIX}beneficiaries`,
  INVENTORY: `${COLLECTION_PREFIX}inventory`,
  DELIVERIES: `${COLLECTION_PREFIX}deliveries`,
  PROPERTIES: `${COLLECTION_PREFIX}properties`,
  SYSTEM: `${COLLECTION_PREFIX}system`
};

export async function copyProdToDevInCloud(onProgress?: (step: string) => void): Promise<{ 
  beneficiariesCount: number; 
  deliveriesCount: number; 
  inventoryCount: number;
  propertiesCount: number;
}> {
  if (onProgress) onProgress('Verificando conexión con Firestore...');

  const prodBenCol = collection(db, 'beneficiaries');
  const prodInvCol = collection(db, 'inventory');
  const prodDelCol = collection(db, 'deliveries');
  const prodPropCol = collection(db, 'properties');

  if (onProgress) onProgress('Leyendo datos oficiales de Producción...');
  const [benSnap, invSnap, delSnap, propSnap] = await Promise.all([
    getDocs(prodBenCol),
    getDocs(prodInvCol),
    getDocs(prodDelCol),
    getDocs(prodPropCol)
  ]);

  const bens: Beneficiary[] = benSnap.docs.map(d => d.data() as Beneficiary);
  const invs: InventoryItem[] = invSnap.docs.map(d => d.data() as InventoryItem);
  const dels: DeliveryRecord[] = delSnap.docs.map(d => d.data() as DeliveryRecord);
  const props: PropertyRecord[] = propSnap.docs.map(d => d.data() as PropertyRecord);

  // 1. Clear dev collections first
  if (onProgress) onProgress('Limpiando colecciones de Desarrollo (dev_*)...');
  const [devBenSnap, devInvSnap, devDelSnap, devPropSnap] = await Promise.all([
    getDocs(collection(db, 'dev_beneficiaries')),
    getDocs(collection(db, 'dev_inventory')),
    getDocs(collection(db, 'dev_deliveries')),
    getDocs(collection(db, 'dev_properties'))
  ]);

  if (!devBenSnap.empty) await chunkedBatchDelete(devBenSnap.docs);
  if (!devInvSnap.empty) await chunkedBatchDelete(devInvSnap.docs);
  if (!devDelSnap.empty) await chunkedBatchDelete(devDelSnap.docs);
  if (!devPropSnap.empty) await chunkedBatchDelete(devPropSnap.docs);

  // 2. Write to dev collections explicitly
  if (onProgress) onProgress(`Guardando ${bens.length} beneficiarios en Desarrollo (dev_beneficiaries)...`);
  for (let i = 0; i < bens.length; i += 400) {
    const chunk = bens.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach(b => batch.set(doc(db, 'dev_beneficiaries', b.id), { ...b, updatedAt: new Date().toISOString() }));
    await batch.commit();
  }

  if (onProgress) onProgress(`Guardando ${invs.length} ítems de inventario en Desarrollo (dev_inventory)...`);
  for (let i = 0; i < invs.length; i += 400) {
    const chunk = invs.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach(item => batch.set(doc(db, 'dev_inventory', item.id), { ...item, updatedAt: new Date().toISOString() }));
    await batch.commit();
  }

  if (onProgress) onProgress(`Guardando ${dels.length} entregas en Desarrollo (dev_deliveries)...`);
  for (let i = 0; i < dels.length; i += 400) {
    const chunk = dels.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach(d => batch.set(doc(db, 'dev_deliveries', d.id), { ...d, createdAt: d.fecha || new Date().toISOString() }));
    await batch.commit();
  }

  if (props.length > 0) {
    if (onProgress) onProgress(`Guardando ${props.length} propiedades en Desarrollo (dev_properties)...`);
    for (let i = 0; i < props.length; i += 400) {
      const chunk = props.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach(p => batch.set(doc(db, 'dev_properties', p.id), { ...p, updatedAt: new Date().toISOString() }));
      await batch.commit();
    }
  }

  // Update local cache if currently in dev
  if (isDevEnvironment()) {
    saveBeneficiaries(bens);
    saveInventory(invs);
    saveDeliveries(dels);
    if (props.length > 0) saveProperties(props);
  }

  if (onProgress) onProgress('¡Clonación (PROD ➔ DEV) completada con éxito!');

  return {
    beneficiariesCount: bens.length,
    inventoryCount: invs.length,
    deliveriesCount: dels.length,
    propertiesCount: props.length
  };
}

/**
 * Copies ONLY Properties/Propietarios data from Production ('properties') to Development ('dev_properties')
 */
export async function copyProdToDevPropertiesInCloud(onProgress?: (step: string) => void): Promise<{ count: number }> {
  if (onProgress) onProgress('Conectando a Firestore...');

  const prodPropCol = collection(db, 'properties');
  if (onProgress) onProgress('Leyendo propiedades de Producción (properties)...');
  const prodSnap = await getDocs(prodPropCol);

  const props: PropertyRecord[] = [];
  prodSnap.forEach(d => props.push(d.data() as PropertyRecord));

  if (props.length === 0) {
    throw new Error('No se encontraron registros de propiedades/censo en Producción para copiar.');
  }

  if (onProgress) onProgress(`Limpiando colección de Desarrollo ('dev_properties')...`);
  const devPropCol = collection(db, 'dev_properties');
  const devSnap = await getDocs(devPropCol);
  if (!devSnap.empty) {
    await chunkedBatchDelete(devSnap.docs);
  }

  if (onProgress) onProgress(`Guardando ${props.length} propiedades en Desarrollo...`);
  for (let i = 0; i < props.length; i += 400) {
    const chunk = props.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach(p => {
      const docRef = doc(db, 'dev_properties', p.id);
      batch.set(docRef, { ...p, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
  }

  if (isDevEnvironment()) {
    saveProperties(props);
  }

  if (onProgress) onProgress('¡Propietarios copiados a Desarrollo con éxito!');
  return { count: props.length };
}

/**
 * Copies ONLY Properties/Propietarios data from Development to Production collection ('properties')
 */
export async function copyDevToProdPropertiesInCloud(onProgress?: (step: string) => void): Promise<{ count: number }> {
  if (onProgress) onProgress('Conectando a Firestore...');

  const devPropCol = collection(db, 'dev_properties');
  if (onProgress) onProgress('Leyendo propietarios de Desarrollo (dev_properties)...');
  const devSnap = await getDocs(devPropCol);

  let props: PropertyRecord[] = [];
  if (!devSnap.empty) {
    devSnap.forEach(d => props.push(d.data() as PropertyRecord));
  } else {
    // Fallback to locally stored properties if dev_properties hasn't been written to yet
    props = getStoredProperties();
  }

  if (props.length === 0) {
    throw new Error('No se encontraron registros de propiedades/censo en Desarrollo para copiar.');
  }

  if (onProgress) onProgress(`Limpiando colección oficial de Producción ('properties')...`);
  const prodPropCol = collection(db, 'properties');
  const prodSnap = await getDocs(prodPropCol);
  if (!prodSnap.empty) {
    await chunkedBatchDelete(prodSnap.docs);
  }

  if (onProgress) onProgress(`Guardando ${props.length} propiedades en Producción...`);
  for (let i = 0; i < props.length; i += 400) {
    const chunk = props.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach(p => {
      const docRef = doc(db, 'properties', p.id);
      batch.set(docRef, { ...p, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
  }

  if (!isDevEnvironment()) {
    saveProperties(props);
  }

  if (onProgress) onProgress('¡Propietarios pasados a Producción con éxito!');
  return { count: props.length };
}

/**
 * Promotes ALL development collections to Production collections (beneficiaries, deliveries, inventory, properties)
 */
export async function copyDevToProdAllInCloud(onProgress?: (step: string) => void): Promise<{
  beneficiariesCount: number;
  deliveriesCount: number;
  inventoryCount: number;
  propertiesCount: number;
}> {
  if (onProgress) onProgress('Leyendo colecciones de Desarrollo...');

  const devBenCol = collection(db, 'dev_beneficiaries');
  const devInvCol = collection(db, 'dev_inventory');
  const devDelCol = collection(db, 'dev_deliveries');
  const devPropCol = collection(db, 'dev_properties');

  const [benSnap, invSnap, delSnap, propSnap] = await Promise.all([
    getDocs(devBenCol),
    getDocs(devInvCol),
    getDocs(devDelCol),
    getDocs(devPropCol)
  ]);

  const bens: Beneficiary[] = !benSnap.empty ? benSnap.docs.map(d => d.data() as Beneficiary) : getStoredBeneficiaries();
  const invs: InventoryItem[] = !invSnap.empty ? invSnap.docs.map(d => d.data() as InventoryItem) : getStoredInventory();
  const dels: DeliveryRecord[] = !delSnap.empty ? delSnap.docs.map(d => d.data() as DeliveryRecord) : getStoredDeliveries();
  const props: PropertyRecord[] = !propSnap.empty ? propSnap.docs.map(d => d.data() as PropertyRecord) : getStoredProperties();

  // 1. Beneficiaries to Prod
  if (onProgress) onProgress(`Guardando ${bens.length} beneficiarios en Producción...`);
  const prodBenCol = collection(db, 'beneficiaries');
  const prodBenSnap = await getDocs(prodBenCol);
  if (!prodBenSnap.empty) await chunkedBatchDelete(prodBenSnap.docs);
  for (let i = 0; i < bens.length; i += 400) {
    const chunk = bens.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach(b => batch.set(doc(db, 'beneficiaries', b.id), { ...b, updatedAt: new Date().toISOString() }));
    await batch.commit();
  }

  // 2. Inventory to Prod
  if (onProgress) onProgress(`Guardando ${invs.length} ítems de inventario en Producción...`);
  const prodInvCol = collection(db, 'inventory');
  const prodInvSnap = await getDocs(prodInvCol);
  if (!prodInvSnap.empty) await chunkedBatchDelete(prodInvSnap.docs);
  for (let i = 0; i < invs.length; i += 400) {
    const chunk = invs.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach(item => batch.set(doc(db, 'inventory', item.id), { ...item, updatedAt: new Date().toISOString() }));
    await batch.commit();
  }

  // 3. Deliveries to Prod
  if (onProgress) onProgress(`Guardando ${dels.length} entregas en Producción...`);
  const prodDelCol = collection(db, 'deliveries');
  const prodDelSnap = await getDocs(prodDelCol);
  if (!prodDelSnap.empty) await chunkedBatchDelete(prodDelSnap.docs);
  for (let i = 0; i < dels.length; i += 400) {
    const chunk = dels.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach(d => batch.set(doc(db, 'deliveries', d.id), { ...d, createdAt: d.fecha || new Date().toISOString() }));
    await batch.commit();
  }

  // 4. Properties to Prod
  if (props.length > 0) {
    if (onProgress) onProgress(`Guardando ${props.length} propiedades en Producción...`);
    const prodPropCol = collection(db, 'properties');
    const prodPropSnap = await getDocs(prodPropCol);
    if (!prodPropSnap.empty) await chunkedBatchDelete(prodPropSnap.docs);
    for (let i = 0; i < props.length; i += 400) {
      const chunk = props.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach(p => batch.set(doc(db, 'properties', p.id), { ...p, updatedAt: new Date().toISOString() }));
      await batch.commit();
    }
  }

  if (onProgress) onProgress('¡Toda la base de datos ha sido promovida a Producción!');
  return {
    beneficiariesCount: bens.length,
    inventoryCount: invs.length,
    deliveriesCount: dels.length,
    propertiesCount: props.length
  };
}

// Listeners
export function subscribeToBeneficiaries(
  onData: (data: Beneficiary[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.BENEFICIARIES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        // If firestore is empty, initial check
        onData([]);
        return;
      }
      const list: Beneficiary[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Beneficiary);
      });
      // Sort by 'no' ascending
      list.sort((a, b) => (a.no || 0) - (b.no || 0));
      saveBeneficiaries(list); // Keep local backup in sync
      onData(list);
    },
    (err) => {
      console.warn('Firestore subscription error for beneficiaries:', err);
      if (onError) onError(err);
      // Fallback to local
      onData(getStoredBeneficiaries());
    }
  );
}

export function subscribeToInventory(
  onData: (data: InventoryItem[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.INVENTORY);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onData([]);
        return;
      }
      const list: InventoryItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as InventoryItem);
      });
      saveInventory(list);
      onData(list);
    },
    (err) => {
      console.warn('Firestore subscription error for inventory:', err);
      if (onError) onError(err);
      onData(getStoredInventory());
    }
  );
}

export function subscribeToDeliveries(
  onData: (data: DeliveryRecord[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.DELIVERIES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onData([]);
        return;
      }
      const list: DeliveryRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as DeliveryRecord);
      });
      // Sort by date descending
      list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      saveDeliveries(list);
      onData(list);
    },
    (err) => {
      console.warn('Firestore subscription error for deliveries:', err);
      if (onError) onError(err);
      onData(getStoredDeliveries());
    }
  );
}

export function subscribeToProperties(
  onData: (data: PropertyRecord[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.PROPERTIES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onData([]);
        return;
      }
      const list: PropertyRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as PropertyRecord);
      });
      // Sort by aptoCode ascending
      list.sort((a, b) => a.aptoCode.localeCompare(b.aptoCode, undefined, { numeric: true, sensitivity: 'base' }));
      saveProperties(list);
      onData(list);
    },
    (err) => {
      console.warn('Firestore subscription error for properties:', err);
      if (onError) onError(err);
      onData(getStoredProperties());
    }
  );
}

// Initial Sync & Seeding
export async function initializeFirestoreDatabase(): Promise<{
  beneficiaries: Beneficiary[];
  inventory: InventoryItem[];
  deliveries: DeliveryRecord[];
}> {
  try {
    const benCol = collection(db, COLLECTIONS.BENEFICIARIES);
    const invCol = collection(db, COLLECTIONS.INVENTORY);
    const delCol = collection(db, COLLECTIONS.DELIVERIES);

    const [benSnap, invSnap, delSnap] = await Promise.all([
      getDocs(benCol),
      getDocs(invCol),
      getDocs(delCol)
    ]);

    // Check if Firestore is completely empty on first launch
    if (benSnap.empty && invSnap.empty) {
      console.log('Seeding initial data to Firestore...');
      // Use local storage data or seed data
      const initialBens = getStoredBeneficiaries().length > 0 ? getStoredBeneficiaries() : seedBeneficiaries;
      const initialInv = getStoredInventory().length > 0 ? getStoredInventory() : seedInventory;
      const initialDels = getStoredDeliveries().length > 0 ? getStoredDeliveries() : seedBeneficiaries.flatMap(b => b.historialEntregas || []);

      // Chunk writes into batches of 400
      await bulkSaveBeneficiariesToCloud(initialBens);
      await bulkSaveInventoryToCloud(initialInv);
      if (initialDels.length > 0) {
        await bulkSaveDeliveriesToCloud(initialDels);
      }

      return {
        beneficiaries: initialBens,
        inventory: initialInv,
        deliveries: initialDels
      };
    }

    const beneficiaries: Beneficiary[] = [];
    benSnap.forEach(d => beneficiaries.push(d.data() as Beneficiary));
    beneficiaries.sort((a, b) => (a.no || 0) - (b.no || 0));

    const inventory: InventoryItem[] = [];
    invSnap.forEach(d => inventory.push(d.data() as InventoryItem));

    const deliveries: DeliveryRecord[] = [];
    delSnap.forEach(d => deliveries.push(d.data() as DeliveryRecord));
    deliveries.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    // Update local cache
    saveBeneficiaries(beneficiaries);
    saveInventory(inventory);
    saveDeliveries(deliveries);

    return { beneficiaries, inventory, deliveries };
  } catch (err) {
    console.error('Error initializing Firestore:', err);
    return {
      beneficiaries: getStoredBeneficiaries(),
      inventory: getStoredInventory(),
      deliveries: getStoredDeliveries()
    };
  }
}

// Single Item Mutations
export async function syncBeneficiaryToCloud(beneficiary: Beneficiary): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.BENEFICIARIES, beneficiary.id);
    await setDoc(docRef, {
      ...beneficiary,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Error saving beneficiary to cloud:', err);
  }
}

export async function deleteBeneficiaryFromCloud(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.BENEFICIARIES, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting beneficiary from cloud:', err);
  }
}

export async function syncInventoryItemToCloud(item: InventoryItem): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.INVENTORY, item.id);
    await setDoc(docRef, {
      ...item,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Error saving inventory item to cloud:', err);
  }
}

export async function deleteInventoryItemFromCloud(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.INVENTORY, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting inventory item from cloud:', err);
  }
}

export async function syncDeliveryToCloud(delivery: DeliveryRecord): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.DELIVERIES, delivery.id);
    await setDoc(docRef, {
      ...delivery,
      createdAt: delivery.fecha || new Date().toISOString()
    });
  } catch (err) {
    console.error('Error saving delivery to cloud:', err);
  }
}

export async function deleteDeliveryFromCloud(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.DELIVERIES, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting delivery from cloud:', err);
  }
}

async function chunkedBatchDelete(docs: any[]): Promise<void> {
  const chunkSize = 400;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}

export async function bulkReplaceBeneficiariesInCloud(list: Beneficiary[]): Promise<void> {
  try {
    // 1. Delete all existing docs in beneficiaries collection safely in chunks
    const colRef = collection(db, COLLECTIONS.BENEFICIARIES);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      await chunkedBatchDelete(snap.docs);
    }

    // 2. Insert the fresh list in batches
    await bulkSaveBeneficiariesToCloud(list);
  } catch (err) {
    console.error('Error replacing beneficiaries in cloud:', err);
    throw err;
  }
}

export async function bulkReplaceDeliveriesInCloud(list: DeliveryRecord[]): Promise<void> {
  try {
    const colRef = collection(db, COLLECTIONS.DELIVERIES);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      await chunkedBatchDelete(snap.docs);
    }

    await bulkSaveDeliveriesToCloud(list);
  } catch (err) {
    console.error('Error replacing deliveries in cloud:', err);
    throw err;
  }
}

export async function bulkReplacePropertiesInCloud(list: PropertyRecord[]): Promise<void> {
  try {
    const colRef = collection(db, COLLECTIONS.PROPERTIES);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      await chunkedBatchDelete(snap.docs);
    }

    await bulkSavePropertiesToCloud(list);
  } catch (err) {
    console.error('Error replacing properties in cloud:', err);
    throw err;
  }
}

export async function clearAllCloudBeneficiariesAndDeliveries(): Promise<void> {
  try {
    const benCol = collection(db, COLLECTIONS.BENEFICIARIES);
    const delCol = collection(db, COLLECTIONS.DELIVERIES);

    const [benSnap, delSnap] = await Promise.all([
      getDocs(benCol),
      getDocs(delCol)
    ]);

    if (!benSnap.empty) {
      await chunkedBatchDelete(benSnap.docs);
    }
    if (!delSnap.empty) {
      await chunkedBatchDelete(delSnap.docs);
    }
  } catch (err) {
    console.error('Error clearing cloud database:', err);
    throw err;
  }
}

// Bulk Helpers
export async function bulkSaveBeneficiariesToCloud(list: Beneficiary[]): Promise<void> {
  const chunkSize = 400;
  for (let i = 0; i < list.length; i += chunkSize) {
    const chunk = list.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(b => {
      const docRef = doc(db, COLLECTIONS.BENEFICIARIES, b.id);
      batch.set(docRef, { ...b, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
  }
}

export async function bulkSaveInventoryToCloud(list: InventoryItem[]): Promise<void> {
  const chunkSize = 400;
  for (let i = 0; i < list.length; i += chunkSize) {
    const chunk = list.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(item => {
      const docRef = doc(db, COLLECTIONS.INVENTORY, item.id);
      batch.set(docRef, { ...item, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
  }
}

export async function bulkSaveDeliveriesToCloud(list: DeliveryRecord[]): Promise<void> {
  const chunkSize = 400;
  for (let i = 0; i < list.length; i += chunkSize) {
    const chunk = list.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(d => {
      const docRef = doc(db, COLLECTIONS.DELIVERIES, d.id);
      batch.set(docRef, { ...d, createdAt: d.fecha || new Date().toISOString() });
    });
    await batch.commit();
  }
}

export async function syncPropertyToCloud(property: PropertyRecord): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PROPERTIES, property.id);
    await setDoc(docRef, {
      ...property,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Error saving property to cloud:', err);
  }
}

export async function bulkSavePropertiesToCloud(list: PropertyRecord[]): Promise<void> {
  const chunkSize = 400;
  for (let i = 0; i < list.length; i += chunkSize) {
    const chunk = list.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(p => {
      const docRef = doc(db, COLLECTIONS.PROPERTIES, p.id);
      batch.set(docRef, { ...p, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
  }
}
