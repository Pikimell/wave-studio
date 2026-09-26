import { newId, type StudioElement } from './schema';
export type OrderDirection = 'forward' | 'backward' | 'front' | 'back';
export function orderElements(elements: StudioElement[], ids: string[], direction: OrderDirection): StudioElement[] {
  const selected = new Set(ids);
  const ordered = [...elements].sort((a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id));
  if (direction === 'front' || direction === 'back') {
    const active = ordered.filter(e => selected.has(e.id)), rest = ordered.filter(e => !selected.has(e.id));
    return (direction === 'front' ? [...rest, ...active] : [...active, ...rest]).map((e, zIndex) => ({ ...e, zIndex }));
  }
  if (direction === 'forward') {
    for (let i = ordered.length - 2; i >= 0; i--) if (selected.has(ordered[i].id) && !selected.has(ordered[i + 1].id)) [ordered[i], ordered[i + 1]] = [ordered[i + 1], ordered[i]];
  } else {
    for (let i = 1; i < ordered.length; i++) if (selected.has(ordered[i].id) && !selected.has(ordered[i - 1].id)) [ordered[i], ordered[i - 1]] = [ordered[i - 1], ordered[i]];
  }
  return ordered.map((e, zIndex) => ({ ...e, zIndex }));
}
export function copyElements(elements: StudioElement[], dx = 32, dy = 32, firstZ = 0): StudioElement[] {
  return [...elements].sort((a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id)).map((source, index) => {
    const element = structuredClone(source);
    element.id = newId(); element.x += dx; element.y += dy; element.zIndex = firstZ + index;
    if (element.type === 'text') element.segments = element.segments.map(s => ({ ...s, id: newId() }));
    return element;
  });
}
