/** Serializable document only. Selection, zoom, history and secrets belong to UI state. */
export const SCHEMA_VERSION = 1 as const;
export const LIMITS = { dimension: 12000, coordinate: 10_000_000, gap: 12000 };
export type Platform = 'app-store' | 'google-play';
export type AssetReference = { assetId: string; fileName?: string };
export type Background =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; mid?: string; to: string; angle: number }
  | { type: 'image'; asset: AssetReference; fit: 'cover' | 'stretch' };
export interface Padding { top: number; right: number; bottom: number; left: number }
export interface Slide { id: string; background: Background | null; padding: Padding }
export interface ElementGeometry {
  x: number; y: number; width: number; height: number; rotation: number; zIndex: number;
}
export interface ElementBase extends ElementGeometry { id: string; opacity: number }
export interface TextStyle {
  fontFamily: string; fontSize: number; fontWeight: number; italic: boolean; color: string;
}
export interface TextSegment { id: string; text: string; style: Partial<TextStyle> }
export interface TextElement extends ElementBase {
  type: 'text'; segments: TextSegment[]; style: TextStyle;
  textAlign: 'left' | 'center' | 'right'; verticalAlign: 'top' | 'center' | 'bottom';
  lineHeight: number; letterSpacing: number; padding: number; background: string | null;
  widthMode: 'fixed' | 'auto'; heightMode: 'fixed' | 'auto'; wrap: boolean;
}
export interface ShapeElement extends ElementBase {
  type: 'shape'; shape: 'rectangle' | 'ellipse'; fill: string; radius: number;
}
export interface ImageElement extends ElementBase { type: 'image'; asset: AssetReference | null; fit: 'cover' | 'contain' | 'stretch' }
export interface DeviceElement extends ElementBase { type: 'device'; deviceId: string; screenshot: AssetReference | null }
export interface DecorationElement extends ElementBase { type: 'decoration'; decorationId: string; color: string }
export type StudioElement = TextElement | ShapeElement | ImageElement | DeviceElement | DecorationElement;
export interface Group {
  id: string; name: string; platform: Platform; presetId: string;
  width: number; height: number; locale: string; prefix: string; variant: string; gap: number;
  background: Background; backgroundScope: 'group' | 'slide'; slides: Slide[]; elements: StudioElement[];
}
export interface Project {
  schemaVersion: typeof SCHEMA_VERSION; id: string; name: string;
  createdAt: string; description: string; generationNotes: string;
  audienceProfile: string; slidePlan: string; groups: Group[];
}
export const newId = () => crypto.randomUUID();
export function createProject(name = 'Untitled project'): Project {
  return { schemaVersion: SCHEMA_VERSION, id: newId(), name, createdAt: new Date().toISOString(),
    description: '', generationNotes: '', audienceProfile: '', slidePlan: '', groups: [] };
}
export function createSlide(): Slide {
  return { id: newId(), background: null, padding: { top: 80, right: 80, bottom: 80, left: 80 } };
}
export function createElement(type: StudioElement['type'], group: Group, x = 100): StudioElement {
  const base: ElementBase = {
    id: newId(), x, y: 120, width: Math.min(800, group.width - 160), height: 280,
    rotation: 0, zIndex: Math.max(-1, ...group.elements.map(e => e.zIndex)) + 1, opacity: 1
  };
  switch (type) {
    case 'text': return { ...base, type, segments: [{ id: newId(), text: 'Your next\nbig idea.', style: {} }],
      style: { fontFamily: 'Inter', fontSize: 88, fontWeight: 700, italic: false, color: '#ffffff' },
      textAlign: 'left', verticalAlign: 'top', lineHeight: 1.15, letterSpacing: 0, padding: 0,
      background: null, widthMode: 'fixed', heightMode: 'fixed', wrap: true };
    case 'shape': return { ...base, type, width: 400, height: 400, shape: 'rectangle', fill: '#a3e635', radius: 48 };
    case 'device': return { ...base, type, width: 620, height: 1280, y: 560, deviceId: 'generic-android-phone', screenshot: null };
    case 'image': return { ...base, type, width: 600, height: 600, asset: null, fit: 'cover' };
    case 'decoration': return { ...base, type, width: 360, height: 360, decorationId: 'sparkle', color: '#c4b5fd' };
  }
}

