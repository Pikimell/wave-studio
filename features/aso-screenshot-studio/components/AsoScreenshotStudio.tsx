'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Layers3, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { downloadBlob, pngFilename, prepareExport, renderPng } from '../services/exportPng';
import { exportGroupZip, zipFilename } from '../services/exportZip';
import { inspectGroup, type ExportIssue } from '../services/preflight';
import { duplicateGroup } from '../domain/slides';
import { copyElements } from '../domain/elements';
import { selectedElements, toggleElement } from '../domain/selection';
import { createElement, createSlide, type ElementGeometry, type Group, type StudioElement } from '../domain/schema';
import { AssetContext, useAssets } from '../hooks/useAssets';
import { FontContext, useFonts } from '../hooks/useFonts';
import { useStudioProject } from '../hooks/useStudioProject';
import { useSelection } from '../hooks/useSelection';
import { useWorkspaceZoom } from '../hooks/useWorkspaceZoom';
import { parseProjectJson, saveProjectFile } from '../services/projectFiles';
import type { StoredAsset } from '../services/assetStore';
import { imageDimensions } from '../domain/imageDimensions';
import { DEVICES } from '../domain/devices';
import { Toolbar } from './toolbar/Toolbar';
import { ElementsSidebar } from './sidebar/ElementsSidebar';
import { Inspector } from './inspector/Inspector';
import { GroupCanvas, type GeometryDraft, type CanvasPointer } from './workspace/GroupCanvas';
import { LocalizeDialog } from './dialogs/LocalizeDialog';
import { AddGroupDialog } from './dialogs/AddGroupDialog';
import { GenerateProjectDialog } from './dialogs/GenerateProjectDialog';
import { PreviewPanel } from './preview/PreviewPanel';
import styles from './AsoScreenshotStudio.module.css';
import fontStyles from './FontFaces.module.css';

