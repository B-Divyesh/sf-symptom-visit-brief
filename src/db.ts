import type { AppSettings, Observation } from './types';

export const demoMode =
  typeof window !== 'undefined' &&
  (window.location.pathname.replace(/\/$/, '') === '/demo' || new URLSearchParams(window.location.search).get('demo') === '1');

const DB_NAME = demoMode ? 'demo:symptom-visit-brief' : 'symptom-visit-brief';
const DB_VERSION = 1;
const defaultSettings: AppSettings = { key: 'app', presets: [], displayName: '', briefTitle: '' };

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('observations')) {
        const store = database.createObjectStore('observations', { keyPath: 'id' });
        store.createIndex('occurredAt', 'occurredAt');
      }
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('The private on-device database could not be opened.'));
  });

const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('The on-device database operation failed.'));
  });

export const listObservations = async (): Promise<Observation[]> => {
  const db = await openDatabase();
  return requestResult(db.transaction('observations').objectStore('observations').getAll());
};

export const saveObservation = async (entry: Observation): Promise<void> => {
  const db = await openDatabase();
  await requestResult(db.transaction('observations', 'readwrite').objectStore('observations').put(entry));
};

export const removeObservation = async (id: string): Promise<void> => {
  const db = await openDatabase();
  await requestResult(db.transaction('observations', 'readwrite').objectStore('observations').delete(id));
};

export const getSettings = async (): Promise<AppSettings> => {
  const db = await openDatabase();
  return (
    (await requestResult(db.transaction('settings').objectStore('settings').get('app'))) ?? defaultSettings
  );
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  const db = await openDatabase();
  await requestResult(db.transaction('settings', 'readwrite').objectStore('settings').put(settings));
};

export const clearCurrentStorage = async (): Promise<void> => {
  const db = await openDatabase();
  const transaction = db.transaction(['observations', 'settings'], 'readwrite');
  await Promise.all([
    requestResult(transaction.objectStore('observations').clear()),
    requestResult(transaction.objectStore('settings').clear())
  ]);
};

export const mergeImport = async (incoming: Observation[]): Promise<{ added: number; updated: number }> => {
  const current = new Map((await listObservations()).map((entry) => [entry.id, entry]));
  let added = 0;
  let updated = 0;
  for (const entry of incoming) {
    const existing = current.get(entry.id);
    if (!existing) {
      await saveObservation(entry);
      added += 1;
    } else if (entry.updatedAt > existing.updatedAt) {
      await saveObservation(entry);
      updated += 1;
    }
  }
  return { added, updated };
};
