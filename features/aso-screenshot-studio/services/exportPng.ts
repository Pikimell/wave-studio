import type { Group } from '../domain/schema';
import type { StoredAsset } from './assetStore';
import type { StoredFont } from './fontStore';
import { createScene, type Scene } from '../render/scene';
import { renderSlideSvg } from '../render/slide';
import { inspectGroup } from './preflight';
import { BUNDLED_FONTS, fontFiles } from '../domain/fontLibrary';
import { DEVICES } from '../domain/devices';
export function filePart(value: string) { return value.normalize('NFKC').replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 100); }
export function pngFilename(group: Group, index: number) {
  return [...[group.prefix, group.variant, group.locale].map(filePart).filter(Boolean), String(index + 1).padStart(2, '0')].join('_') + '.png';
}
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Не вдалося прочитати зображення для експорту.')); reader.readAsDataURL(blob);
  });
}
export async function prepareExport(group: Group, assets: Record<string, StoredAsset>, customFonts: Record<string, StoredFont> = {}): Promise<Scene> {
  const usedFonts = new Set(group.elements.flatMap(element => element.type === 'text' ? [element.style.fontFamily, ...element.segments.map(segment => segment.style.fontFamily).filter((font): font is string => !!font)] : []));
  await Promise.all([...usedFonts].map(font => document.fonts.load(`400 16px "${font}"`, 'Aa ЯЇЄ')));
  await document.fonts.ready;
  const errors = inspectGroup(group, new Set(Object.keys(assets)), new Set(Object.keys(customFonts))).filter(issue => issue.severity === 'error');
  if (errors.length) throw new Error(errors.map(issue => issue.message).join(' '));
  if (group.width * group.height > 80_000_000) throw new Error('Полотно перевищує 80 млн пікселів. Зменште розмір групи.');
  const needed = new Set<string>();
  const background = (bg: Group['background']) => { if (bg.type === 'image') needed.add(bg.asset.assetId); };
  group.slides.forEach(s => background(s.background ?? group.background));
  group.elements.forEach(e => { if ((e.type === 'image' || e.type === 'svg') && e.asset) needed.add(e.asset.assetId); if (e.type === 'device' && e.screenshot) needed.add(e.screenshot.assetId); });
  const entries = await Promise.all([...needed].map(async id => [id, await dataUrl(assets[id].blob)]));
  const deviceArtwork = await Promise.all([...new Set(group.elements.filter(element => element.type === 'device').map(element => element.deviceId))].map(async id => {
    const device = DEVICES.find(item => item.id === id);
    if (!device?.artworkPath) return null;
    const response = await fetch(device.artworkPath);
    if (!response.ok) throw new Error(`Не вдалося завантажити мокап ${device.name} для експорту.`);
    return [`device-artwork:${id}`, await dataUrl(await response.blob())] as const;
  }));
  const embeddedFonts = await Promise.all(BUNDLED_FONTS.filter(font => usedFonts.has(font.name)).flatMap(font => fontFiles(font).map(async file => {
    const response = await fetch(file.url);
    if (!response.ok) throw new Error(`Не вдалося завантажити шрифт ${font.name} для експорту.`);
    const source = await dataUrl(await response.blob());
    const range = file.subset === 'latin' ? 'U+0000-03FF,U+1E00-1EFF,U+2000-20FF' : 'U+0400-052F,U+1C80-1C8A';
    return `@font-face{font-family:'${font.name}';font-style:normal;font-weight:${file.weight ?? '100 900'};src:url('${source}') format('woff2');unicode-range:${range}}`;
  })));
  const embeddedCustomFonts = await Promise.all([...usedFonts].filter(font => customFonts[font]).map(async family => {
    const font = customFonts[family];
    return `@font-face{font-family:'${font.family}';font-style:normal;font-weight:100 900;src:url('${await dataUrl(font.blob)}') format('${font.format}')}`;
  }));
  return { ...createScene(group, Object.fromEntries([...entries, ...deviceArtwork.filter((entry): entry is NonNullable<typeof entry> => !!entry)])), fontCss: [...embeddedFonts, ...embeddedCustomFonts].join('') };
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
