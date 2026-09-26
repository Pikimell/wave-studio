import { elementBounds, slideRect, type Rect } from './geometry';
import type { Group, StudioElement } from './schema';
export interface Guide { axis: 'x' | 'y'; value: number; from: number; to: number; kind: 'alignment' | 'spacing' }
interface Candidate { delta: number; guide: Guide }
export function boundingRect(elements: StudioElement[]): Rect {
  const bounds = elements.map(elementBounds);
  const x = Math.min(...bounds.map(e => e.x)), y = Math.min(...bounds.map(e => e.y));
  return { x, y, width: Math.max(...bounds.map(e => e.x + e.width)) - x, height: Math.max(...bounds.map(e => e.y + e.height)) - y };
}
/** Threshold is in actual pixels. The caller converts its 6 screen px using zoom. */
export function snapTranslation(group: Group, moving: StudioElement[], dx: number, dy: number, threshold: number) {
  if (!moving.length) return { dx, dy, guides: [] as Guide[] };
  const rect = boundingRect(moving), box = { ...rect, x: rect.x + dx, y: rect.y + dy };
  const ids = new Set(moving.map(e => e.id));
  const others = group.elements.filter(e => !ids.has(e.id)).map(elementBounds);
  const candidates: { x: Candidate[]; y: Candidate[] } = { x: [], y: [] };
  function align(axis: 'x' | 'y', value: number, from: number, to: number) {
    const size = axis === 'x' ? 'width' : 'height';
    for (const edge of [box[axis], box[axis] + box[size] / 2, box[axis] + box[size]]) {
      const delta = value - edge;
      if (Math.abs(delta) <= threshold) candidates[axis].push({ delta, guide: { axis, value, from, to, kind: 'alignment' } });
    }
  }
  for (const [index, slide] of group.slides.entries()) {
    const target = slideRect(group, index);
    for (const value of [target.x, target.x + group.width / 2, target.x + group.width, target.x + slide.padding.left, target.x + group.width - slide.padding.right]) align('x', value, Math.min(0, box.y), Math.max(group.height, box.y + box.height));
    for (const value of [0, group.height / 2, group.height, slide.padding.top, group.height - slide.padding.bottom]) align('y', value, Math.min(target.x, box.x), Math.max(target.x + group.width, box.x + box.width));
  }
  for (const target of others) {
    for (const value of [target.x, target.x + target.width / 2, target.x + target.width]) align('x', value, Math.min(target.y, box.y), Math.max(target.y + target.height, box.y + box.height));
    for (const value of [target.y, target.y + target.height / 2, target.y + target.height]) align('y', value, Math.min(target.x, box.x), Math.max(target.x + target.width, box.x + box.width));
  }
  // Equal spacing between a neighboring pair, and repeated spacing before/after it.
  for (const axis of ['x', 'y'] as const) {
    const size = axis === 'x' ? 'width' : 'height', cross = axis === 'x' ? 'y' : 'x', crossSize = axis === 'x' ? 'height' : 'width';
    const row = others.filter(r => r[cross] < box[cross] + box[crossSize] && r[cross] + r[crossSize] > box[cross]).sort((a, b) => a[axis] - b[axis]);
    for (let i = 1; i < row.length; i++) {
      const a = row[i - 1], b = row[i], gap = b[axis] - a[axis] - a[size];
      if (gap < 0) continue;
      const positions = [b[axis] + b[size] + gap, a[axis] - gap - box[size]];
      if (gap >= box[size]) positions.push(a[axis] + a[size] + (gap - box[size]) / 2);
      for (const value of positions) {
        const delta = value - box[axis];
        if (Math.abs(delta) <= threshold) candidates[axis].push({ delta, guide: { axis: cross, value: box[cross] + box[crossSize] / 2, from: Math.min(a[axis], value), to: Math.max(b[axis] + b[size], value + box[size]), kind: 'spacing' } });
      }
    }
  }
  const guides: Guide[] = [];
  for (const axis of ['x', 'y'] as const) {
    const best = candidates[axis].sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))[0];
    if (best) { if (axis === 'x') dx += best.delta; else dy += best.delta; guides.push(best.guide); }
  }
  return { dx, dy, guides };
}
