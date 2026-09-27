import type { Group } from '../domain/schema';
import { DEVICES } from '../domain/devices';
import { layoutText } from '../render/text';
import { BUNDLED_FONTS, FONT_FAMILIES, isCustomFontFamily } from '../domain/fontLibrary';
export interface ExportIssue { severity: 'error' | 'warning'; message: string; elementId?: string; slideId?: string }
export function inspectGroup(group: Group, assetIds: Set<string>, customFonts: Set<string> = new Set()): ExportIssue[] {
  const issues: ExportIssue[] = [];
  if (!group.slides.length) issues.push({ severity: 'error', message: 'Додайте хоча б один слайд.' });
  const background = (bg: Group['background'], slideId?: string) => {
    if (bg.type === 'image' && !assetIds.has(bg.asset.assetId)) issues.push({ severity: 'error', message: 'Зображення фону відсутнє.', slideId });
  };
  if (group.slides.some(s => s.background === null)) background(group.background);
  group.slides.forEach(s => { if (s.background) background(s.background, s.id); });
  for (const element of group.elements) {
    const reference = element.type === 'device' ? element.screenshot : element.type === 'image' ? element.asset : undefined;
    if ((element.type === 'device' || element.type === 'image') && (!reference || !assetIds.has(reference.assetId))) issues.push({ severity: 'error', message: element.type === 'device' ? 'Screenshot пристрою відсутній.' : reference?.fileName ? `Зображення «${reference.fileName}» відсутнє. Завантажте файл повторно.` : 'Зображення відсутнє.', elementId: element.id });
    if (element.type === 'device' && !DEVICES.some(d => d.id === element.deviceId)) issues.push({ severity: 'error', message: 'Модель пристрою недоступна.', elementId: element.id });
    if (element.type === 'text') {
      if (layoutText(element).overflow) issues.push({ severity: 'warning', message: 'Текст виходить за межі блока й буде обрізаний.', elementId: element.id });
      const fonts = new Set([element.style.fontFamily, ...element.segments.map(s => s.style.fontFamily).filter((v): v is string => !!v)]);
      for (const font of fonts) {
        if (!FONT_FAMILIES.includes(font) && !customFonts.has(font)) issues.push({ severity: 'error', message: isCustomFontFamily(font) ? 'Власний шрифт відсутній у цьому браузері. Завантажте файл і оберіть його для тексту повторно.' : `Шрифт ${font} не підтримується. Оберіть шрифт із бібліотеки.`, elementId: element.id });
        const bundled = BUNDLED_FONTS.find(item => item.name === font);
        if (bundled && !bundled.cyrillic && /[\u0400-\u052f]/.test(element.segments.map(segment => segment.text).join(''))) issues.push({ severity: 'warning', message: `Шрифт ${font} не містить кирилиці: український текст може відображатися запасним шрифтом.`, elementId: element.id });
      }
    }
  }
  return issues;
}
