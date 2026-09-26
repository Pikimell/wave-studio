import { elementBounds, intersectionArea, slideRect } from './geometry';
import { newId, type Group, type Slide, type StudioElement } from './schema';
import { copyElements } from './elements';
export function insertSlide(group: Group, index: number, slide: Slide): Group {
  if (!Number.isInteger(index) || index < 0 || index > group.slides.length) throw new Error('Невірна позиція слайда');
  const stride = group.width + group.gap, insertionX = index * stride;
  return { ...group, slides: [...group.slides.slice(0, index), slide, ...group.slides.slice(index)],
    elements: group.elements.map(e => e.x >= insertionX ? { ...e, x: e.x + stride } : e) };
}
export function deleteSlide(group: Group, slideId: string): Group {
  const index = group.slides.findIndex(s => s.id === slideId);
  if (index < 0) throw new Error('Слайд не знайдено');
  const rect = slideRect(group, index), stride = group.width + group.gap;
  return { ...group, slides: group.slides.filter(s => s.id !== slideId),
    elements: group.elements.filter(e => intersectionArea(elementBounds(e), rect) === 0).map(e => e.x >= rect.x + rect.width ? { ...e, x: e.x - stride } : e) };
}
export function ownerIndex(group: Group, element: StudioElement): number {
  const bounds = elementBounds(element);
  const areas = group.slides.map((_, i) => intersectionArea(bounds, slideRect(group, i)));
  const max = Math.max(0, ...areas);
  if (!max) return -1;
  const tied = areas.map((area, index) => ({ area, index })).filter(a => Math.abs(a.area - max) < 0.00001).map(a => a.index);
  const cx = element.x + element.width / 2, cy = element.y + element.height / 2;
  return tied.find(i => { const rect = slideRect(group, i); return cx >= rect.x && cx <= rect.x + rect.width && cy >= 0 && cy <= rect.height; }) ?? tied[0];
}
export function reorderSlide(group: Group, slideId: string, to: number): Group {
  const from = group.slides.findIndex(s => s.id === slideId);
  if (from < 0 || !Number.isInteger(to) || to < 0 || to >= group.slides.length) throw new Error('Невірна позиція слайда');
  const slides = [...group.slides]; const [slide] = slides.splice(from, 1); slides.splice(to, 0, slide);
  return { ...group, slides, elements: group.elements.map(element => {
    const owner = ownerIndex(group, element);
    if (owner < 0) return element;
    const nextIndex = slides.findIndex(s => s.id === group.slides[owner].id);
    return { ...element, x: element.x + (nextIndex - owner) * (group.width + group.gap) };
  }) };
}
export function duplicateGroup(group: Group): Group {
  const copy = structuredClone(group);
  return { ...copy, id: newId(), name: `${group.name.slice(0, 193)} (copy)`,
    slides: copy.slides.map(s => ({ ...s, id: newId() })), elements: copyElements(copy.elements, 0, 0) };
}
