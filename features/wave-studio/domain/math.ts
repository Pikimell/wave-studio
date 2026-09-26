import { MAX_FREQUENCY, MIN_FREQUENCY } from './constants';

export const makeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`.replaceAll('.', '-');
};

export const randomSeed = () => Math.floor(Math.random() * 2147483647);

export const clamp = (value: unknown, min: number, max: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : min;
};

export const validHex = (value: string | undefined | null) => {
  if (!value) return null;
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : null;
};

export const normalizeHex = (value: string) => validHex(value.startsWith('#') ? value : `#${value}`);

export const frequencyToSlider = (value: number) =>
  Math.round((Math.log(value / MIN_FREQUENCY) / Math.log(MAX_FREQUENCY / MIN_FREQUENCY)) * 1000);

export const sliderToFrequency = (value: number | string) =>
  Number((MIN_FREQUENCY * (MAX_FREQUENCY / MIN_FREQUENCY) ** (Number(value) / 1000)).toFixed(3));

export const formatFrequency = (value: number) => `${Number(value.toFixed(2))}x`;

export const formatOffset = (value: number) => `${value > 0 ? '+' : ''}${value}%`;

export const blendWithWhite = (hex: string, ratio: number) => {
  const components = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  return `#${components
    .map((component) => Math.round(component + (255 - component) * ratio).toString(16).padStart(2, '0'))
    .join('')}`;
};
