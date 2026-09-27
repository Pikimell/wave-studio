import { newId } from '../domain/schema';
import { openDatabase } from './assetStore';

export interface StoredFont { family: string; name: string; format: 'woff2' | 'woff' | 'truetype' | 'opentype'; blob: Blob }

export async function prepareFont(file: File): Promise<StoredFont> {
  if (file.size > 10 * 1024 * 1024 || file.size < 12) throw new Error('Шрифт має бути меншим за 10 MB.');
  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const signature = String.fromCharCode(...header);
  const format = signature === 'wOF2' ? 'woff2' : signature === 'wOFF' ? 'woff' : signature === 'OTTO' ? 'opentype' : header[0] === 0 && header[1] === 1 && header[2] === 0 && header[3] === 0 ? 'truetype' : null;
  if (!format) throw new Error('Оберіть справжній файл WOFF2, WOFF, TTF або OTF.');
  const name = file.name.replace(/\.(woff2?|ttf|otf)$/i, '').trim().slice(0, 90);
  if (!name) throw new Error('Файл шрифту має мати назву.');
  return { family: `custom-font-${newId()}`, name, format, blob: file };
}

export async function loadFonts(): Promise<StoredFont[]> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('fonts', 'readonly').objectStore('fonts').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Не вдалося прочитати шрифти.'));
    });
  } finally { db.close(); }
}

export async function persistFont(font: StoredFont): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('fonts', 'readwrite');
      transaction.objectStore('fonts').put(font);
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () => reject(new Error('Не вдалося зберегти шрифт локально.'));
    });
  } finally { db.close(); }
}
