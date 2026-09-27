import { useState } from 'react';
import type { Command } from '../../domain/commands';
import { createSlide, type Group, type Slide } from '../../domain/schema';
import { BackgroundEditor } from './BackgroundEditor';
import { NumberField } from './Fields';
import { InspectorSection } from './InspectorSection';
export function SlideInspector({ group, slide, dispatch, onExport, exporting }: { group: Group; slide: Slide; dispatch: (command: Command) => void; onExport: () => void; exporting: boolean }) {
  const [linked, setLinked] = useState(new Set(Object.values(slide.padding)).size === 1);
  const index = group.slides.findIndex(s => s.id === slide.id);
  return <>
    <p>{group.width} × {group.height} px</p>
    <InspectorSection title="Safe area">
    <label className="aso-check"><input type="checkbox" checked={linked} onChange={e => {
      setLinked(e.target.checked);
      if (e.target.checked) dispatch({ type: 'slide.update', groupId: group.id, slideId: slide.id, patch: { padding: { top: slide.padding.top, right: slide.padding.top, bottom: slide.padding.top, left: slide.padding.top } } });
    }} />Однакові відступи</label>
    <div className="aso-grid2">{(linked ? ['top'] as const : ['top', 'right', 'bottom', 'left'] as const).map(side => <NumberField key={side} label={linked ? 'Padding, px' : side} value={slide.padding[side]} min={0} max={Math.min(group.width, group.height) / 2} onChange={value => dispatch({ type: 'slide.update', groupId: group.id, slideId: slide.id, patch: { padding: linked ? { top: value, right: value, bottom: value, left: value } : { ...slide.padding, [side]: value } } })} />)}</div>
    </InspectorSection>
    <InspectorSection title="Фон слайда">
    <BackgroundEditor background={slide.background} inherited onChange={background => dispatch({ type: 'slide.update', groupId: group.id, slideId: slide.id, patch: { background } })} />
    </InspectorSection>
    <InspectorSection title="Порядок і дії">
    <div className="aso-grid2"><button onClick={() => dispatch({ type: 'slide.insert', groupId: group.id, index, slide: createSlide() })}>Вставити до</button><button onClick={() => dispatch({ type: 'slide.insert', groupId: group.id, index: index + 1, slide: createSlide() })}>Вставити після</button><button disabled={index === 0} onClick={() => dispatch({ type: 'slide.reorder', groupId: group.id, slideId: slide.id, to: index - 1 })}>← Ліворуч</button><button disabled={index === group.slides.length - 1} onClick={() => dispatch({ type: 'slide.reorder', groupId: group.id, slideId: slide.id, to: index + 1 })}>Праворуч →</button></div>
    <p className="aso-note">Видалення слайда також видаляє елементи, які його перетинають. Undo повертає всю композицію.</p>
    <button className="aso-primary" disabled={exporting} onClick={onExport}>Export Slide · PNG</button>
    <button className="aso-danger" onClick={() => dispatch({ type: 'slide.delete', groupId: group.id, slideId: slide.id })}>Видалити слайд</button>
    </InspectorSection>
  </>;
}
