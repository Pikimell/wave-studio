import type { Project } from '../domain/schema';
import { parseProjectJson } from './projectFiles';
export interface TemplateEntry { id: string; name: string; description: string; file: string }
const ROOT = '/aso-screenshot-studio/templates/';
export async function listTemplates(): Promise<TemplateEntry[]> {
  const response = await fetch(`${ROOT}index.json`);
  if (!response.ok) throw new Error('Не вдалося завантажити каталог шаблонів');
  const entries: unknown = await response.json();
  if (!Array.isArray(entries) || !entries.every(item => item && typeof item === 'object' && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.description === 'string' && typeof item.file === 'string' && /^[a-z0-9-]+\.json$/.test(item.file))) throw new Error('Некоректний каталог шаблонів');
  return entries as TemplateEntry[];
}
export async function loadTemplate(entry: TemplateEntry): Promise<Project> {
  const response = await fetch(`${ROOT}${entry.file}`);
  if (!response.ok) throw new Error('Не вдалося завантажити шаблон');
  return parseProjectJson(await response.text());
}
