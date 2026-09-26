import type { Group } from '../domain/schema';
import type { StoredAsset } from './assetStore';
import { filePart, pngFilename, prepareExport, renderPng } from './exportPng';
const crcTable = Array.from({ length: 256 }, (_, n) => {
  for (let bit = 0; bit < 8; bit++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
export function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
/** ZIP store method: PNG is already compressed. UTF-8 filenames, CRC32 and central directory. */
export async function createZip(files: { name: string; blob: Blob }[]): Promise<Blob> {
  if (files.length > 65535) throw new Error('ZIP підтримує до 65 535 файлів. Розділіть експорт на кілька груп.');
  const body: BlobPart[] = [], central: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;
  for (const file of files) {
    const name = new TextEncoder().encode(file.name), data = new Uint8Array(await file.blob.arrayBuffer());
    if (name.length > 65535 || offset + data.length > 0xffffffff) throw new Error('ZIP завеликий. Розділіть групу.');
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length), lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true); lv.setUint16(12, 33, true);
    lv.setUint32(14, crc, true); lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true); lv.setUint16(26, name.length, true); local.set(name, 30);
    const entry = new Uint8Array(46 + name.length), ev = new DataView(entry.buffer);
    ev.setUint32(0, 0x02014b50, true); ev.setUint16(4, 20, true); ev.setUint16(6, 20, true); ev.setUint16(8, 0x0800, true); ev.setUint16(14, 33, true);
    ev.setUint32(16, crc, true); ev.setUint32(20, data.length, true); ev.setUint32(24, data.length, true); ev.setUint16(28, name.length, true); ev.setUint32(42, offset, true); entry.set(name, 46);
    body.push(local, file.blob); central.push(entry); offset += local.length + data.length;
  }
  const centralSize = central.reduce((sum, entry) => sum + entry.length, 0);
  if (offset + centralSize > 0xffffffff) throw new Error('ZIP завеликий.');
  const end = new Uint8Array(22), view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true); view.setUint16(8, files.length, true); view.setUint16(10, files.length, true); view.setUint32(12, centralSize, true); view.setUint32(16, offset, true);
  return new Blob([...body, ...central, end], { type: 'application/zip' });
}
export function zipFilename(projectName: string, group: Group) {
  return [projectName, group.prefix, group.variant, group.presetId, group.locale].map(filePart).filter(Boolean).join('_') + '.zip';
}
export async function exportGroupZip(group: Group, assets: Record<string, StoredAsset>, onProgress: (done: number, total: number) => void): Promise<Blob> {
  const scene = await prepareExport(group, assets), files: { name: string; blob: Blob }[] = [];
  let bytes = 0;
  for (let index = 0; index < group.slides.length; index++) {
    const blob = await renderPng(scene, index); bytes += blob.size;
    if (bytes > 512 * 1024 * 1024) throw new Error('Група перевищує 512 MB PNG. Експортуйте меншими групами.');
    files.push({ name: pngFilename(group, index), blob }); onProgress(index + 1, group.slides.length);
  }
  return createZip(files);
}
