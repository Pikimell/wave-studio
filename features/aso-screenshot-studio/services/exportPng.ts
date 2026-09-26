import type { Group } from '../domain/schema';
import type { StoredAsset } from './assetStore';
import { createScene, type Scene } from '../render/scene';
import { renderSlideSvg } from '../render/slide';
import { inspectGroup } from './preflight';
export function filePart(value: string) { return value.normalize('NFKC').replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 100); }
export function pngFilename(group: Group, index: number) {
  return [...[group.prefix, group.variant, group.locale].map(filePart).filter(Boolean), String(index + 1).padStart(2, '0')].join('_') + '.png';
}
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Не вдалося прочитати зображення для експорту.')); reader.readAsDataURL(blob);
  });
}
export async function prepareExport(group: Group, assets: Record<string, StoredAsset>): Promise<Scene> {
  await document.fonts.ready;
  const errors = inspectGroup(group, new Set(Object.keys(assets))).filter(issue => issue.severity === 'error');
  if (errors.length) throw new Error(errors.map(issue => issue.message).join(' '));
  if (group.width * group.height > 80_000_000) throw new Error('Полотно перевищує 80 млн пікселів. Зменште розмір групи.');
  const needed = new Set<string>();
  const background = (bg: Group['background']) => { if (bg.type === 'image') needed.add(bg.asset.assetId); };
  group.slides.forEach(s => background(s.background ?? group.background));
  group.elements.forEach(e => { if (e.type === 'image' && e.asset) needed.add(e.asset.assetId); if (e.type === 'device' && e.screenshot) needed.add(e.screenshot.assetId); });
  const entries = await Promise.all([...needed].map(async id => [id, await dataUrl(assets[id].blob)]));
  return createScene(group, Object.fromEntries(entries));
}
export async function renderPng(scene: Scene, index: number): Promise<Blob> {
  const svg = renderSlideSvg(scene, index);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  const canvas = document.createElement('canvas');
  try {
    const image = new Image(); image.src = url;
    try { await image.decode(); } catch { throw new Error('Не вдалося підготувати SVG. Перевірте зображення та спробуйте ще раз.'); }
    canvas.width = scene.group.width; canvas.height = scene.group.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Браузер не зміг створити canvas. Зменште розмір слайда.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Браузеру бракує пам’яті для PNG. Зменште розмір слайда.')), 'image/png'));
  } finally { URL.revokeObjectURL(url); canvas.width = canvas.height = 0; }
}
