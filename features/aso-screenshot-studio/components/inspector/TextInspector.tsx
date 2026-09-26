import type { TextElement, TextStyle } from '../../domain/schema';
import { newId } from '../../domain/schema';
import { layoutText } from '../../render/text';
import { NumberField } from './Fields';
const FONTS = ['Arial', 'Georgia', 'Verdana', 'Courier New'];
export function TextInspector({ element, update }: { element: TextElement; update: (patch: Partial<Omit<TextElement, 'id' | 'type'>>) => void }) {
  const layout = layoutText(element);
  const style = (patch: Partial<TextStyle>) => update({ style: { ...element.style, ...patch } });
  return <>
    <h2 className="aso-section-title">Типографіка</h2>
    <label className="aso-field"><span>Шрифт</span><select value={element.style.fontFamily} onChange={e => style({ fontFamily: e.target.value })}>{!FONTS.includes(element.style.fontFamily) && <option>{element.style.fontFamily}</option>}{FONTS.map(font => <option key={font}>{font}</option>)}</select></label>
    <div className="aso-grid2"><NumberField label="Розмір шрифту" value={element.style.fontSize} min={1} max={2000} onChange={fontSize => style({ fontSize })} /><label className="aso-field"><span>Вага</span><select value={element.style.fontWeight} onChange={e => style({ fontWeight: Number(e.target.value) })}>{[100,200,300,400,500,600,700,800,900].map(weight => <option key={weight}>{weight}</option>)}</select></label></div>
    <div className="aso-grid2"><label className="aso-field"><span>Колір тексту</span><input type="color" value={element.style.color} onChange={e => style({ color: e.target.value })} /></label><label className="aso-check"><input type="checkbox" checked={element.style.italic} onChange={e => style({ italic: e.target.checked })} />Курсив</label></div>
    <div className="aso-grid2"><NumberField label="Line height" value={element.lineHeight} min={0.1} max={10} step={0.05} onChange={lineHeight => update({ lineHeight })} /><NumberField label="Letter spacing" value={element.letterSpacing} min={-100} max={1000} step={0.1} onChange={letterSpacing => update({ letterSpacing })} /></div>
    <div className="aso-grid2"><label className="aso-field"><span>Горизонтально</span><select value={element.textAlign} onChange={e => update({ textAlign: e.target.value as TextElement['textAlign'] })}><option value="left">Ліворуч</option><option value="center">По центру</option><option value="right">Праворуч</option></select></label><label className="aso-field"><span>Вертикально</span><select value={element.verticalAlign} onChange={e => update({ verticalAlign: e.target.value as TextElement['verticalAlign'] })}><option value="top">Зверху</option><option value="center">По центру</option><option value="bottom">Знизу</option></select></label></div>
    <div className="aso-grid2">{(['widthMode', 'heightMode'] as const).map(key => <label className="aso-field" key={key}><span>{key === 'widthMode' ? 'Ширина' : 'Висота'}: режим</span><select value={element[key]} onChange={e => update({ [key]: e.target.value })}><option value="fixed">Fixed</option><option value="auto">Auto</option></select></label>)}</div>
    <p className="aso-note">Фактичний блок: {Math.round(layout.width)} × {Math.round(layout.height)} px</p>
    <label className="aso-check"><input type="checkbox" checked={element.wrap} onChange={e => update({ wrap: e.target.checked })} />Автоматичний перенос</label>
    <NumberField label="Padding тексту" value={element.padding} min={0} max={6000} onChange={padding => update({ padding })} />
    <label className="aso-check"><input type="checkbox" checked={element.background !== null} onChange={e => update({ background: e.target.checked ? '#334155' : null })} />Фон тексту</label>
    {element.background !== null && <label className="aso-field"><span>Колір фону тексту</span><input type="color" value={element.background} onChange={e => update({ background: e.target.value })} /></label>}
    {layout.overflow && <p className="aso-warning">Текст виходить за межі блока й обрізається. Збільште розмір або оберіть Auto.</p>}
    <h2 className="aso-section-title">Текст і фрагменти</h2>
    <p className="aso-note">Фрагменти утворюють один текст. Enter додає ручний перенос; кожен фрагмент може мати власний стиль.</p>
    {element.segments.map((segment, index) => {
      const change = (patch: Partial<typeof segment>) => update({ segments: element.segments.map(s => s.id === segment.id ? { ...s, ...patch } : s) });
      const override = (patch: Partial<TextStyle>) => change({ style: { ...segment.style, ...patch } });
      return <div className="aso-segment" key={segment.id}>
        <label className="aso-field"><span>Текст сегмента {index + 1}</span><textarea rows={3} maxLength={100000} value={segment.text} onChange={e => change({ text: e.target.value })} /></label>
        <details><summary>Стиль фрагмента {index + 1}</summary>
          <label className="aso-field"><span>Шрифт фрагмента {index + 1}</span><select value={segment.style.fontFamily ?? ''} onChange={e => {
            const next = { ...segment.style }; if (e.target.value) next.fontFamily = e.target.value; else delete next.fontFamily; change({ style: next });
          }}><option value="">Успадкувати</option>{FONTS.map(font => <option key={font}>{font}</option>)}</select></label>
          <NumberField label={`Розмір фрагмента ${index + 1}`} value={segment.style.fontSize ?? element.style.fontSize} min={1} max={2000} onChange={fontSize => override({ fontSize })} />
          <label className="aso-field"><span>Колір фрагмента {index + 1}</span><input type="color" value={segment.style.color ?? element.style.color} onChange={e => override({ color: e.target.value })} /></label>
          <label className="aso-field"><span>Вага фрагмента {index + 1}</span><select value={segment.style.fontWeight ?? ''} onChange={e => {
            const next = { ...segment.style }; if (e.target.value) next.fontWeight = Number(e.target.value); else delete next.fontWeight; change({ style: next });
          }}><option value="">Успадкувати</option>{[400,500,600,700,800,900].map(weight => <option key={weight}>{weight}</option>)}</select></label>
          <label className="aso-check"><input type="checkbox" checked={segment.style.italic ?? element.style.italic} onChange={e => override({ italic: e.target.checked })} />Курсив фрагмента</label>
          <button onClick={() => change({ style: {} })}>Скинути стиль</button>
        </details>
        {element.segments.length > 1 && <button onClick={() => update({ segments: element.segments.filter(s => s.id !== segment.id) })}>Видалити фрагмент {index + 1}</button>}
      </div>;
    })}
    <button onClick={() => update({ segments: [...element.segments, { id: newId(), text: 'New fragment', style: {} }] })}>+ Додати фрагмент</button>
  </>;
}
