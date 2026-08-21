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
import { Beneficiary, DeliveryRecord, InventoryItem } from '../types';
import { seedBeneficiaries } from '../data/seedBeneficiaries';
import { seedInventory } from '../data/seedInventory';
import { getStoredBeneficiaries, getStoredDeliveries, getStoredInventory, saveBeneficiaries, saveDeliveries, saveInventory } from './storage';

const COLLECTIONS = {
  BENEFICIARIES: 'beneficiaries',
  INVENTORY: 'inventory',
  DELIVERIES: 'deliveries',
  SYSTEM: 'system'
};

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

export async function bulkReplaceBeneficiariesInCloud(list: Beneficiary[]): Promise<void> {
  try {
    // 1. Delete all existing docs in beneficiaries collection
    const colRef = collection(db, COLLECTIONS.BENEFICIARIES);
    const snap = await getDocs(colRef);
    const deleteBatch = writeBatch(db);
    snap.docs.forEach(d => deleteBatch.delete(d.ref));
    await deleteBatch.commit();

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
    const deleteBatch = writeBatch(db);
    snap.docs.forEach(d => deleteBatch.delete(d.ref));
    await deleteBatch.commit();

    await bulkSaveDeliveriesToCloud(list);
  } catch (err) {
    console.error('Error replacing deliveries in cloud:', err);
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

    const batch = writeBatch(db);
    benSnap.docs.forEach(d => batch.delete(d.ref));
    delSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
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
  const batch = writeBatch(db);
  list.forEach(item => {
    const docRef = doc(db, COLLECTIONS.INVENTORY, item.id);
    batch.set(docRef, { ...item, updatedAt: new Date().toISOString() });
  });
  await batch.commit();
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
