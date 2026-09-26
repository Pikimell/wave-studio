import { commonValue, selectedElements } from '../../domain/selection';
import type { OrderDirection } from '../../domain/elements';
import type { Command, GroupPatch } from '../../domain/commands';
import { LIMITS, type ElementGeometry, type Group, type Project } from '../../domain/schema';
import { PRESETS } from '../../domain/presets';
import type { Selection } from '../../hooks/useSelection';
import { PresetOptions } from '../dialogs/AddGroupDialog';
import { AssetInspector } from './AssetInspector';
import { BackgroundEditor } from './BackgroundEditor';
import { SlideInspector } from './SlideInspector';
import { TextInspector } from './TextInspector';
import { NumberField, TextField } from './Fields';
export function Inspector({ project, selection, dispatch, onExportSlide, exporting }: { project: Project | null; selection: Selection; dispatch: (command: Command) => void; onExportSlide: (groupId: string, slideId: string) => void; exporting: boolean }) {
  const group = project?.groups.find(g => g.id === selection?.groupId);
  if (!group || !selection) return <aside className="aso-inspector"><h2>Inspector</h2><p>Оберіть групу, слайд або елемент, щоб змінити його властивості.</p></aside>;
  const updateGroup = (patch: GroupPatch) => dispatch({ type: 'group.update', groupId: group.id, patch });
  const selected = selectedElements(group, selection);
  if (selected.length > 1) return <MultiInspector group={group} elements={selected} dispatch={dispatch} />;
  const element = selected[0];
  const slide = selection.kind === 'slide' ? group.slides.find(s => s.id === selection.slideId) : undefined;
  const geometry = (key: keyof ElementGeometry, value: number) => element && dispatch({ type: 'element.geometry', groupId: group.id, elementId: element.id, patch: { [key]: value } });
  return <aside className="aso-inspector"><h2>{element ? element.type : slide ? `Слайд ${group.slides.indexOf(slide) + 1}` : 'Група'}</h2>
    {element ? <>
      <p>Позиція у просторі групи</p><div className="aso-grid2">{(['x', 'y', 'width', 'height', 'rotation', 'zIndex'] as const).map(key => <NumberField key={key} label={{ x: 'X', y: 'Y', width: 'Ширина', height: 'Висота', rotation: 'Поворот, °', zIndex: 'Z-index' }[key]} value={element[key]} onChange={v => geometry(key, v)} min={key === 'width' || key === 'height' ? 1 : key === 'rotation' ? -360 : key === 'zIndex' ? -1000000 : -LIMITS.coordinate} max={key === 'width' || key === 'height' ? LIMITS.dimension : key === 'rotation' ? 360 : key === 'zIndex' ? 1000000 : LIMITS.coordinate} step={key === 'zIndex' ? 1 : 0.1} />)}</div>
      {element.type === 'text' && <TextInspector element={element} update={patch => dispatch({ type: 'element.text', groupId: group.id, elementId: element.id, patch })} />}
      <AssetInspector key={element.id} element={element} update={patch => dispatch({ type: 'element.update', groupId: group.id, elementId: element.id, patch })} />
      <OrderControls groupId={group.id} ids={[element.id]} dispatch={dispatch} />
      <button className="aso-danger" onClick={() => dispatch({ type: 'element.delete', groupId: group.id, elementId: element.id })}>Видалити елемент</button>
    </> : slide ? <SlideInspector key={slide.id} group={group} slide={slide} dispatch={dispatch} onExport={() => onExportSlide(group.id, slide.id)} exporting={exporting} /> : <GroupFields group={group} update={updateGroup} />}
    {!element && !slide && <button className="aso-danger" onClick={() => dispatch({ type: 'group.delete', groupId: group.id })}>Видалити групу</button>}
  </aside>;
}
function GroupFields({ group, update }: { group: Group; update: (patch: GroupPatch) => void }) {
  return <>
    <TextField label="Назва" value={group.name} onChange={name => update({ name })} />
    <label className="aso-field"><span>Preset</span><select value={group.presetId} onChange={e => {
      const preset = PRESETS.find(p => p.id === e.target.value)!;
      update({ presetId: preset.id, platform: preset.platform, width: preset.width, height: preset.height });
    }}>{!PRESETS.some(p => p.id === group.presetId) && <option value={group.presetId}>Імпортований розмір</option>}<PresetOptions /></select></label>
    <div className="aso-grid2"><NumberField label="Ширина" value={group.width} min={320} max={LIMITS.dimension} onChange={width => update({ width })} /><NumberField label="Висота" value={group.height} min={320} max={LIMITS.dimension} onChange={height => update({ height })} /></div>
    <TextField label="Locale" value={group.locale} maxLength={40} onChange={locale => update({ locale })} />
    <div className="aso-grid2"><TextField label="Prefix" value={group.prefix} maxLength={100} onChange={prefix => update({ prefix })} /><TextField label="Variant" value={group.variant} maxLength={100} onChange={variant => update({ variant })} /></div>
    <NumberField label="Gap, px" value={group.gap} min={0} max={LIMITS.gap} onChange={gap => update({ gap })} />
    <label className="aso-field"><span>Область фону</span><select value={group.backgroundScope} onChange={e => update({ backgroundScope: e.target.value as 'group' | 'slide' })}><option value="group">Whole Group</option><option value="slide">Repeat Per Slide</option></select></label>
    <BackgroundEditor background={group.background} onChange={background => background && update({ background })} />
    <p className="aso-note">Розміри змінюють область слайда. Елементи зберігають свої координати й масштаб.</p>
  </>;
}

