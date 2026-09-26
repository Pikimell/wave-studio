import { Image, Shapes, Smartphone, Sparkles, Type } from 'lucide-react';
import type { Group, StudioElement } from '../../domain/schema';
const types = [
  { type: 'text', label: 'Текст', icon: Type }, { type: 'device', label: 'Пристрій', icon: Smartphone },
  { type: 'image', label: 'Зображення', icon: Image }, { type: 'shape', label: 'Фігура', icon: Shapes },
  { type: 'decoration', label: 'Декор', icon: Sparkles }
] as const;
export function ElementsSidebar({ group, onAdd, onSelect }: { group?: Group; onAdd: (type: StudioElement['type']) => void; onSelect: (id: string, additive: boolean) => void }) {
  return <aside className="aso-sidebar"><h2>Елементи</h2><p>Додайте до активної групи</p>
    <div className="aso-element-tools">{types.map(({ type, label, icon: Icon }) => <button key={type} onClick={() => onAdd(type)} disabled={!group}><Icon size={21} /><span>{label}</span></button>)}</div>
    <p className="aso-note">Зображення й screenshots додаються в Inspector. Shift + click — мультивибір. Alt при русі — без snapping.</p>
    {group && <><h2>У групі</h2><div className="aso-object-list">{group.elements.map((element, index) => <button key={element.id} onClick={event => onSelect(element.id, event.shiftKey)}>{types.find(t => t.type === element.type)?.label} {index + 1}</button>)}</div></>}
    <div className="aso-sidebar-bottom">Координати — у px.<br />Gap не є частиною слайда.<br />Зміни можна скасувати.</div>
  </aside>;
}
