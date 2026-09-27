import { newId, validateProject, type Project } from '../domain/schema';
import { parseProjectJson } from './projectFiles';

const KEY = 'aso-screenshot-studio.projects.v1';
const LEGACY_KEY = 'aso-screenshot-studio.project.v1';

function read(): Record<string, Project> {
  const raw = localStorage.getItem(KEY);
  const stored: Record<string, Project> = {};
  if (raw) {
    const values: unknown = JSON.parse(raw);
    if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('Некоректне сховище проєктів');
    for (const [id, value] of Object.entries(values)) {
      try {
        const project = validateProject(value);
        if (project.id === id) stored[id] = project;
      } catch { /* A damaged entry should not hide healthy projects. */ }
    }
  }
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    try {
      const project = parseProjectJson(legacy);
      if (!stored[project.id]) stored[project.id] = project;
      localStorage.setItem(KEY, JSON.stringify(stored));
      localStorage.removeItem(LEGACY_KEY);
    } catch { /* Keep the original entry for manual recovery. */ }
  }
  return stored;
}
export function listProjects(): Project[] {
  return Object.values(read()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function getProject(id: string): Project | null { return read()[id] ?? null; }
export function saveProject(project: Project): void {
  const projects = read();
  projects[project.id] = validateProject(project);
  localStorage.setItem(KEY, JSON.stringify(projects));
}
export function deleteProject(id: string): void {
  const projects = read();
  delete projects[id];
  localStorage.setItem(KEY, JSON.stringify(projects));
}
export function copyProject(source: Project, name: string): Project {
  const copy = structuredClone(source);
  copy.id = newId(); copy.name = name; copy.createdAt = new Date().toISOString();
  for (const group of copy.groups) {
    group.id = newId();
    for (const slide of group.slides) slide.id = newId();
    for (const element of group.elements) {
      element.id = newId();
      if (element.type === 'text') for (const segment of element.segments) segment.id = newId();
    }
  }
  return validateProject(copy);
}
