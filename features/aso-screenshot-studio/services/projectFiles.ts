import { validateProject, type Project } from '../domain/schema';
export function parseProjectJson(json: string) { return validateProject(JSON.parse(json)); }
export function serializeProject(project: Project) { return JSON.stringify(validateProject(project), null, 2); }
export function saveProjectFile(project: Project) {
  const url = URL.createObjectURL(new Blob([serializeProject(project)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = `${project.name.replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 100) || 'ASO-project'}.json`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
