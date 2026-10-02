/**
 * DiaCare Senior - IndexedDB & Offline Queue Engine (Phase 19)
 * Supports saving glucose readings, medication taken actions, and symptoms offline,
 * with automatic conflict-safe synchronization upon network reconnection.
 */

const DB_NAME = 'diacare_senior_offline_db';
const DB_VERSION = 1;
const STORE_DASHBOARD_CACHE = 'dashboard_cache';
const STORE_OFFLINE_QUEUE = 'offline_sync_queue';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_DASHBOARD_CACHE)) {
        db.createObjectStore(STORE_DASHBOARD_CACHE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_OFFLINE_QUEUE)) {
        db.createObjectStore(STORE_OFFLINE_QUEUE, { keyPath: 'offlineId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// -------------------------------------------------------------
// CACHE DASHBOARD DATA FOR IMMEDIATE OFFLINE DISPLAY
// -------------------------------------------------------------
export async function cacheSeniorDashboard(patientId, data) {
  if (!patientId || !data) return;
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_DASHBOARD_CACHE, 'readwrite');
    tx.objectStore(STORE_DASHBOARD_CACHE).put({
      id: String(patientId),
      data: JSON.parse(JSON.stringify(data)),
      cachedAt: Date.now()
    });
  } catch (err) {
    try {
      localStorage.setItem(`diacare_cache_${patientId}`, JSON.stringify(data));
    } catch (e) {}
  }
}

export async function getCachedSeniorDashboard(patientId) {
  if (!patientId) return null;
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_DASHBOARD_CACHE, 'readonly');
    const store = tx.objectStore(STORE_DASHBOARD_CACHE);
    return new Promise((resolve) => {
      const req = store.get(String(patientId));
      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data);
        } else {
          const local = localStorage.getItem(`diacare_cache_${patientId}`);
          resolve(local ? JSON.parse(local) : null);
        }
      };
      req.onerror = () => {
        const local = localStorage.getItem(`diacare_cache_${patientId}`);
        resolve(local ? JSON.parse(local) : null);
      };
    });
  } catch (err) {
    const local = localStorage.getItem(`diacare_cache_${patientId}`);
    return local ? JSON.parse(local) : null;
  }
}

// -------------------------------------------------------------
// OFFLINE QUEUE (Glucose logs, Medication actions, Symptoms)
// -------------------------------------------------------------
export async function queueOfflineItem(item) {
  const queuedItem = {
    offlineId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...item
  };

  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readwrite');
    tx.objectStore(STORE_OFFLINE_QUEUE).put(queuedItem);
  } catch (err) {
    try {
      const list = JSON.parse(localStorage.getItem('diacare_offline_queue') || '[]');
      list.push(queuedItem);
      localStorage.setItem('diacare_offline_queue', JSON.stringify(list));
    } catch (e) {}
  }

  return queuedItem;
}

export async function getQueuedOfflineItems() {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readonly');
    const store = tx.objectStore(STORE_OFFLINE_QUEUE);
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => {
        const local = localStorage.getItem('diacare_offline_queue');
        resolve(local ? JSON.parse(local) : []);
      };
    });
  } catch (err) {
    const local = localStorage.getItem('diacare_offline_queue');
    return local ? JSON.parse(local) : [];
  }
}

export async function clearQueuedOfflineItem(offlineId) {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readwrite');
    tx.objectStore(STORE_OFFLINE_QUEUE).delete(offlineId);
  } catch (err) {
    try {
      const list = JSON.parse(localStorage.getItem('diacare_offline_queue') || '[]');
      const filtered = list.filter(a => a.offlineId !== offlineId);
      localStorage.setItem('diacare_offline_queue', JSON.stringify(filtered));
    } catch (e) {}
  }
}

export async function clearAllQueuedOfflineItems() {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_OFFLINE_QUEUE, 'readwrite');
    tx.objectStore(STORE_OFFLINE_QUEUE).clear();
  } catch (err) {
    localStorage.removeItem('diacare_offline_queue');
  }
}
