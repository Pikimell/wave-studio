import { MAX_DIMENSION, MAX_WAVES, MIN_DIMENSION } from './constants';
import { clamp, makeId, randomSeed, validHex } from './math';
import type { WaveLayer, WaveProject } from './types';

export const createInitialProject = (): WaveProject => ({
  width: 1920,
  height: 640,
  background: '#EAF5FF',
  selectedId: null,
  waves: [
    { id: makeId(), color: '#C6E3FF', type: 'fill', position: 57, amplitude: 22, frequency: 2.1, offset: 0, opacity: 88, seed: 13241 },
    { id: makeId(), color: '#9DC9F3', type: 'fill', position: 69, amplitude: 18, frequency: 1.9, offset: 0, opacity: 76, seed: 77218 },
    { id: makeId(), color: '#6EA9E4', type: 'fill', position: 79, amplitude: 17, frequency: 2.2, offset: 0, opacity: 88, seed: 37491 },
    { id: makeId(), color: '#F7FBFF', type: 'fill', position: 90, amplitude: 14, frequency: 1.9, offset: 0, opacity: 100, seed: 58312 },
    { id: makeId(), color: '#5D9DEC', type: 'line', position: 43, amplitude: 7, frequency: 3.8, offset: 0, opacity: 95, seed: 94825 }
  ]
});

const sanitizeWave = (wave: Partial<WaveLayer>): WaveLayer | null => {
  if (typeof wave.id !== 'string') return null;

  return {
    id: wave.id,
    color: validHex(wave.color) || '#6EA9E4',
    type: wave.type === 'line' ? 'line' : 'fill',
    position: clamp(wave.position, 5, 95),
    amplitude: clamp(wave.amplitude, 1, 35),
    frequency: clamp(wave.frequency, 0.8, 80),
    offset: clamp(wave.offset ?? 0, -100, 100),
    opacity: clamp(wave.opacity, 5, 100),
    seed: Number.isFinite(wave.seed) ? Number(wave.seed) : randomSeed()
  };
};

export const sanitizeProject = (value: unknown): WaveProject => {
  if (!value || typeof value !== 'object' || !Array.isArray((value as WaveProject).waves)) {
    return createInitialProject();
  }

  const project = value as Partial<WaveProject>;
  const waves = project.waves?.slice(0, MAX_WAVES).map(sanitizeWave).filter((wave): wave is WaveLayer => Boolean(wave)) ?? [];

  return {
    width: clamp(project.width, MIN_DIMENSION, MAX_DIMENSION),
    height: clamp(project.height, MIN_DIMENSION, MAX_DIMENSION),
    background: validHex(project.background) || '#EAF5FF',
    selectedId: typeof project.selectedId === 'string' ? project.selectedId : null,
    waves
  };
};
