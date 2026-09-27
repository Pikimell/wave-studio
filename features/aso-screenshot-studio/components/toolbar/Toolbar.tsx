import Link from 'next/link';
import styles from './Toolbar.module.css';
import { ArrowLeft, FolderOpen, Plus, Redo2, Save, Undo2 } from 'lucide-react';
import type { Project } from '../../domain/schema';
import { ZOOM_PRESETS } from '../../hooks/useWorkspaceZoom';
import { TextField } from '../inspector/Fields';
export function Toolbar({ project, saved, onRename, onNew, onOpen, onSave, onAddGroup, canUndo, canRedo, undo, redo, zoom, setZoom }: {
  project: Project | null; saved: boolean; onRename: (name: string) => void; onNew: () => void; onOpen: () => void; onSave: () => void;
  onAddGroup: () => void; canUndo: boolean; canRedo: boolean; undo: () => void; redo: () => void; zoom: number; setZoom: (zoom: number) => void;
}) {
  return <header className={`${styles.scope} aso-toolbar`}>
    <Link href="/aso-screenshot-studio" className="aso-back" title="До проєктів"><ArrowLeft size={18} /><span>Проєкти</span></Link>
    <div className="aso-brand">ASO<span>Screenshot Studio</span></div>
    {project && <div className="aso-project-name"><TextField label="Проєкт" value={project.name} onChange={onRename} /><small>{saved ? 'Збережено локально' : 'Локальна чернетка'}</small></div>}
    <div className="aso-toolbar-actions">
      <button onClick={onNew}><Plus size={15} />Новий проєкт</button>
      <button onClick={onOpen}><FolderOpen size={15} />Open JSON</button>
      <button onClick={onSave} disabled={!project}><Save size={15} />Save JSON</button>
      <button onClick={undo} disabled={!canUndo} aria-label="Скасувати" title="Cmd/Ctrl + Z"><Undo2 size={16} /></button>
      <button onClick={redo} disabled={!canRedo} aria-label="Повторити" title="Cmd/Ctrl + Shift + Z"><Redo2 size={16} /></button>
      <label className="aso-zoom"><span className="aso-sr-only">Масштаб</span><select value={zoom} onChange={e => setZoom(Number(e.target.value))}>{ZOOM_PRESETS.map(value => <option key={value} value={value}>{value}%</option>)}</select></label>
      <button className="aso-primary" onClick={onAddGroup} disabled={!project}><Plus size={16} />Add Group</button>
    </div>
  </header>;
}
