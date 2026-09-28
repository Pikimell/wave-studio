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
  const svg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);
  if (![file.type, svg ? 'image/svg+xml' : ''].some(type => ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(type))) throw new Error('Оберіть PNG, JPEG, WebP або SVG.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Файл завеликий. Максимальний розмір — 20 MB.');
  if (svg) {
    const markup = await file.text();
    if (/<(?:script|foreignObject|iframe|object|embed)\b/i.test(markup) || /\son\w+\s*=/i.test(markup) || /javascript:/i.test(markup)) throw new Error('SVG містить небезпечні елементи. Очистіть файл і завантажте повторно.');
    const document = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const root = document.documentElement;
    if (root.nodeName.toLowerCase() !== 'svg' || root.querySelector('parsererror')) throw new Error('Не вдалося прочитати SVG.');
    const size = (value: string | null) => {
      const match = value?.trim().match(/^(\d+(?:\.\d+)?)/);
      return match ? Number(match[1]) : 0;
    };
    let width = size(root.getAttribute('width')), height = size(root.getAttribute('height'));
    if (!width || !height) {
      const box = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
      if (box?.length === 4 && box.every(Number.isFinite)) { width = Math.abs(box[2]); height = Math.abs(box[3]); }
    }
    if (!width || !height) throw new Error('SVG має містити width/height або viewBox.');
    if (width * height > 80_000_000 || width > 16000 || height > 16000) throw new Error('Зменште SVG до 80 млн пікселів і 16 000 px на сторону.');
    return { id: newId(), name: file.name, mimeType: 'image/svg+xml', width, height, blob: new Blob([markup], { type: 'image/svg+xml' }) };
  }
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
