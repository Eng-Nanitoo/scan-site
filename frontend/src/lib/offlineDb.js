const DB_NAME = 'grad-checkin';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('cards')) {
        const store = db.createObjectStore('cards', { keyPath: 'unique_key' });
        store.createIndex('id', 'id', { unique: true });
      }
      if (!db.objectStoreNames.contains('scanQueue')) {
        db.createObjectStore('scanQueue', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txPromise(db, storeName, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = fn(store);
    if (result && typeof result.onsuccess !== 'undefined') {
      result.onsuccess = () => resolve(result.result);
      result.onerror = () => reject(result.error);
    } else {
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
    }
  });
}

export async function saveCards(cards) {
  const db = await openDb();
  const tx = db.transaction('cards', 'readwrite');
  const store = tx.objectStore('cards');
  for (const card of cards) {
    store.put({
      unique_key: card.unique_key,
      id: card.id,
      guest_name: card.guest_name,
      scanned: card.scanned,
      scanned_at: card.scanned_at || null,
    });
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getCardByKey(uniqueKey) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cards', 'readonly');
    const req = tx.objectStore('cards').get(uniqueKey);
    req.onsuccess = () => { db.close(); resolve(req.result || null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function markCardScannedLocally(uniqueKey, scannedAt) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cards', 'readwrite');
    const store = tx.objectStore('cards');
    const req = store.get(uniqueKey);
    req.onsuccess = () => {
      const card = req.result;
      if (card) {
        card.scanned = true;
        card.scanned_at = scannedAt || new Date().toISOString();
        store.put(card);
      }
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getCardsCount() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cards', 'readonly');
    const req = tx.objectStore('cards').count();
    req.onsuccess = () => { db.close(); resolve(req.result); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function addToQueue(item) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('scanQueue', 'readwrite');
    const req = tx.objectStore('scanQueue').add({
      unique_key: item.unique_key,
      queuedAt: Date.now(),
    });
    req.onsuccess = () => {
      const id = req.result;
      tx.oncomplete = () => { db.close(); resolve(id); };
    };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getQueue() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('scanQueue', 'readonly');
    const req = tx.objectStore('scanQueue').getAll();
    req.onsuccess = () => { db.close(); resolve(req.result || []); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function clearQueue() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('scanQueue', 'readwrite');
    tx.objectStore('scanQueue').clear();
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function removeFromQueue(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('scanQueue', 'readwrite');
    tx.objectStore('scanQueue').delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function saveSettings(settings) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    tx.objectStore('settings').put({ key: 'app', ...settings });
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getSettings() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readonly');
    const req = tx.objectStore('settings').get('app');
    req.onsuccess = () => { db.close(); resolve(req.result || null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}
