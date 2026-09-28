import { DEFAULT_IMAGE_SIZE, DEFAULT_SVG_SIZE, LIMITS, type ImageElement, type SvgElement } from './schema';

export function imageDimensions(width: number, height: number) {
  const scale = Math.min(1, LIMITS.dimension / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export function imageDimensionsWhenStandard(element: Pick<ImageElement | SvgElement, 'type' | 'width' | 'height'>, width: number, height: number) {
  const standard = element.type === 'image' ? DEFAULT_IMAGE_SIZE : DEFAULT_SVG_SIZE;
  return element.width === standard.width && element.height === standard.height ? imageDimensions(width, height) : {};
}
