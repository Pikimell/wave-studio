import { MAX_DIMENSION, MAX_PNG_PIXELS, MAX_WAVES, MIN_DIMENSION, PALETTES } from './constants';
import { clamp, makeId, randomSeed, validHex } from './math';
import type { WaveLayer, WaveProject, WaveType } from './types';

export type ExportFormat = 'svg' | 'png';
type Randomizable<T> = T | 'random';

type ApiWaveLayer = {
  color?: Randomizable<string>;
  type?: Randomizable<WaveType>;
  position?: Randomizable<number>;
  amplitude?: Randomizable<number>;
  frequency?: Randomizable<number>;
  offset?: Randomizable<number>;
  opacity?: Randomizable<number>;
  seed?: Randomizable<number>;
};

type ApiGenerateRequest = {
  format?: ExportFormat;
  width?: number;
  height?: number;
  background?: Randomizable<string>;
  waves?: ApiWaveLayer[];
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message);
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const randomNumber = (min: number, max: number) => Number((min + Math.random() * (max - min)).toFixed(3));

const randomInt = (min: number, max: number) => Math.round(randomNumber(min, max));

const randomColor = () => {
  const palette = PALETTES[randomInt(0, PALETTES.length - 1)];
  return palette.colors[randomInt(0, palette.colors.length - 1)];
};

const readFormat = (value: unknown): ExportFormat => {
  if (value === 'svg' || value === 'png') return value;
  throw new ApiRequestError('Поле "format" повинно бути "svg" або "png".');
};

const readDimension = (value: unknown, field: 'width' | 'height') => {
  if (!Number.isInteger(value)) {
    throw new ApiRequestError(`Поле "${field}" повинно бути цілим числом.`);
  }

  const dimension = Number(value);
  if (dimension < MIN_DIMENSION || dimension > MAX_DIMENSION) {
    throw new ApiRequestError(`Поле "${field}" повинно бути від ${MIN_DIMENSION} до ${MAX_DIMENSION}.`);
  }

  return dimension;
};

const readHex = (value: unknown, fallback: string) => {
  if (value === 'random') return randomColor();
  if (typeof value === 'undefined') return fallback;
  if (typeof value !== 'string') throw new ApiRequestError('Колір повинен бути HEX-рядком або "random".');

  const color = validHex(value);
  if (!color) throw new ApiRequestError('Колір повинен бути у форматі #RRGGBB.');
  return color;
};

const readNumber = (value: unknown, field: string, min: number, max: number, fallback: number, integer = false) => {
  if (value === 'random') return integer ? randomInt(min, max) : randomNumber(min, max);
  if (typeof value === 'undefined') return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ApiRequestError(`Поле хвилі "${field}" повинно бути числом або "random".`);
  }

  return integer ? Math.round(clamp(value, min, max)) : clamp(value, min, max);
};

const readWaveType = (value: unknown, fallback: WaveType): WaveType => {
  if (value === 'random') return Math.random() > 0.18 ? 'fill' : 'line';
  if (typeof value === 'undefined') return fallback;
  if (value === 'fill' || value === 'line') return value;
  throw new ApiRequestError('Поле хвилі "type" повинно бути "fill", "line" або "random".');
};

const readWave = (value: unknown, index: number): WaveLayer => {
  if (!isRecord(value)) throw new ApiRequestError('Кожна хвиля повинна бути обʼєктом.');

  return {
    id: makeId(),
    color: readHex(value.color, PALETTES[0].colors[index % PALETTES[0].colors.length]),
    type: readWaveType(value.type, 'fill'),
    position: readNumber(value.position, 'position', 5, 95, clamp(57 + index * 8, 5, 95)),
    amplitude: readNumber(value.amplitude, 'amplitude', 1, 35, 16),
    frequency: readNumber(value.frequency, 'frequency', 0.8, 80, 2.2),
    offset: readNumber(value.offset, 'offset', -100, 100, 0),
    opacity: readNumber(value.opacity, 'opacity', 5, 100, 85, true),
    seed: readNumber(value.seed, 'seed', 1, 2147483647, randomSeed(), true)
  };
};

const fallbackWaves = (): WaveLayer[] =>
  PALETTES[0].colors.map((color, index) => ({
    id: makeId(),
    color,
    type: index === PALETTES[0].colors.length - 1 ? 'line' : 'fill',
    position: [57, 69, 79, 90, 43][index],
    amplitude: [22, 18, 17, 14, 7][index],
    frequency: [2.1, 1.9, 2.2, 1.9, 3.8][index],
    offset: 0,
    opacity: [88, 76, 88, 100, 95][index],
    seed: randomSeed()
  }));

export const createProjectFromApiRequest = (payload: unknown): { format: ExportFormat; project: WaveProject } => {
  if (!isRecord(payload)) throw new ApiRequestError('Тіло запиту повинно бути JSON-обʼєктом.');

  const request = payload as ApiGenerateRequest;
  const format = readFormat(request.format);
  const width = readDimension(request.width, 'width');
  const height = readDimension(request.height, 'height');

  if (format === 'png' && width * height > MAX_PNG_PIXELS) {
    throw new ApiRequestError('PNG завеликий для генерації. Зменште width або height, або використайте SVG.', 413);
  }

  if (typeof request.waves !== 'undefined' && !Array.isArray(request.waves)) {
    throw new ApiRequestError('Поле "waves" повинно бути масивом.');
  }

  const waves = request.waves?.slice(0, MAX_WAVES).map(readWave) ?? fallbackWaves();
  if (!waves.length) throw new ApiRequestError('Поле "waves" повинно містити хоча б одну хвилю.');

  return {
    format,
    project: {
      width,
      height,
      background: readHex(request.background, '#EAF5FF'),
      selectedId: null,
      waves
    }
  };
};
