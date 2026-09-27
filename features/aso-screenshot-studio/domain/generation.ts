import { createGroup } from './presets';
import { DEVICES } from './devices';
import { createSlide, newId, LIMITS, type Group, type StudioElement, type TextElement } from './schema';

export const COMPOSITIONS = ['hero', 'tilted', 'duo', 'split-left', 'split-right', 'close-up'] as const;
export type Composition = typeof COMPOSITIONS[number];
export type GenerationAction = 'audience' | 'plan' | 'slides';
export interface AudienceResult { audienceProfile: string }
export interface PlanResult { recommendedSlideCount: number; plan: string }
export interface GeneratedSlideSpec {
  strategicRole: string; headlineBefore: string; emphasis: string; headlineAfter: string;
  supportingText: string; screenshotBrief: string; userTakeaway: string;
  composition: Composition; compositionReason: string;
}
export interface GeneratedDeckSpec {
  groupName: string; locale: string; artDirection: string;
  theme: { from: string; mid: string; to: string; accent: string; text: string; mutedText: string; angle: number; motif: 'none' | 'orbs' | 'ribbon' };
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
  const source = record(value); exactKeys(source, ['groupName', 'locale', 'artDirection', 'theme', 'slides']);
  const theme = record(source.theme); exactKeys(theme, ['from', 'mid', 'to', 'accent', 'text', 'mutedText', 'angle', 'motif']);
  if (theme.motif !== 'none' && theme.motif !== 'orbs' && theme.motif !== 'ribbon') throw new Error('Некоректне поле: theme.motif');
  if (!Array.isArray(source.slides) || source.slides.length !== expectedSlides) throw new Error(`OpenAI має повернути рівно ${expectedSlides} слайдів.`);
  const slides = source.slides.map((item, index) => {
    const slide = record(item); exactKeys(slide, ['strategicRole', 'userTakeaway', 'headlineBefore', 'emphasis', 'headlineAfter', 'supportingText', 'screenshotBrief', 'composition', 'compositionReason']);
    if (!COMPOSITIONS.includes(slide.composition as Composition)) throw new Error(`Некоректна композиція: slides[${index}]`);
    return {
      composition: slide.composition as Composition,
      compositionReason: text(slide.compositionReason, 600, `slides[${index}].compositionReason`),
      userTakeaway: text(slide.userTakeaway, 400, `slides[${index}].userTakeaway`),
      strategicRole: text(slide.strategicRole, 120, `slides[${index}].strategicRole`),
      headlineBefore: text(slide.headlineBefore, 100, `slides[${index}].headlineBefore`, true),
      emphasis: text(slide.emphasis, 80, `slides[${index}].emphasis`),
      headlineAfter: text(slide.headlineAfter, 100, `slides[${index}].headlineAfter`, true),
      supportingText: text(slide.supportingText, 180, `slides[${index}].supportingText`, true),
      screenshotBrief: text(slide.screenshotBrief, 1200, `slides[${index}].screenshotBrief`)
    };
  });
  const locale = text(source.locale, 40, 'locale');
  try { new Intl.Locale(locale); } catch { throw new Error('OpenAI повернув некоректну locale.'); }
  return { groupName: text(source.groupName, 200, 'groupName'), locale, artDirection: text(source.artDirection, 1200, 'artDirection'), theme: {
    angle: integer(theme.angle, 0, 180, 'theme.angle'), motif: theme.motif,
    from: hex(theme.from, 'theme.from'), mid: hex(theme.mid, 'theme.mid'), to: hex(theme.to, 'theme.to'),
    accent: hex(theme.accent, 'theme.accent'), text: hex(theme.text, 'theme.text'), mutedText: hex(theme.mutedText, 'theme.mutedText')
  }, slides };
}

function textElement(x: number, y: number, width: number, height: number, fontSize: number, color: string, segments: TextElement['segments'], zIndex: number, weight = 700): TextElement {
  return { id: newId(), type: 'text', x, y, width, height, rotation: 0, zIndex, opacity: 1, segments,
    style: { fontFamily: 'Inter', fontSize, fontWeight: weight, italic: false, color }, textAlign: 'center', verticalAlign: 'top',
    lineHeight: 1.08, letterSpacing: 0, padding: 0, background: null, widthMode: 'fixed', heightMode: 'fixed', wrap: true };
}

