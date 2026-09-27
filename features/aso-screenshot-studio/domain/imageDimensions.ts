import { LIMITS } from './schema';

export function imageDimensions(width: number, height: number) {
  const scale = Math.min(1, LIMITS.dimension / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