// Strict validation rejects unknown properties, duplicate IDs and non-finite/out-of-range numbers.
// Keeping this independent of React also makes it usable by file import and future MCP commands.
type Validator = (value: unknown, path: string) => void;
const fail = (path: string): never => { throw new Error(`Некоректне значення: ${path}`); };
const string = (max = 200, empty = false): Validator => (v, p) => {
  if (typeof v !== 'string' || v.length > max || (!empty && !v.trim())) fail(p);
};
const number = (min: number, max: number, integer = false): Validator => (v, p) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) fail(p);
};
const choices = (...values: unknown[]): Validator => (v, p) => { if (!values.includes(v)) fail(p); };
const nullable = (check: Validator): Validator => (v, p) => { if (v !== null) check(v, p); };
const array = (check: Validator): Validator => (v, p) => {
  if (!Array.isArray(v)) return fail(p);
  v.forEach((item, i) => check(item, `${p}[${i}]`));
};
function object(fields: Record<string, Validator>, partial = false): Validator {
  return (v, p) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return fail(p);
    const record = v as Record<string, unknown>;
    for (const key of Object.keys(record)) if (!Object.hasOwn(fields, key)) fail(`${p}.${key}`);
    for (const [key, check] of Object.entries(fields)) {
      if (!partial || Object.hasOwn(record, key)) check(record[key], `${p}.${key}`);
    }
  };
}
const color: Validator = (v, p) => { if (typeof v !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(v)) fail(p); };
const dimension = number(1, LIMITS.dimension);
const asset: Validator = (v, p) => {
  object({ assetId: string(128), fileName: string(255) }, true)(v, p);
  if (!v || typeof v !== 'object' || !Object.hasOwn(v, 'assetId')) fail(`${p}.assetId`);
};
const styleFields = { fontFamily: string(100), fontSize: number(1, 2000), fontWeight: number(100, 900, true), italic: choices(true, false), color };
const background: Validator = (v, p) => {
  const type = (v as Background | null)?.type;
  if (type === 'solid') object({ type: choices(type), color })(v, p);
  else if (type === 'gradient') {
    object({ type: choices(type), from: color, mid: color, to: color, angle: number(-360, 360) }, true)(v, p);
    for (const key of ['type', 'from', 'to', 'angle']) if (!Object.hasOwn(v as object, key)) fail(`${p}.${key}`);
  }
  else if (type === 'image') object({ type: choices(type), asset, fit: choices('cover', 'stretch') })(v, p);
  else fail(p);
};
export function validateProject(value: unknown): Project {
  if ((value as Project | null)?.schemaVersion !== SCHEMA_VERSION) throw new Error('Непідтримувана версія ASO-проєкту. Очікується schemaVersion: 1.');
  // schemaVersion 1 existed before AI project metadata. Fill the new fields while
  // importing old local projects and templates without weakening strict validation.
  const normalized = value && typeof value === 'object' && !Array.isArray(value) ? {
    description: '', generationNotes: '', audienceProfile: '', slidePlan: '',
    ...(value as Record<string, unknown>)
  } : value;
  const ids = new Set<string>();
  const id: Validator = (v, p) => {
    if (typeof v !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(v) || ids.has(v)) fail(p);
    ids.add(v as string);
  };
  const base = { id, x: number(-LIMITS.coordinate, LIMITS.coordinate), y: number(-LIMITS.coordinate, LIMITS.coordinate),
    width: dimension, height: dimension, rotation: number(-360, 360), zIndex: number(-1_000_000, 1_000_000, true), opacity: number(0, 1) };
  const element: Validator = (v, p) => {
    const type = (v as StudioElement | null)?.type;
    const common = { ...base, type: choices(type) };
    switch (type) {
      case 'text': return object({ ...common, segments: array(object({ id, text: string(100_000, true), style: object(styleFields, true) })),
        style: object(styleFields), textAlign: choices('left', 'center', 'right'), verticalAlign: choices('top', 'center', 'bottom'),
        lineHeight: number(0.1, 10), letterSpacing: number(-100, 1000), padding: number(0, 6000), background: nullable(color),
        widthMode: choices('fixed', 'auto'), heightMode: choices('fixed', 'auto'), wrap: choices(true, false) })(v, p);
      case 'shape': return object({ ...common, shape: choices('rectangle', 'ellipse'), fill: color, radius: number(0, 6000) })(v, p);
      case 'image': return object({ ...common, asset: nullable(asset), fit: choices('cover', 'contain', 'stretch') })(v, p);
      case 'device': return object({ ...common, deviceId: string(128), screenshot: nullable(asset) })(v, p);
      case 'decoration': return object({ ...common, decorationId: string(128), color })(v, p);
      default: return fail(p);
    }
  };
  const locale: Validator = (v, p) => {
    string(40)(v, p);
    try { new Intl.Locale(v as string); } catch { fail(p); }
  };
  object({ schemaVersion: choices(SCHEMA_VERSION), id, name: string(), createdAt: (v, p) => {
    string(40)(v, p); if (!Number.isFinite(Date.parse(v as string))) fail(p);
  }, description: string(20_000, true), generationNotes: string(10_000, true), audienceProfile: string(30_000, true),
  slidePlan: string(30_000, true), groups: array(object({ id, name: string(), platform: choices('app-store', 'google-play'), presetId: string(128),
    width: number(320, LIMITS.dimension, true), height: number(320, LIMITS.dimension, true), locale,
    prefix: string(100, true), variant: string(100, true), gap: number(0, LIMITS.gap), background,
    backgroundScope: choices('group', 'slide'), slides: array(object({ id, background: nullable(background),
      padding: object({ top: number(0, LIMITS.dimension), right: number(0, LIMITS.dimension), bottom: number(0, LIMITS.dimension), left: number(0, LIMITS.dimension) }) })), elements: array(element) })) })(normalized, 'project');
  return structuredClone(normalized) as Project;
}
