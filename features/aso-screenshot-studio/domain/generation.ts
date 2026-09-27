import { createGroup } from './presets';
import { DEVICES } from './devices';
import { createSlide, newId, type Group, type TextElement } from './schema';

export type GenerationAction = 'audience' | 'plan' | 'slides';
export interface AudienceResult { audienceProfile: string }
export interface PlanResult { recommendedSlideCount: number; plan: string }
export interface GeneratedSlideSpec {
  strategicRole: string; headlineBefore: string; emphasis: string; headlineAfter: string;
  supportingText: string; screenshotBrief: string;
}
export interface GeneratedDeckSpec {
  groupName: string; locale: string;
  theme: { from: string; mid: string; to: string; accent: string; text: string; mutedText: string };
  slides: GeneratedSlideSpec[];
}
export interface GenerationPayload {
  action: GenerationAction; projectName: string; description: string; generationNotes: string;
  audienceProfile?: string; slidePlan?: string; slideCount?: number; locale?: string; presetId?: string;
}

function record(value: unknown, message = 'OpenAI повернув некоректний JSON.'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(message);
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number, label: string, empty = false): string {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim())) throw new Error(`Некоректне поле: ${label}`);
  return value;
}
function integer(value: unknown, min: number, max: number, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) throw new Error(`Некоректне поле: ${label}`);
  return value;
}
function exactKeys(value: Record<string, unknown>, keys: string[]) {
  if (Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) throw new Error('OpenAI повернув неочікувану структуру JSON.');
}
const hex = (value: unknown, label: string) => {
  const result = text(value, 7, label);
  if (!/^#[0-9A-Fa-f]{6}$/.test(result)) throw new Error(`Некоректний колір: ${label}`);
  return result.toUpperCase();
};

export function validateGenerationPayload(value: unknown): GenerationPayload {
  const source = record(value, 'Некоректний запит генерації.');
  const action = source.action;
  if (action !== 'audience' && action !== 'plan' && action !== 'slides') throw new Error('Некоректний етап генерації.');
  const payload: GenerationPayload = {
    action, projectName: text(source.projectName, 200, 'projectName'),
    description: text(source.description, 20_000, 'description'),
    generationNotes: text(source.generationNotes ?? '', 10_000, 'generationNotes', true)
  };
  if (action === 'plan' || action === 'slides') payload.audienceProfile = text(source.audienceProfile, 30_000, 'audienceProfile');
  if (action === 'plan') payload.slideCount = integer(source.slideCount ?? 6, 1, 10, 'slideCount');
  if (action === 'slides') {
    payload.slidePlan = text(source.slidePlan, 30_000, 'slidePlan');
    payload.slideCount = integer(source.slideCount, 1, 10, 'slideCount');
    payload.locale = text(source.locale, 40, 'locale');
    try { new Intl.Locale(payload.locale); } catch { throw new Error('Некоректне поле: locale'); }
    payload.presetId = text(source.presetId, 128, 'presetId');
  }
  return payload;
}

export function validateAudienceResult(value: unknown): AudienceResult {
  const source = record(value); exactKeys(source, ['audienceProfile']);
  return { audienceProfile: text(source.audienceProfile, 30_000, 'audienceProfile') };
}
export function validatePlanResult(value: unknown): PlanResult {
  const source = record(value); exactKeys(source, ['recommendedSlideCount', 'plan']);
  return { recommendedSlideCount: integer(source.recommendedSlideCount, 1, 10, 'recommendedSlideCount'), plan: text(source.plan, 30_000, 'plan') };
}
export function validateDeckSpec(value: unknown, expectedSlides: number): GeneratedDeckSpec {
  const source = record(value); exactKeys(source, ['groupName', 'locale', 'theme', 'slides']);
  const theme = record(source.theme); exactKeys(theme, ['from', 'mid', 'to', 'accent', 'text', 'mutedText']);
  if (!Array.isArray(source.slides) || source.slides.length !== expectedSlides) throw new Error(`OpenAI має повернути рівно ${expectedSlides} слайдів.`);
  const slides = source.slides.map((item, index) => {
    const slide = record(item); exactKeys(slide, ['strategicRole', 'headlineBefore', 'emphasis', 'headlineAfter', 'supportingText', 'screenshotBrief']);
    return {
      strategicRole: text(slide.strategicRole, 120, `slides[${index}].strategicRole`),
      headlineBefore: text(slide.headlineBefore, 100, `slides[${index}].headlineBefore`, true),
      emphasis: text(slide.emphasis, 80, `slides[${index}].emphasis`),
      headlineAfter: text(slide.headlineAfter, 100, `slides[${index}].headlineAfter`, true),
      supportingText: text(slide.supportingText, 180, `slides[${index}].supportingText`),
      screenshotBrief: text(slide.screenshotBrief, 600, `slides[${index}].screenshotBrief`)
    };
  });
  const locale = text(source.locale, 40, 'locale');
  try { new Intl.Locale(locale); } catch { throw new Error('OpenAI повернув некоректну locale.'); }
  return { groupName: text(source.groupName, 200, 'groupName'), locale, theme: {
    from: hex(theme.from, 'theme.from'), mid: hex(theme.mid, 'theme.mid'), to: hex(theme.to, 'theme.to'),
    accent: hex(theme.accent, 'theme.accent'), text: hex(theme.text, 'theme.text'), mutedText: hex(theme.mutedText, 'theme.mutedText')
  }, slides };
}

function textElement(x: number, y: number, width: number, height: number, fontSize: number, color: string, segments: TextElement['segments'], zIndex: number, weight = 700): TextElement {
  return { id: newId(), type: 'text', x, y, width, height, rotation: 0, zIndex, opacity: 1, segments,
    style: { fontFamily: 'Inter', fontSize, fontWeight: weight, italic: false, color }, textAlign: 'center', verticalAlign: 'top',
    lineHeight: 1.08, letterSpacing: 0, padding: 0, background: null, widthMode: 'fixed', heightMode: 'fixed', wrap: true };
}

/** Converts safe AI copy into the native editable Group document. */
export function deckSpecToGroup(spec: GeneratedDeckSpec, presetId: string): Group {
  const group = createGroup(presetId, { name: spec.groupName, locale: spec.locale, prefix: 'ai-generated', variant: 'A', gap: 60 });
  const margin = Math.round(group.width * 0.075), contentWidth = group.width - margin * 2;
  const headlineSize = Math.max(54, Math.round(group.width * 0.077));
  const supportingSize = Math.max(28, Math.round(group.width * 0.034));
  group.backgroundScope = 'slide';
  group.background = { type: 'gradient', from: spec.theme.from, mid: spec.theme.mid, to: spec.theme.to, angle: 35 };
  group.slides = spec.slides.map((_, index) => ({ ...createSlide(), background: {
    type: 'gradient', from: index % 2 ? spec.theme.mid : spec.theme.from, mid: spec.theme.mid,
    to: index % 2 ? spec.theme.from : spec.theme.to, angle: index % 2 ? 145 : 35
  } }));
  const deviceId = presetId.includes('ipad') ? 'ipad-pro-12-9'
    : presetId.includes('tablet') ? 'generic-android-tablet'
    : presetId.includes('mac') || presetId.includes('chromebook') ? 'macbook-air-13'
    : presetId.startsWith('play-') ? 'pixel-9-pro' : 'iphone-16-max';
  const device = DEVICES.find(item => item.id === deviceId)!;
  group.elements = spec.slides.flatMap((slide, index) => {
    const x = index * (group.width + group.gap) + margin;
    const headline = textElement(x, Math.round(group.height * 0.075), contentWidth, Math.round(group.height * 0.19), headlineSize, spec.theme.text, [
      { id: newId(), text: slide.headlineBefore, style: {} },
      { id: newId(), text: slide.emphasis, style: { color: spec.theme.accent, fontWeight: 900 } },
      { id: newId(), text: slide.headlineAfter, style: {} }
    ], 3, 800);
    const supporting = textElement(x, Math.round(group.height * 0.275), contentWidth, Math.round(group.height * 0.085), supportingSize, spec.theme.mutedText,
      [{ id: newId(), text: slide.supportingText, style: {} }], 4, 500);
    const deviceRatio = device.height / device.width;
    const deviceWidth = Math.round(Math.min(group.width * 0.67, group.height * 0.55 / deviceRatio));
    const deviceHeight = Math.round(deviceWidth * deviceRatio);
    return [headline, supporting, { id: newId(), type: 'device' as const,
      x: x + Math.round((contentWidth - deviceWidth) / 2), y: Math.round(group.height * 0.405), width: deviceWidth,
      height: deviceHeight, rotation: 0, zIndex: 2, opacity: 1, deviceId, screenshot: null }];
  });
  return group;
}
