import { LIMITS } from './schema';

export function resizeWithAspectRatio(width: number, height: number, key: 'width' | 'height', value: number) {
  const other = key === 'width' ? 'height' : 'width';
  const ratio = (key === 'width' ? height : width) / (key === 'width' ? width : height);
  const next = Math.min(value, LIMITS.dimension / ratio);
  return { [key]: Math.round(next * 100) / 100, [other]: Math.round(next * ratio * 100) / 100 } as { width: number; height: number };
}
