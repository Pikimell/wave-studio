import { newId } from '../domain/schema';
export interface StoredAsset { id: string; name: string; mimeType: string; width: number; height: number; blob: Blob }
const DATABASE = 'aso-screenshot-studio-assets';
export async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('assets')) request.result.createObjectStore('assets', { keyPath: 'id' });
      if (!request.result.objectStoreNames.contains('fonts')) request.result.createObjectStore('fonts', { keyPath: 'family' });
    };
    request.onerror = () => reject(new Error('IndexedDB недоступна'));
    request.onsuccess = () => resolve(request.result);
    request.onblocked = () => reject(new Error('Сховище зайняте іншою вкладкою'));
  });
}
export async function loadAssets(): Promise<StoredAsset[]> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction('assets', 'readonly'), request = transaction.objectStore('assets').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Не вдалося прочитати зображення'));
    });
  } finally { db.close(); }
}
export async function prepareAsset(file: File): Promise<StoredAsset> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Оберіть PNG, JPEG або WebP.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Зображення завелике. Максимальний розмір — 20 MB.');
  let image: ImageBitmap;
  try { image = await createImageBitmap(file); } catch { throw new Error('Не вдалося декодувати зображення.'); }
  const { width, height } = image; image.close();
  if (width * height > 80_000_000 || width > 16000 || height > 16000) throw new Error('Зменште зображення до 80 млн пікселів і 16 000 px на сторону.');
  return { id: newId(), name: file.name, mimeType: file.type, width, height, blob: file };
}
export async function persistAsset(asset: StoredAsset): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('assets', 'readwrite');
      transaction.objectStore('assets').put(asset);
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () => reject(new Error('Не вдалося зберегти зображення локально.'));
    });
  } finally { db.close(); }
}
export async function deleteAsset(id: string): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('assets', 'readwrite');
      transaction.objectStore('assets').delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () => reject(new Error('Не вдалося видалити зображення з локального сховища.'));
    });
  } finally { db.close(); }
}
