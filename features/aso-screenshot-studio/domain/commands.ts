import { deleteSlide, insertSlide, reorderSlide } from './slides';
import { orderElements, type OrderDirection } from './elements';
import { validateProject, type ElementGeometry, type Group, type Project, type Slide, type StudioElement, type TextElement } from './schema';
export type GroupPatch = Partial<Omit<Group, 'id' | 'slides' | 'elements'>>;
type Patch<T> = T extends StudioElement ? Partial<Omit<T, 'id' | 'type'>> : never;
export type ElementPatch = Patch<StudioElement>;
export type Command =
  | { type: 'slide.insert'; groupId: string; index: number; slide: Slide }
  | { type: 'slide.delete'; groupId: string; slideId: string }
  | { type: 'slide.reorder'; groupId: string; slideId: string; to: number }
  | { type: 'element.update'; groupId: string; elementId: string; patch: ElementPatch }
  | { type: 'batch'; commands: Command[] }
  | { type: 'elements.order'; groupId: string; elementIds: string[]; direction: OrderDirection }
  | { type: 'project.rename'; name: string }
  | { type: 'group.add'; group: Group }
  | { type: 'group.update'; groupId: string; patch: GroupPatch }
  | { type: 'group.delete'; groupId: string }
  | { type: 'slide.add'; groupId: string; slide: Slide }
  | { type: 'slide.update'; groupId: string; slideId: string; patch: Partial<Omit<Slide, 'id'>> }
  | { type: 'element.add'; groupId: string; element: StudioElement }
  | { type: 'element.geometry'; groupId: string; elementId: string; patch: Partial<ElementGeometry & { opacity: number }> }
  | { type: 'element.text'; groupId: string; elementId: string; patch: Partial<Omit<TextElement, 'id' | 'type'>> }
  | { type: 'element.delete'; groupId: string; elementId: string };
function applyUnchecked(project: Project, command: Command): Project {
  if (command.type === 'batch') return command.commands.reduce(applyUnchecked, project);
  let next: Project;
  if (command.type === 'project.rename') next = { ...project, name: command.name };
  else if (command.type === 'group.add') next = { ...project, groups: [...project.groups, command.group] };
  else {
    if (!project.groups.some(g => g.id === command.groupId)) throw new Error('Групу не знайдено');
    next = { ...project, groups: project.groups.filter(g => command.type !== 'group.delete' || g.id !== command.groupId).map(group => {
      if (group.id !== command.groupId) return group;
      switch (command.type) {
        case 'slide.insert': return insertSlide(group, command.index, command.slide);
        case 'slide.delete': return deleteSlide(group, command.slideId);
        case 'slide.reorder': return reorderSlide(group, command.slideId, command.to);
        case 'elements.order': return { ...group, elements: orderElements(group.elements, command.elementIds, command.direction) };
        case 'group.update': return { ...group, ...command.patch };
        case 'slide.add': return { ...group, slides: [...group.slides, command.slide] };
        case 'slide.update': {
          if (!group.slides.some(s => s.id === command.slideId)) throw new Error('Слайд не знайдено');
          return { ...group, slides: group.slides.map(s => s.id === command.slideId ? { ...s, ...command.patch } : s) };
        }
        case 'element.add': return { ...group, elements: [...group.elements, command.element] };
        case 'element.delete': return { ...group, elements: group.elements.filter(e => e.id !== command.elementId) };
        case 'element.update':
        case 'element.geometry':
        case 'element.text': {
          if (!group.elements.some(e => e.id === command.elementId)) throw new Error('Елемент не знайдено');
          return { ...group, elements: group.elements.map(element => {
            if (element.id !== command.elementId) return element;
            if (command.type === 'element.text' && element.type !== 'text') throw new Error('Елемент не є текстом');
            return { ...element, ...command.patch } as StudioElement;
          }) };
        }
        default: return group;
      }
    }) };
  }
  return next;
}
export function applyCommand(project: Project, command: Command): Project {
  const next = applyUnchecked(project, command);
  validateProject(next);
  return JSON.stringify(next) === JSON.stringify(project) ? project : next;
}
