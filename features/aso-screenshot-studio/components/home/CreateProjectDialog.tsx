import { useState } from 'react';
import type { Project } from '../../domain/schema';
import type { TemplateEntry } from '../../services/templateCatalog';
import styles from './CreateProjectDialog.module.css';
export function CreateProjectDialog({ projects, templates, initialMode, initialSourceId, busy, onClose, onCreate }: {
  projects: Project[]; templates: TemplateEntry[]; initialMode: 'blank' | 'template' | 'copy'; initialSourceId: string; busy: boolean; onClose: () => void;
  onCreate: (mode: 'blank' | 'template' | 'copy', name: string, sourceId: string) => void;
}) {
  const [mode, setMode] = useState<'blank' | 'template' | 'copy'>(initialMode);
  const [name, setName] = useState(initialMode === 'template' ? templates.find(item => item.id === initialSourceId)?.name ?? 'Новий проєкт' : initialMode === 'copy' ? `${projects.find(item => item.id === initialSourceId)?.name ?? 'Проєкт'} — копія` : 'Новий проєкт');
  const [sourceId, setSourceId] = useState(initialSourceId);
  const sources = mode === 'template' ? templates : projects;
  function changeMode(next: typeof mode) { setMode(next); setSourceId(''); }
  return <div className={styles.backdrop} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="create-project-title"><h2 id="create-project-title">Створити проєкт</h2><p>Оберіть, з чого почати. Початкові дані можна змінити в редакторі.</p><div className={styles.options}><label><input type="radio" checked={mode === 'blank'} onChange={() => changeMode('blank')} /> З нуля</label><label><input type="radio" checked={mode === 'template'} onChange={() => changeMode('template')} disabled={!templates.length} /> Готовий шаблон</label><label><input type="radio" checked={mode === 'copy'} onChange={() => changeMode('copy')} disabled={!projects.length} /> Копія проєкту</label></div>{mode !== 'blank' && <label className={styles.field}>Джерело<select value={sourceId} onChange={event => setSourceId(event.target.value)}><option value="">Оберіть {mode === 'template' ? 'шаблон' : 'проєкт'}</option>{sources.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}<label className={styles.field}>Назва проєкту<input autoFocus maxLength={200} value={name} onChange={event => setName(event.target.value)} /></label><div className={styles.actions}><button type="button" onClick={onClose} disabled={busy}>Скасувати</button><button type="button" className={styles.primary} disabled={busy || !name.trim() || mode !== 'blank' && !sourceId} onClick={() => onCreate(mode, name.trim(), sourceId)}>{busy ? 'Створення…' : 'Створити проєкт'}</button></div></div></div>;
}
