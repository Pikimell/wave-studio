import { getPhoneModel } from './models';
import { getPhonePreset } from './presets';
import type {
  PhoneDeviceId,
  PhoneFilters,
  PhoneLanguage,
  PhoneMockupJson,
  PhoneMockupProject,
  PhoneOrientation,
  PhonePresetId,
  PhoneRotation
} from './types';

export const DEFAULT_PHONE_PROJECT: PhoneMockupProject = {
  language: 'uk',
  deviceId: 'iphone-15-pro-max',
  orientation: 'portrait',
  presetId: 'hero',
  mirrored: false,
  filters: {
    brightness: 100,
    contrast: 100,
    saturation: 100
  },
  scene: {
    exposure: 100,
    rotation: {
      x: 0,
      y: 0,
      z: 0
    }
  }
};

const LANGUAGES: PhoneLanguage[] = ['en', 'uk', 'fr', 'es', 'de', 'it', 'pt', 'ja', 'zh'];
const ORIENTATIONS: PhoneOrientation[] = ['portrait', 'landscape'];
const PRESETS: PhonePresetId[] = ['hero', 'straight', 'floating', 'tilt', 'back', 'low-angle', 'top-down', 'back-angle', 'profile', 'dramatic', 'isometric', 'overhead', 'custom'];

const clamp = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const isDeviceId = (value: unknown): value is PhoneDeviceId => typeof value === 'string' && getPhoneModel(value as PhoneDeviceId).id === value;

const normalizeFilters = (filters?: Partial<PhoneFilters>): PhoneFilters => ({
  brightness: clamp(filters?.brightness, DEFAULT_PHONE_PROJECT.filters.brightness, 0, 200),
  contrast: clamp(filters?.contrast, DEFAULT_PHONE_PROJECT.filters.contrast, 0, 200),
  saturation: clamp(filters?.saturation, DEFAULT_PHONE_PROJECT.filters.saturation, 0, 200)
});

const normalizeRotation = (rotation?: Partial<PhoneRotation>): PhoneRotation => ({
  x: clamp(rotation?.x, DEFAULT_PHONE_PROJECT.scene.rotation.x, 0, 100),
  y: clamp(rotation?.y, DEFAULT_PHONE_PROJECT.scene.rotation.y, 0, 100),
  z: clamp(rotation?.z, DEFAULT_PHONE_PROJECT.scene.rotation.z, 0, 100)
});

export const normalizePhoneProject = (input: PhoneMockupJson = {}): PhoneMockupProject => {
  const presetId = PRESETS.includes(input.presetId as PhonePresetId) ? input.presetId as PhonePresetId : DEFAULT_PHONE_PROJECT.presetId;

  return {
    language: LANGUAGES.includes(input.language as PhoneLanguage) ? input.language as PhoneLanguage : DEFAULT_PHONE_PROJECT.language,
    deviceId: isDeviceId(input.deviceId) ? input.deviceId : DEFAULT_PHONE_PROJECT.deviceId,
    orientation: ORIENTATIONS.includes(input.orientation as PhoneOrientation) ? input.orientation as PhoneOrientation : DEFAULT_PHONE_PROJECT.orientation,
    presetId: presetId === 'custom' || getPhonePreset(presetId) ? presetId : DEFAULT_PHONE_PROJECT.presetId,
    mirrored: typeof input.mirrored === 'boolean' ? input.mirrored : DEFAULT_PHONE_PROJECT.mirrored,
    filters: normalizeFilters(input.filters),
    scene: {
      exposure: clamp(input.scene?.exposure, DEFAULT_PHONE_PROJECT.scene.exposure, 30, 220),
      rotation: normalizeRotation(input.scene?.rotation)
    }
  };
};

export const parsePhoneProjectJson = (json: string) => normalizePhoneProject(JSON.parse(json) as PhoneMockupJson);
