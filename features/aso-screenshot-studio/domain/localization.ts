import { newId, type Group } from './schema';
export interface LocalizableSegment { id: string; elementId: string; lines: string[] }
export interface LocalizationPayload { sourceLocale: string; targetLocales: string[]; segments: LocalizableSegment[] }
export interface Translation { locale: string; segments: { id: string; lines: string[] }[] }
export function collectText(group: Group): LocalizableSegment[] {
  return group.elements.flatMap(e => e.type === 'text' ? e.segments.map(s => ({ id: s.id, elementId: e.id, lines: s.text.replace(/\r\n?/g, '\n').split('\n') })) : []);
}
export function validatePayload(value: unknown): LocalizationPayload {
  if (!value || typeof value !== 'object') throw new Error('Некоректний запит локалізації.');
  const p = value as LocalizationPayload;
  const validLocale = (locale: unknown): locale is string => {
    if (typeof locale !== 'string' || locale.length > 40) return false;
    try { new Intl.Locale(locale); return true; } catch { return false; }
  };
  if (!validLocale(p.sourceLocale) || !Array.isArray(p.targetLocales) || !p.targetLocales.length || p.targetLocales.length > 10 || !p.targetLocales.every(validLocale) || new Set(p.targetLocales).size !== p.targetLocales.length || p.targetLocales.includes(p.sourceLocale)) throw new Error('Оберіть від 1 до 10 різних цільових мов.');
  if (!Array.isArray(p.segments) || !p.segments.length || p.segments.length > 500) throw new Error('Група має містити від 1 до 500 текстових фрагментів.');
  const ids = new Set<string>(); let length = 0;
  for (const segment of p.segments) {
    if (!segment || typeof segment.id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(segment.id) || typeof segment.elementId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(segment.elementId) || ids.has(segment.id) || !Array.isArray(segment.lines) || !segment.lines.length || segment.lines.length > 1000 || segment.lines.some(line => typeof line !== 'string' || /[\r\n]/.test(line))) throw new Error('Некоректна структура текстових фрагментів.');
    ids.add(segment.id); length += segment.lines.join('').length;
  }
  if (length > 20000) throw new Error('За один запит можна перекласти до 20 000 символів. Розділіть групу.');
  // Only these text fields leave the server; ignore any unexpected client properties.
  return { sourceLocale: p.sourceLocale, targetLocales: [...p.targetLocales], segments: p.segments.map(s => ({ id: s.id, elementId: s.elementId, lines: [...s.lines] })) };
}
export function validateTranslations(value: unknown, payload: LocalizationPayload): Translation[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { translations?: unknown }).translations)) throw new Error('Модель повернула некоректний переклад.');
  const translations = (value as { translations: Translation[] }).translations;
  if (translations.length !== payload.targetLocales.length) throw new Error('Модель переклала не всі мови. Групи не створені.');
  const locales = new Set<string>();
  const sources = new Map(payload.segments.map(s => [s.id, s]));
  for (const translation of translations) {
    if (!translation || !payload.targetLocales.includes(translation.locale) || locales.has(translation.locale) || !Array.isArray(translation.segments) || translation.segments.length !== sources.size) throw new Error('Модель змінила мови або кількість фрагментів.');
    locales.add(translation.locale); const ids = new Set<string>();
    for (const segment of translation.segments) {
      const source = segment && sources.get(segment.id);
      if (!source || ids.has(segment.id) || !Array.isArray(segment.lines) || segment.lines.length !== source.lines.length || segment.lines.some(line => typeof line !== 'string' || line.length > 100000 || /[\r\n]/.test(line))) throw new Error('Модель змінила ID або ручні переноси. Спробуйте ще раз.');
      ids.add(segment.id);
    }
  }
  return payload.targetLocales.map(locale => {
    const item = translations.find(t => t.locale === locale)!;
    return { locale, segments: item.segments.map(s => ({ id: s.id, lines: [...s.lines] })) };
  });
}
export function translatedGroups(source: Group, translations: Translation[]): Group[] {
  validateTranslations({ translations }, { sourceLocale: source.locale, targetLocales: translations.map(t => t.locale), segments: collectText(source) });
  return translations.map(translation => {
    const text = new Map(translation.segments.map(s => [s.id, s.lines.join('\n')]));
    const group = structuredClone(source);
    group.id = newId(); group.locale = translation.locale; group.name = `${source.name.slice(0, 155)} / ${translation.locale}`;
    group.slides = group.slides.map(s => ({ ...s, id: newId() }));
    group.elements = group.elements.map(e => e.type === 'text' ? { ...e, id: newId(), segments: e.segments.map(s => ({ ...s, id: newId(), text: text.get(s.id)! })) } : { ...e, id: newId() });
    return group;
  });
}
