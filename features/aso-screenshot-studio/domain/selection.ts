import type { Group, Project, StudioElement } from './schema';
export type Selection = { groupId: string; kind: 'group' } | { groupId: string; kind: 'slide'; slideId: string } | { groupId: string; kind: 'element'; elementIds: string[] } | null;
export function resolveSelection(project: Project | null, selection: Selection): Selection {
  if (!selection) return null;
  const group = project?.groups.find(g => g.id === selection.groupId);
  if (!group) return null;
  if (selection.kind === 'element') {
    const elementIds = [...new Set(selection.elementIds)].filter(id => group.elements.some(e => e.id === id));
    return elementIds.length ? { ...selection, elementIds } : { kind: 'group', groupId: group.id };
  }
  if (selection.kind === 'slide' && !group.slides.some(s => s.id === selection.slideId)) return { kind: 'group', groupId: group.id };
  return selection;
}
export function selectedElements(group: Group | undefined, selection: Selection): StudioElement[] {
  return selection?.kind === 'element' && group?.id === selection.groupId ? group.elements.filter(e => selection.elementIds.includes(e.id)) : [];
}
export function toggleElement(selection: Selection, groupId: string, elementId: string): Selection {
  const ids = selection?.kind === 'element' && selection.groupId === groupId ? selection.elementIds : [];
  const next = ids.includes(elementId) ? ids.filter(id => id !== elementId) : [...ids, elementId];
  return next.length ? { kind: 'element', groupId, elementIds: next } : { kind: 'group', groupId };
}
export function commonValue<T>(values: T[]): T | undefined {
  return values.length && values.every(v => v === values[0]) ? values[0] : undefined;
}
