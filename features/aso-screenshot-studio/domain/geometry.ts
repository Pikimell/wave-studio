import type { ElementGeometry, Group } from './schema';
export interface Rect { x: number; y: number; width: number; height: number }
export const groupWidth = (group: Group) => group.slides.length ? group.slides.length * group.width + (group.slides.length - 1) * group.gap : 0;
export const slideRect = (group: Group, index: number): Rect => ({ x: index * (group.width + group.gap), y: 0, width: group.width, height: group.height });
export const intersectionArea = (a: Rect, b: Rect) => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
export function elementBounds(element: ElementGeometry): Rect {
  const radians = element.rotation * Math.PI / 180;
  const width = Math.abs(element.width * Math.cos(radians)) + Math.abs(element.height * Math.sin(radians));
  const height = Math.abs(element.width * Math.sin(radians)) + Math.abs(element.height * Math.cos(radians));
  return { x: element.x + (element.width - width) / 2, y: element.y + (element.height - height) / 2, width, height };
}
export function containsPoint(element: ElementGeometry, x: number, y: number) {
  const angle = -element.rotation * Math.PI / 180;
  const dx = x - element.x - element.width / 2, dy = y - element.y - element.height / 2;
  return Math.abs(dx * Math.cos(angle) - dy * Math.sin(angle)) <= element.width / 2 &&
    Math.abs(dx * Math.sin(angle) + dy * Math.cos(angle)) <= element.height / 2;
}
export function hitTest(group: Group, x: number, y: number) {
  return [...group.elements].sort((a, b) => b.zIndex - a.zIndex || b.id.localeCompare(a.id)).find(e => containsPoint(e, x, y));
}
export type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';
export type ResizeHandle = ResizeCorner | 'n' | 'e' | 's' | 'w';
/** Resize in the rotated local axes, keeping the opposite corner or edge fixed. */
export function resizeElement(element: ElementGeometry, dx: number, dy: number, handle: ResizeHandle, keepRatio = false): ElementGeometry {
  const radians = element.rotation * Math.PI / 180, cos = Math.cos(radians), sin = Math.sin(radians);
  const sx = handle.includes('e') ? 1 : handle.includes('w') ? -1 : 0;
  const sy = handle.includes('s') ? 1 : handle.includes('n') ? -1 : 0;
  let width = Math.min(12000, Math.max(1, element.width + sx * (dx * cos + dy * sin)));
  let height = Math.min(12000, Math.max(1, element.height + sy * (-dx * sin + dy * cos)));
  if (keepRatio) {
    const widthScale = width / element.width, heightScale = height / element.height;
    const scale = sx === 0 ? heightScale : sy === 0 ? widthScale : Math.abs(widthScale - 1) >= Math.abs(heightScale - 1) ? widthScale : heightScale;
    const clamped = Math.max(1 / Math.min(element.width, element.height), Math.min(scale, 12000 / Math.max(element.width, element.height)));
    width = element.width * clamped;
    height = element.height * clamped;
  }
  const lx = sx * (width - element.width) / 2, ly = sy * (height - element.height) / 2;
  return { ...element, x: element.x + element.width / 2 + lx * cos - ly * sin - width / 2,
    y: element.y + element.height / 2 + lx * sin + ly * cos - height / 2, width, height };
}
