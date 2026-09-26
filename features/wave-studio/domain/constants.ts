import type { Palette } from './types';

export const STORAGE_KEY = 'wave-studio-project-v2';
export const THEME_KEY = 'wave-studio-theme';
export const MAX_DIMENSION = 12000;
export const MIN_DIMENSION = 256;
export const MAX_WAVES = 20;
export const MAX_PNG_PIXELS = 80000000;
export const MIN_FREQUENCY = 0.8;
export const MAX_FREQUENCY = 80;

export const CANVAS_PRESETS = [
  { label: 'Банер', width: 1920, height: 640 },
  { label: 'Екран', width: 1920, height: 1080 },
  { label: 'Квадрат', width: 1080, height: 1080 }
] as const;

export const PALETTES: Palette[] = [
  { name: 'Блакить', background: '#EAF5FF', colors: ['#C6E3FF', '#9DC9F3', '#6EA9E4', '#F7FBFF', '#5D9DEC'] },
  { name: 'Лаванда', background: '#F5F0FF', colors: ['#DDD0FA', '#BBA8ED', '#997DDC', '#FCFAFF', '#846DCB'] },
  { name: 'Захід', background: '#FFF3EB', colors: ['#FFD9C5', '#FFB997', '#EE8C82', '#FFFAF5', '#D97488'] }
];
