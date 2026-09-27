'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { createProject, type Project } from '../../domain/schema';
import { copyProject, deleteProject, listProjects, saveProject } from '../../services/projectStore';
import { listTemplates, loadTemplate, type TemplateEntry } from '../../services/templateCatalog';
import { parseProjectJson } from '../../services/projectFiles';
import { CreateProjectDialog } from './CreateProjectDialog';
import { TemplateCard } from './TemplateCard';
import styles from './ProjectHome.module.css';

export function ProjectHome({ createInitially = false }: { createInitially?: boolean }) {
  const router = useRouter();
  const importInput = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<TemplateEntry[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [creating, setCreating] = useState(createInitially);
  const [startingFrom, setStartingFrom] = useState<{ mode: 'blank' | 'template' | 'copy'; id: string }>({ mode: 'blank', id: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    try { setProjects(listProjects()); } catch { setError('Не вдалося відкрити локальні проєкти.'); }
    listTemplates().then(setTemplates).catch(e => setError(e instanceof Error ? e.message : 'Не вдалося завантажити шаблони')).finally(() => setTemplatesLoaded(true));
  }, []);
  async function create(mode: 'blank' | 'template' | 'copy', name: string, sourceId: string) {
    setBusy(true); setError('');
    try {
      const source = mode === 'copy' ? projects.find(project => project.id === sourceId) : mode === 'template' ? await loadTemplate(templates.find(item => item.id === sourceId)!) : null;
      if (mode !== 'blank' && !source) throw new Error('Оберіть джерело проєкту');
      const project = source ? copyProject(source, name) : createProject(name);
      saveProject(project);
      router.push(`/aso-screenshot-studio/editor?project=${encodeURIComponent(project.id)}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Не вдалося створити проєкт'); setBusy(false); }
  }
  function remove(project: Project) {
    if (!window.confirm(`Видалити проєкт «${project.name}» з цього браузера?`)) return;
    try { deleteProject(project.id); setProjects(listProjects()); }
    catch { setError('Не вдалося видалити проєкт із локального сховища.'); }
  }
  async function importJson(file: File) {
    setBusy(true); setError('');
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('JSON завеликий. Максимальний розмір — 10 MB.');
      const imported = parseProjectJson(await file.text());
      const project = copyProject(imported, imported.name);
      saveProject(project);
      router.push(`/aso-screenshot-studio/editor?project=${encodeURIComponent(project.id)}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Не вдалося імпортувати JSON'); setBusy(false); }
  }
  return <main className={styles.home}>
    <header className={styles.header}><div><span className={styles.kicker}>ASO Screenshot Studio</span><h1>Ваші проєкти</h1><p>Створюйте скріншоти для App Store і Google Play. Проєкти зберігаються в цьому браузері.</p></div><div className={styles.headerActions}><button disabled={busy} onClick={() => importInput.current?.click()}>Імпортувати JSON</button><button className={styles.create} onClick={() => { setStartingFrom({ mode: 'blank', id: '' }); setCreating(true); }}><Plus size={18} /> Створити проєкт</button></div></header>
    <input ref={importInput} type="file" accept=".json,application/json" className={styles.hiddenInput} aria-label="Імпортувати JSON проєкту" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void importJson(file); }} />
    {error && <div className={styles.error} role="alert">{error}</div>}
    <section aria-label="Збережені проєкти"><h2>Збережені проєкти</h2>{projects.length ? <div className={styles.grid}>{projects.map(project => <article className={styles.card} key={project.id}><div className={styles.cardIcon}><FolderOpen size={23} /></div><h3>{project.name}</h3><p>{project.groups.length} груп · {project.groups.reduce((count, group) => count + group.slides.length, 0)} слайдів</p><small>Створено {new Date(project.createdAt).toLocaleDateString('uk-UA')}</small><div className={styles.actions}><button onClick={() => router.push(`/aso-screenshot-studio/editor?project=${encodeURIComponent(project.id)}`)}>Відкрити</button><button title="Створити копію" aria-label={`Копіювати ${project.name}`} onClick={() => { setStartingFrom({ mode: 'copy', id: project.id }); setCreating(true); }}><Copy size={16} /></button><button title="Видалити" aria-label={`Видалити ${project.name}`} onClick={() => remove(project)}><Trash2 size={16} /></button></div></article>)}</div> : <div className={styles.empty}>Поки немає проєктів. Створіть перший з нуля або на основі шаблону.</div>}</section>
    <section className={styles.templates} aria-label="Доступні шаблони"><h2>Готові шаблони</h2><p>Перегляньте перші слайди та оберіть шаблон для нового проєкту.</p>{templates.length ? <div className={styles.grid}>{templates.map(template => <TemplateCard key={template.id} template={template} onStart={() => { setStartingFrom({ mode: 'template', id: template.id }); setCreating(true); }} />)}</div> : <p>{templatesLoaded ? 'Немає доступних шаблонів.' : 'Шаблони завантажуються…'}</p>}</section>
    {creating && <CreateProjectDialog projects={projects} templates={templates} initialMode={startingFrom.mode} initialSourceId={startingFrom.id} busy={busy} onClose={() => setCreating(false)} onCreate={create} />}
  </main>;
}
