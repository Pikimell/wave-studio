import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import styles from './GroupCanvas.module.css';
import { ChevronDown, ChevronRight, Plus, Settings2, Trash2 } from 'lucide-react';
import { elementBounds, groupWidth, hitTest, resizeElement } from '../../domain/geometry';
import type { ElementGeometry, Group, StudioElement } from '../../domain/schema';
import { selectedElements, toggleElement, type Selection } from '../../domain/selection';
import { snapTranslation, type Guide } from '../../domain/snapping';
import { SnapGuides } from './SnapGuides';
import { useAssetContext } from '../../hooks/useAssets';
import { useFontReady } from '../../hooks/useFontReady';
import { createScene } from '../../render/scene';
import { SlideViewport } from './SlideViewport';
import { SelectionOverlay, type GestureMode } from './SelectionOverlay';
export interface GeometryDraft { groupId: string; resized?: boolean; changes: { elementId: string; geometry: ElementGeometry }[] }
export interface CanvasPointer { groupId: string; x: number; y: number }
export function GroupCanvas({ group, selection, select, zoom, collapsed, onToggleCollapsed, onAddSlide, draft, onDraft, onCommit, onPointer, onDuplicate, onDelete, onExport, exporting, onLocalize, onUploadScreenshot }: {
  group: Group; selection: Selection; select: (selection: Selection) => void; zoom: number; collapsed: boolean; onToggleCollapsed: () => void;
  onAddSlide: () => void; onDuplicate: () => void; onDelete: () => void; onExport: () => void; onLocalize: () => void; exporting: boolean; draft: GeometryDraft | null; onDraft: (draft: GeometryDraft | null) => void;
  onCommit: (draft: GeometryDraft) => void; onPointer: (pointer: CanvasPointer | null) => void;
  onUploadScreenshot: (elementId: string, file: File) => Promise<void>;
}) {
  const { urls } = useAssetContext();
  const fontVersion = useFontReady(group.elements);
  const namespace = useId().replace(/:/g, '');
  const scroll = useRef<HTMLDivElement>(null), svg = useRef<SVGSVGElement>(null);
  const screenshotInput = useRef<HTMLInputElement>(null), screenshotTarget = useRef<string | null>(null);
  const previousScale = useRef(zoom / 100);
  const scale = zoom / 100;
  const display = useMemo(() => draft?.groupId === group.id ? { ...group, elements: group.elements.map(e => { const change = draft.changes.find(c => c.elementId === e.id); return change ? { ...e, ...change.geometry } : e; }) } : group, [group, draft]);
  const scene = useMemo(() => { void fontVersion; return createScene(display, urls); }, [display, urls, fontVersion]);
  const selected = selectedElements({ ...display, elements: scene.elements }, selection);
  const [guides, setGuides] = useState<Guide[]>([]);
  const bounds = createScene(group).elements.map(elementBounds);
  const left = Math.min(-160, ...bounds.map(b => b.x - 160));
  const right = Math.max(groupWidth(group) + 160, ...bounds.map(b => b.x + b.width + 160));
  const top = 0;
  const bottom = group.height;
  const gesture = useRef<{ element: StudioElement; mode: GestureMode; x: number; y: number; moving: StudioElement[]; latest: GeometryDraft['changes']; pointerId: number } | null>(null);
  useLayoutEffect(() => {
    const node = scroll.current;
    if (node && previousScale.current !== scale) {
      node.scrollLeft = (node.scrollLeft + node.clientWidth / 2) * scale / previousScale.current - node.clientWidth / 2;
      previousScale.current = scale;
    }
  }, [scale]);
  function point(event: { clientX: number; clientY: number }) {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  }
  function start(event: PointerEvent<SVGElement>, element: StudioElement, mode: GestureMode) {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    const p = point(event);
    if (event.shiftKey && mode === 'move') { select(toggleElement(selection, group.id, element.id)); return; }
    const moving = mode === 'move' && selected.some(e => e.id === element.id) ? selected : [element];
    if (!selected.some(e => e.id === element.id)) select({ kind: 'element', groupId: group.id, elementIds: [element.id] });
    gesture.current = { element, moving, mode, x: p.x, y: p.y, latest: moving.map(e => ({ elementId: e.id, geometry: e })), pointerId: event.pointerId };
    svg.current?.setPointerCapture(event.pointerId);
  }
  function updateGesture(event: PointerEvent<SVGElement>) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const p = point(event), dx = p.x - current.x, dy = p.y - current.y, element = current.element;
    let geometry: ElementGeometry;
    if (current.mode === 'move') {
      const snapped = event.altKey ? { dx, dy, guides: [] } : snapTranslation(group, current.moving, dx, dy, 6 / scale);
      setGuides(snapped.guides);
      current.latest = current.moving.map(e => ({ elementId: e.id, geometry: { ...e, x: e.x + snapped.dx, y: e.y + snapped.dy } }));
    } else {
      if (current.mode === 'rotate') {
        const cx = element.x + element.width / 2, cy = element.y + element.height / 2;
        const angle = element.rotation + (Math.atan2(p.y - cy, p.x - cx) - Math.atan2(current.y - cy, current.x - cx)) * 180 / Math.PI;
        geometry = { ...element, rotation: ((angle + 540) % 360) - 180 };
      } else geometry = resizeElement(element, dx, dy, current.mode, event.shiftKey);
      current.latest = [{ elementId: element.id, geometry }];
    }
    onDraft({ groupId: group.id, changes: current.latest });
  }
  function finish(cancel: boolean, event?: PointerEvent<SVGElement>) {
    const current = gesture.current;
    if (!current || event && event.pointerId !== current.pointerId) return;
    if (!cancel && event?.type === 'pointerup') updateGesture(event);
    gesture.current = null;
    if (svg.current?.hasPointerCapture(current.pointerId)) svg.current.releasePointerCapture(current.pointerId);
    if (!cancel) onCommit({ groupId: group.id, changes: current.latest, resized: current.mode !== 'move' && current.mode !== 'rotate' });
    onDraft(null); setGuides([]);
  }
  useEffect(() => {
    const cancel = (event: KeyboardEvent) => { if (event.key === 'Escape') finish(true); };
    window.addEventListener('keydown', cancel);
    return () => window.removeEventListener('keydown', cancel);
  });
  const previousOrigin = useRef({ left, top });
  useLayoutEffect(() => {
    const node = scroll.current;
    if (node) {
      node.scrollLeft += (previousOrigin.current.left - left) * scale;
      const workspace = node.closest('.aso-workspace');
      if (workspace) workspace.scrollTop += (previousOrigin.current.top - top) * scale;
    }
    previousOrigin.current = { left, top };
  }, [left, top, scale]);
  return <section className={`${styles.scope} aso-group ${selection?.groupId === group.id ? 'aso-group-active' : ''} ${collapsed ? 'aso-group-collapsed' : ''}`} aria-label={group.name} data-group-id={group.id}>
    <input ref={screenshotInput} type="file" accept="image/*" hidden aria-label="Вибрати скріншот пристрою" onChange={event => {
      const file = event.currentTarget.files?.[0], elementId = screenshotTarget.current;
      event.currentTarget.value = '';
      if (file && elementId) void onUploadScreenshot(elementId, file);
    }} />
    <header className="aso-group-header"><div className="aso-group-title"><button className="aso-group-toggle" type="button" aria-expanded={!collapsed} aria-label={collapsed ? `Розгорнути групу ${group.name}` : `Згорнути групу ${group.name}`} title={collapsed ? 'Розгорнути групу' : 'Згорнути групу'} onClick={onToggleCollapsed}>{collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}</button><button className="aso-group-name" onClick={() => select({ kind: 'group', groupId: group.id })}><span className="aso-locale">{group.locale}</span><strong>{group.name}</strong><small>{group.width} × {group.height} · {group.slides.length} slides{group.prefix && ` · ${group.prefix}`}{group.variant && ` / ${group.variant}`}</small></button></div>
      <div className="aso-row"><button onClick={onLocalize} disabled={!group.elements.some(e => e.type === 'text')}>Localize</button><button onClick={onExport} disabled={exporting || !group.slides.length}>Export ZIP</button><button onClick={onDuplicate}>Duplicate</button><button onClick={onAddSlide}><Plus size={14} />Add Slide</button><button aria-label={`Налаштування ${group.name}`} onClick={() => select({ kind: 'group', groupId: group.id })}><Settings2 size={16} /></button><button aria-label={`Видалити групу ${group.name}`} title="Видалити групу" onClick={onDelete}><Trash2 size={16} /></button></div>
    </header>
    {!collapsed && <div className="aso-group-scroll" ref={scroll}>
      <div className="aso-slide-labels" style={{ width: (right - left) * scale, paddingLeft: -left * scale, gap: group.gap * scale }}>
        {group.slides.map((slide, index) => <button key={slide.id} style={{ width: group.width * scale }} aria-pressed={selection?.kind === 'slide' && selection.slideId === slide.id} onClick={() => select({ kind: 'slide', groupId: group.id, slideId: slide.id })}><span>{String(index + 1).padStart(2, '0')}</span><span>{group.width} × {group.height}</span></button>)}
      </div>
      <svg ref={svg} className="aso-canvas" width={(right - left) * scale} height={(bottom - top) * scale} viewBox={`${left} ${top} ${right - left} ${bottom - top}`} role="img" aria-label={`Полотно ${group.name}`} onDoubleClick={event => {
        const p = point(event), element = hitTest({ ...display, elements: scene.elements }, p.x, p.y);
        if (element?.type !== 'device') return;
        event.preventDefault();
        screenshotTarget.current = element.id;
        select({ kind: 'element', groupId: group.id, elementIds: [element.id] });
        screenshotInput.current?.click();
      }} onPointerDown={event => {
        const p = point(event), element = hitTest({ ...display, elements: scene.elements }, p.x, p.y);
        if (element) start(event, element, 'move');
        else {
          const index = Math.floor(p.x / (group.width + group.gap));
          const inSlide = p.x >= 0 && p.y >= 0 && p.y <= group.height && p.x - index * (group.width + group.gap) <= group.width && !!group.slides[index];
          select(inSlide ? { kind: 'slide', groupId: group.id, slideId: group.slides[index].id } : { kind: 'group', groupId: group.id });
        }
      }} onPointerLeave={() => onPointer(null)} onPointerMove={event => {
        const pointer = point(event);
        const index = Math.floor(pointer.x / (group.width + group.gap));
        onPointer(pointer.x >= 0 && pointer.y >= 0 && pointer.y <= group.height && !!group.slides[index] && pointer.x - index * (group.width + group.gap) <= group.width ? { groupId: group.id, x: pointer.x, y: pointer.y } : null);
        updateGesture(event);
      }} onPointerUp={event => finish(false, event)} onPointerCancel={event => finish(false, event)} onLostPointerCapture={event => finish(false, event)}>
        {scene.slides.map((slide, index) => <SlideViewport key={slide.id} scene={scene} index={index} namespace={namespace} />)}
        {selection?.kind === 'slide' && selection.groupId === group.id && scene.slides.filter(s => s.id === selection.slideId).map(s => <rect key={s.id} {...s.rect} fill="none" stroke="var(--aso-focus)" strokeWidth={2 / scale} pointerEvents="none" />)}
        {selection?.groupId === group.id && scene.slides.map(slide => <rect key={`padding-${slide.id}`} x={slide.rect.x + slide.padding.left} y={slide.padding.top} width={Math.max(0, group.width - slide.padding.left - slide.padding.right)} height={Math.max(0, group.height - slide.padding.top - slide.padding.bottom)} fill="none" stroke="var(--aso-guide-safe)" strokeOpacity={0.25} strokeWidth={1 / scale} strokeDasharray={`${4 / scale} ${4 / scale}`} pointerEvents="none" />)}
        <SnapGuides guides={guides} scale={scale} />
        {selected.map(element => <SelectionOverlay key={element.id} element={element} scale={scale} onStart={(event, mode) => start(event, element, mode)} />)}
      </svg>
      {!group.slides.length && <p className="aso-note">Група порожня. Додайте перший слайд.</p>}
    </div>}
  </section>;
}