/** Converts the validated creative specification into native editable elements. */
export function deckSpecToGroup(spec: GeneratedDeckSpec, presetId: string): Group {
  // No hidden strips between exported slides: adjacent crops share the same panorama.
  const group = createGroup(presetId, { name: spec.groupName, locale: spec.locale, prefix: 'ai-generated', variant: 'A', gap: 0 });
  const w = group.width, h = group.height;
  group.backgroundScope = 'group';
  group.background = { type: 'gradient', from: spec.theme.from, mid: spec.theme.mid, to: spec.theme.to, angle: spec.theme.angle };
  group.slides = spec.slides.map(() => createSlide());
  const deviceId = presetId.includes('ipad') ? 'ipad-pro-12-9'
    : presetId.includes('tablet') ? 'generic-android-tablet'
    : presetId.includes('mac') || presetId.includes('chromebook') ? 'macbook-air-13'
    : presetId.startsWith('play-') ? 'pixel-9-pro' : 'iphone-16-max';
  const device = DEVICES.find(item => item.id === deviceId)!;
  const ratio = device.height / device.width;
  const elements: StudioElement[] = [];
  // Shared shapes straddle boundaries in group coordinates; the existing renderer
  // crops the same objects for both preview and individual slide exports.
  if (spec.theme.motif === 'ribbon') {
    const totalWidth = w * group.slides.length;
    // Tile a single flat ribbon without overlapping translucent sections, while
    // respecting the native document's maximum element dimension.
    for (let x = 0; x < totalWidth; x += LIMITS.dimension) {
      elements.push({ id: newId(), type: 'shape', shape: 'rectangle', x, y: h * 0.7,
        width: Math.min(LIMITS.dimension, totalWidth - x), height: h * 0.18,
        rotation: 0, zIndex: 0, opacity: 0.09, fill: spec.theme.accent, radius: 0 });
    }
  } else if (spec.theme.motif === 'orbs') {
    for (let seam = 1; seam < group.slides.length; seam++) {
      elements.push({ id: newId(), type: 'shape', shape: 'ellipse',
        x: seam * w - w * 0.4, y: h * 0.48, width: w * 0.8, height: h * 0.48,
        rotation: 0, zIndex: 0, opacity: 0.09, fill: spec.theme.accent, radius: 0 });
    }
  }
  spec.slides.forEach((slide, index) => {
    const offset = index * w;
    const split = slide.composition === 'split-left' || slide.composition === 'split-right';
    const textRight = slide.composition === 'split-right';
    const tx = split ? (textRight ? 0.54 : 0.06) : 0.075;
    const tw = split ? 0.4 : 0.85;
    const ty = split ? 0.22 : 0.06;
    const th = split ? 0.33 : 0.21;
    const copy = slide.headlineBefore + slide.emphasis + slide.headlineAfter;
    // Conservative sizing for short approved copy and longer localized headlines.
    const estimatedLines = (value: string, width: number, fontSize: number) => value.split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(Array.from(line).length * fontSize * 0.7 / width)), 0);
    const fitSize = (value: string, width: number, height: number, preferred: number) => {
      let size = preferred;
      while (size > 12 && estimatedLines(value, width, size) * size * 1.08 > height) size -= 1;
      return size;
    };
    const headlineSize = fitSize(copy, w * tw, h * th, Math.min(w * (split ? 0.067 : 0.077), h * 0.095));
    const headline = textElement(offset + w * tx, h * ty, w * tw, h * th, headlineSize, spec.theme.text, [
      { id: newId(), text: slide.headlineBefore, style: {} },
      { id: newId(), text: slide.emphasis, style: { color: spec.theme.accent, fontWeight: 900 } },
      { id: newId(), text: slide.headlineAfter, style: {} }
    ], 3, 800);
    headline.height = Math.min(h * th, estimatedLines(copy, w * tw, headlineSize) * headlineSize * 1.08);
    headline.textAlign = split || slide.composition === 'tilted' ? 'left' : 'center';
    elements.push(headline);
    if (slide.supportingText.trim()) {
      const sh = split ? 0.19 : 0.08;
      const supporting = textElement(offset + w * tx, headline.y + headline.height + Math.min(h * 0.018, headlineSize * 0.4), w * tw, h * sh,
        fitSize(slide.supportingText, w * tw, h * sh, Math.min(w * 0.034, h * 0.044)), spec.theme.mutedText,
        [{ id: newId(), text: slide.supportingText, style: {} }], 4, 500);
      supporting.textAlign = headline.textAlign;
      elements.push(supporting);
    }
    const addDevice = (cx: number, cy: number, boxWidth: number, boxHeight: number, rotation = 0, zIndex = 2, crop = false) => {
      const radians = Math.abs(rotation) * Math.PI / 180;
      // Fit the ROTATED bounds, not only the unrotated frame, into the reserved box.
      const dw = Math.min(boxWidth / (Math.cos(radians) + ratio * Math.sin(radians)), boxHeight / (ratio * Math.cos(radians) + Math.sin(radians)));
      const dh = dw * ratio;
      elements.push({ id: newId(), type: 'device', x: offset + cx - dw / 2,
        y: crop ? cy : cy - dh / 2, width: dw, height: dh, rotation, zIndex, opacity: 1, deviceId, screenshot: null });
    };
    if (split) {
      addDevice(w * (textRight ? 0.265 : 0.735), h * 0.54, w * 0.43, h * 0.8);
    } else if (slide.composition === 'duo') {
      addDevice(w * 0.31, h * 0.63, w * 0.46, h * 0.49, -5, 1);
      addDevice(w * 0.69, h * 0.70, w * 0.46, h * 0.49, 5, 2);
    } else if (slide.composition === 'close-up') {
      // Only the bottom may leave the slide, keeping neighboring slides undisturbed.
      addDevice(w * 0.5, h * 0.40, w * 0.88, h * 0.82, 0, 2, true);
    } else {
      addDevice(w * 0.5, h * 0.68, w * 0.82, h * 0.57, slide.composition === 'tilted' ? -7 : 0);
    }
  });
  group.elements = elements;
  return group;
}