function OrderControls({ groupId, ids, dispatch }: { groupId: string; ids: string[]; dispatch: (command: Command) => void }) {
  return <div className="aso-grid2 aso-order">{([['back', 'На задній план'], ['backward', 'На крок назад'], ['forward', 'На крок вперед'], ['front', 'На передній план']] as [OrderDirection, string][]).map(([direction, label]) => <button key={direction} onClick={() => dispatch({ type: 'elements.order', groupId, elementIds: ids, direction })}>{label}</button>)}</div>;
}
function MultiInspector({ group, elements, dispatch }: { group: Group; elements: import('../../domain/schema').StudioElement[]; dispatch: (command: Command) => void }) {
  const texts = elements.filter(e => e.type === 'text');
  const allText = texts.length === elements.length;
  return <aside className="aso-inspector"><h2>Вибрано: {elements.length}</h2><p>Shift + click додає або прибирає елемент із вибору. Mixed — різні значення.</p>
    <div className="aso-grid2">{(['x', 'y', 'width', 'height', 'rotation', 'opacity'] as const).map(key => <NumberField key={key} label={key} value={commonValue(elements.map(e => e[key]))} min={key === 'opacity' ? 0 : key === 'width' || key === 'height' ? 1 : key === 'rotation' ? -360 : -LIMITS.coordinate} max={key === 'opacity' ? 1 : key === 'width' || key === 'height' ? LIMITS.dimension : key === 'rotation' ? 360 : LIMITS.coordinate} step={0.1} onChange={value => dispatch({ type: 'batch', commands: elements.map(element => ({ type: 'element.geometry', groupId: group.id, elementId: element.id, patch: { [key]: value } })) })} />)}</div>
    {allText && <>
      <NumberField label="Розмір шрифту" value={commonValue(texts.map(e => e.style.fontSize))} min={1} max={2000} onChange={fontSize => dispatch({ type: 'batch', commands: texts.map(e => ({ type: 'element.text', groupId: group.id, elementId: e.id, patch: { style: { ...e.style, fontSize } } })) })} />
      <label className="aso-field"><span>Шрифт {commonValue(texts.map(e => e.style.fontFamily)) === undefined ? '· Mixed' : ''}</span><select value={commonValue(texts.map(e => e.style.fontFamily)) ?? ''} onChange={event => dispatch({ type: 'batch', commands: texts.map(e => ({ type: 'element.text', groupId: group.id, elementId: e.id, patch: { style: { ...e.style, fontFamily: event.target.value } } })) })}><option value="" disabled>Mixed</option>{['Arial', 'Georgia', 'Verdana', 'Courier New'].map(font => <option key={font}>{font}</option>)}</select></label>
      <label className="aso-field"><span>Колір {commonValue(texts.map(e => e.style.color)) === undefined ? '· Mixed' : ''}</span><input type="color" value={commonValue(texts.map(e => e.style.color)) ?? '#ffffff'} onChange={event => dispatch({ type: 'batch', commands: texts.map(e => ({ type: 'element.text', groupId: group.id, elementId: e.id, patch: { style: { ...e.style, color: event.target.value } } })) })} /></label>
    </>}
    <OrderControls groupId={group.id} ids={elements.map(e => e.id)} dispatch={dispatch} />
    <button className="aso-danger" onClick={() => dispatch({ type: 'batch', commands: elements.map(e => ({ type: 'element.delete', groupId: group.id, elementId: e.id })) })}>Видалити вибрані</button>
  </aside>;
}