export function AsoScreenshotStudio({ projectId }: { projectId: string }) {
  const router = useRouter();
  const studio = useStudioProject(projectId);
  const { project, dispatch } = studio;
  const assetStore = useAssets(studio.setError);
  const fontStore = useFonts(studio.setError);
  const assetUrls = useMemo(() => Object.fromEntries(Object.values(assetStore.assets).map(a => [a.id, a.url])), [assetStore.assets]);
  const { selection, select } = useSelection(project);
  const { zoom, setZoom } = useWorkspaceZoom();
  const [localizing, setLocalizing] = useState<Group | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4.1-mini');
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [issues, setIssues] = useState<{ groupId: string; items: ExportIssue[] } | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<GeometryDraft | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showInspector, setShowInspector] = useState(true);
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(() => new Set());
  const clipboard = useRef<StudioElement[]>([]);
  const pointer = useRef<CanvasPointer | null>(null);
  const input = useRef<HTMLInputElement>(null), workspace = useRef<HTMLElement>(null);
  const scrollAnchor = useRef<{ groupId: string; y: number } | null>(null);
  const activeGroup = project?.groups.find(g => g.id === selection?.groupId) ?? project?.groups[0];
  const displayProject = useMemo(() => draft && project ? { ...project, groups: project.groups.map(g => g.id === draft.groupId ? { ...g, elements: g.elements.map(e => { const change = draft.changes.find(c => c.elementId === e.id); return change ? { ...e, ...change.geometry } : e; }) } : g) } : project, [draft, project]);
  useEffect(() => {
    if (!project) return;
    const groupIds = new Set(project.groups.map(group => group.id));
    setCollapsedGroupIds(previous => {
      const next = new Set([...previous].filter(id => groupIds.has(id)));
      return next.size === previous.size ? previous : next;
    });
  }, [project]);
  function changeZoom(next: number) {
    const node = workspace.current;
    if (node) {
      const rect = node.getBoundingClientRect(), center = rect.top + node.clientHeight / 2;
      const groups = [...node.querySelectorAll<HTMLElement>('[data-group-id]')];
      const target = groups.find(g => g.getBoundingClientRect().bottom >= center) ?? groups[groups.length - 1];
      const canvas = target?.querySelector('svg.aso-canvas');
      if (target && canvas) scrollAnchor.current = { groupId: target.dataset.groupId!, y: (center - canvas.getBoundingClientRect().top) / (zoom / 100) };
    }
    setZoom(next);
  }
  useLayoutEffect(() => {
    const node = workspace.current, anchor = scrollAnchor.current;
    if (!node || !anchor) return;
    const canvas = node.querySelector(`[data-group-id="${anchor.groupId}"] svg.aso-canvas`);
    if (canvas) node.scrollTop += canvas.getBoundingClientRect().top + anchor.y * zoom / 100 - node.getBoundingClientRect().top - node.clientHeight / 2;
    scrollAnchor.current = null;
  }, [zoom]);
  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (document.querySelector('dialog[open]') || event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault(); if (!draft) { if (event.shiftKey) studio.redo(); else studio.undo(); } return;
      }
      if (event.key === 'Escape') { select(null); return; }
      if (!activeGroup || draft) return;
      const elements = selectedElements(activeGroup, selection);
      if (modifier && event.key.toLowerCase() === 'c' && elements.length) { event.preventDefault(); clipboard.current = structuredClone(elements); return; }
      if (modifier && ['v', 'd'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        const source = event.key.toLowerCase() === 'd' ? elements : clipboard.current;
        if (!source.length) return;
        const target = event.key.toLowerCase() === 'v' ? pointer.current : null;
        const destination = project?.groups.find(g => g.id === target?.groupId) ?? activeGroup;
        const dx = target ? target.x - Math.min(...source.map(e => e.x)) : 32;
        const dy = target ? target.y - Math.min(...source.map(e => e.y)) : 32;
        const copies = copyElements(source, dx, dy, Math.max(-1, ...destination.elements.map(e => e.zIndex)) + 1);
        dispatch({ type: 'batch', commands: copies.map(element => ({ type: 'element.add', groupId: destination.id, element })) });
        select({ kind: 'element', groupId: destination.id, elementIds: copies.map(e => e.id) });
        return;
      }
      if (!elements.length) return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault(); dispatch({ type: 'batch', commands: elements.map(element => ({ type: 'element.delete', groupId: activeGroup.id, elementId: element.id })) });
      }
      const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      if (delta && !modifier) {
        event.preventDefault(); const step = event.shiftKey ? 10 : 1;
        dispatch({ type: 'batch', commands: elements.map(element => ({ type: 'element.geometry', groupId: activeGroup.id, elementId: element.id, patch: { x: element.x + delta[0] * step, y: element.y + delta[1] * step } })) });
      }
    }
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  }, [studio, dispatch, select, activeGroup, selection, draft, project]);
  function newProject() { router.push('/aso-screenshot-studio?create=1'); }
  function addElement(type: StudioElement['type'], asset?: StoredAsset, variant?: string) {
    if (!activeGroup) return;
    const index = selection?.kind === 'slide' ? Math.max(0, activeGroup.slides.findIndex(s => s.id === selection.slideId)) : 0;
    const initial = createElement(type, activeGroup, index * (activeGroup.width + activeGroup.gap) + 100);
    let element: StudioElement = (initial.type === 'image' || initial.type === 'svg') && asset ? { ...initial, asset: { assetId: asset.id, fileName: asset.name.slice(0, 255) }, ...imageDimensions(asset.width, asset.height) } : initial;
    if (element.type === 'device' && variant) {
      const device = DEVICES.find(item => item.id === variant);
      if (device) element = { ...element, deviceId: device.id, height: Math.round(element.width * device.height / device.width) };
    }
    if (element.type === 'shape' && variant === 'ellipse') element = { ...element, shape: 'ellipse', radius: 0 };
    if (element.type === 'decoration' && variant) element = { ...element, decorationId: variant };
    dispatch({ type: 'element.add', groupId: activeGroup.id, element });
    select({ kind: 'element', groupId: activeGroup.id, elementIds: [element.id] });
  }
  function commitGeometry(change: GeometryDraft) {
    dispatch({ type: 'batch', commands: change.changes.map(item => {
      const { x, y, width, height, rotation, zIndex } = item.geometry;
      const patch: ElementGeometry = { x, y, width, height, rotation, zIndex };
      const source = project?.groups.find(g => g.id === change.groupId)?.elements.find(e => e.id === item.elementId);
      if (change.resized && source?.type === 'text' && (source.width !== width || source.height !== height)) return { type: 'element.text', groupId: change.groupId, elementId: item.elementId, patch: { ...patch, widthMode: 'fixed', heightMode: 'fixed' } };
      return { type: 'element.geometry', groupId: change.groupId, elementId: item.elementId, patch };
    }) });
  }
  function duplicateCurrentGroup(group: Group) {
    const copy = duplicateGroup(group);
    dispatch({ type: 'group.add', group: copy });
    select({ kind: 'group', groupId: copy.id });
  }
  function toggleGroupCollapsed(groupId: string) {
    setCollapsedGroupIds(previous => {
      const next = new Set(previous);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  async function exportImages(groupId: string, slideId?: string) {
    const group = project?.groups.find(g => g.id === groupId);
    if (!group || !project || exporting) return;
    const items = inspectGroup(group, new Set(Object.keys(assetStore.assets)), new Set(Object.keys(fontStore.fonts)));
    setIssues(items.length ? { groupId, items } : null);
    if (items.some(item => item.severity === 'error')) return;
    setExporting(true); setProgress('Підготовка експорту…');
    try {
      if (slideId) {
        const index = group.slides.findIndex(s => s.id === slideId);
        downloadBlob(await renderPng(await prepareExport(group, assetStore.assets, fontStore.fonts), index), pngFilename(group, index));
      } else {
        const blob = await exportGroupZip(group, assetStore.assets, (done, total) => setProgress(`PNG ${done} / ${total}`), fontStore.fonts);
        downloadBlob(blob, zipFilename(project.name, group));
      }
      setProgress('Експорт завершено');
    } catch (e) { studio.setError(e instanceof Error ? e.message : 'Не вдалося експортувати'); setProgress(''); }
    finally { setExporting(false); }
  }
  if (!studio.ready) return <div className={`${styles.scope} aso-studio aso-loading`} role="status">Відновлення ASO Studio…</div>;
  return <FontContext.Provider value={fontStore}><AssetContext.Provider value={{ ...assetStore, urls: assetUrls }}><div className={`${styles.scope} ${fontStyles.fontFaces} aso-studio`} onFocusCapture={event => {
    if (event.target instanceof HTMLElement && event.target.matches('input,textarea,select')) studio.begin();
  }} onBlurCapture={() => studio.end()}>
    <Toolbar project={project} saved={studio.saved} onRename={name => dispatch({ type: 'project.rename', name })} onNew={newProject} onOpen={() => input.current?.click()} onSave={() => {
      if (project) { try { saveProjectFile(project); } catch (e) { studio.setError(String(e)); } }
    }} onGenerate={() => setGenerating(true)} onAddGroup={() => setAddingGroup(true)} canUndo={studio.canUndo && !draft} canRedo={studio.canRedo && !draft} undo={studio.undo} redo={studio.redo} zoom={zoom} setZoom={changeZoom} />
    <input ref={input} className="aso-sr-only" tabIndex={-1} type="file" accept=".json,application/json" aria-label="Відкрити JSON проєкту" onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = '';
      if (!file) return;
      try {
        if (file.size > 10 * 1024 * 1024) throw new Error('JSON завеликий. Максимальний розмір — 10 MB; зображення не повинні бути вбудовані.');
        const imported = parseProjectJson(await file.text());
        if (project && !window.confirm('Замінити поточний проєкт даними з JSON?')) return;
        clipboard.current = []; pointer.current = null; studio.replace(project ? { ...imported, id: project.id, createdAt: project.createdAt } : imported); select(null); setDraft(null); studio.setError('');
      } catch (e) { studio.setError(e instanceof Error ? e.message : 'Не вдалося відкрити файл'); }
    }} />
    {studio.error && <div className="aso-error" role="alert"><span>{studio.error}</span><button aria-label="Закрити помилку" onClick={() => studio.setError('')}>×</button></div>}
    {progress && <div className="aso-export-status" role="status">{progress}</div>}
    {issues && <div className="aso-export-issues"><div className="aso-row"><strong>Перевірка перед експортом</strong><button aria-label="Закрити перевірку" onClick={() => setIssues(null)}>×</button></div>{issues.items.map((issue, index) => <button key={index} onClick={() => select(issue.elementId ? { kind: 'element', groupId: issues.groupId, elementIds: [issue.elementId] } : issue.slideId ? { kind: 'slide', groupId: issues.groupId, slideId: issue.slideId } : { kind: 'group', groupId: issues.groupId })}>{issue.severity === 'error' ? 'Помилка' : 'Увага'}: {issue.message} →</button>)}</div>}
    <div className={styles.panelControls} role="group" aria-label="Бічні панелі">
      <button type="button" aria-expanded={showSidebar} aria-label={showSidebar ? 'Сховати ліву панель елементів' : 'Показати ліву панель елементів'} title={showSidebar ? 'Сховати ліву панель' : 'Показати ліву панель'} onClick={() => setShowSidebar(value => !value)}>
        {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}<span>Елементи</span>
      </button>
      <button type="button" aria-expanded={showInspector} aria-label={showInspector ? 'Сховати праву панель налаштувань' : 'Показати праву панель налаштувань'} title={showInspector ? 'Сховати праву панель' : 'Показати праву панель'} onClick={() => setShowInspector(value => !value)}>
        {showInspector ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}<span>Inspector</span>
      </button>
    </div>
    <div className="aso-body" data-left={showSidebar} data-right={showInspector}>
      {showSidebar && <ElementsSidebar group={activeGroup} groups={project?.groups ?? []} onAdd={(type, variant) => addElement(type, undefined, variant)} onAddAsset={asset => addElement(asset.mimeType === 'image/svg+xml' ? 'svg' : 'image', asset)} onSelect={(elementId, additive) => activeGroup && select(additive ? toggleElement(selection, activeGroup.id, elementId) : { kind: 'element', groupId: activeGroup.id, elementIds: [elementId] })} />}
      <main className="aso-workspace" ref={workspace} aria-label="Робоча область" onClick={e => { if (e.target === e.currentTarget) select(null); }}>
        {!project || !project.groups.length ? <div className="aso-empty"><div className="aso-empty-icon"><Layers3 size={32} /></div><span className="aso-eyebrow">FROM APP TO APP STORE</span><h1>Ваша історія.<br /><em>У кожному слайді.</em></h1><p>Збирайте скріншоти у спільну композицію.<br />Почніть із проєкту, а розміри оберіть у групі.</p><button className="aso-primary" onClick={project ? () => setAddingGroup(true) : newProject}><Plus size={18} />{project ? 'Додати першу групу' : 'Create Project'}</button><small>App Store & Google Play · Локальна чернетка</small></div> : project.groups.map(group => <GroupCanvas key={group.id} group={group} selection={selection} select={select} zoom={zoom} collapsed={collapsedGroupIds.has(group.id)} onToggleCollapsed={() => toggleGroupCollapsed(group.id)} exporting={exporting} onLocalize={() => setLocalizing(group)} onExport={() => void exportImages(group.id)} onDelete={() => { dispatch({ type: 'group.delete', groupId: group.id }); select(null); }} onDuplicate={() => duplicateCurrentGroup(group)} onAddSlide={() => {
          const slide = createSlide(); dispatch({ type: 'slide.add', groupId: group.id, slide }); select({ kind: 'slide', groupId: group.id, slideId: slide.id });
        }} draft={draft} onDraft={setDraft} onCommit={commitGeometry} onPointer={value => { pointer.current = value; }} onUploadScreenshot={async (elementId, file) => {
          try {
            const asset = await assetStore.upload(file);
            dispatch({ type: 'element.update', groupId: group.id, elementId, patch: { screenshot: { assetId: asset.id, fileName: asset.name } } });
          } catch (error) { studio.setError(error instanceof Error ? error.message : 'Не вдалося завантажити скріншот'); }
        }} />)}
      </main>
      {showInspector && <Inspector project={displayProject} selection={selection} dispatch={dispatch} exporting={exporting} onExportSlide={(groupId, slideId) => void exportImages(groupId, slideId)} onExportGroup={groupId => void exportImages(groupId)} onDuplicateGroup={duplicateCurrentGroup} onLocalizeGroup={setLocalizing} />}
    </div>
    <PreviewPanel group={displayProject?.groups.find(g => g.id === activeGroup?.id)} onSlide={slideId => {
      if (!activeGroup) return;
      select({ kind: 'slide', groupId: activeGroup.id, slideId });
      const node = workspace.current?.querySelector<HTMLElement>(`[data-group-id="${activeGroup.id}"]`);
      node?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      const viewport = node?.querySelector('.aso-group-scroll');
      const labels = node?.querySelectorAll('.aso-slide-labels button');
      const index = activeGroup.slides.findIndex(s => s.id === slideId);
      if (viewport && labels?.[index]) viewport.scrollLeft += labels[index].getBoundingClientRect().left - viewport.getBoundingClientRect().left - 40;
    }} />
    {localizing && <LocalizeDialog group={localizing} apiKey={apiKey} setApiKey={setApiKey} model={model} setModel={setModel} onClose={() => setLocalizing(null)} onAdd={groups => {
      dispatch({ type: 'batch', commands: groups.map(group => ({ type: 'group.add', group })) });
      if (groups[0]) { select({ kind: 'group', groupId: groups[0].id }); const items = inspectGroup(groups[0], new Set(Object.keys(assetStore.assets)), new Set(Object.keys(fontStore.fonts))); setIssues(items.length ? { groupId: groups[0].id, items } : null); }
      setProgress(`Додано локалізованих груп: ${groups.length}. Перевірте довжину тексту в кожній групі.`);
    }} />}
    {addingGroup && <AddGroupDialog onClose={() => setAddingGroup(false)} onAdd={group => { dispatch({ type: 'group.add', group }); select({ kind: 'group', groupId: group.id }); }} />}
    {generating && project && <GenerateProjectDialog project={project} apiKey={apiKey} setApiKey={setApiKey} model={model} setModel={setModel} onClose={() => setGenerating(false)} onSave={metadata => dispatch({ type: 'project.update', patch: metadata })} onGenerate={(group, metadata) => {
      dispatch({ type: 'batch', commands: [{ type: 'project.update', patch: metadata }, { type: 'group.add', group }] });
      select({ kind: 'group', groupId: group.id }); setGenerating(false); setProgress(`AI створив групу «${group.name}» із ${group.slides.length} слайдами. Додайте screenshots у mockup-плейсхолдери.`);
    }} />}
  </div></AssetContext.Provider></FontContext.Provider>;
}
