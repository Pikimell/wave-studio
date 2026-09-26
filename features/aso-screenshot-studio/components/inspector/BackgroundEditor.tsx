import { BUILTIN_BACKGROUNDS } from '../../domain/backgrounds';
import type { Background } from '../../domain/schema';
import { AssetPicker } from './AssetInspector';
import { NumberField } from './Fields';
export function BackgroundEditor({ background, onChange, inherited = false }: { background: Background | null; onChange: (value: Background | null) => void; inherited?: boolean }) {
  return <>
    <label className="aso-field"><span>Тип фону</span><select value={background?.type ?? 'inherit'} onChange={e => {
      const type = e.target.value;
      onChange(type === 'inherit' ? null : type === 'solid' ? { type, color: '#243447' } : type === 'gradient' ? { type, from: '#4338ca', to: '#22d3ee', angle: 30 } : { type: 'image', asset: { assetId: 'missing' }, fit: 'cover' });
    }}>{inherited && <option value="inherit">Успадкувати фон групи</option>}<option value="solid">Solid</option><option value="gradient">Gradient</option><option value="image">Image</option></select></label>
    {background?.type === 'solid' && <label className="aso-field"><span>Колір фону</span><input type="color" value={background.color} onChange={e => onChange({ ...background, color: e.target.value })} /></label>}
    {background?.type === 'gradient' && <><div className="aso-grid2">{(['from', 'to'] as const).map(key => <label className="aso-field" key={key}><span>{key === 'from' ? 'Початок' : 'Кінець'} градієнта</span><input type="color" value={background[key]} onChange={e => onChange({ ...background, [key]: e.target.value })} /></label>)}</div><NumberField label="Кут градієнта" value={background.angle} min={-360} max={360} onChange={angle => onChange({ ...background, angle })} /></>}
    {background?.type === 'image' && <><AssetPicker assetId={background.asset.assetId === 'missing' ? undefined : background.asset.assetId} onChange={assetId => onChange({ ...background, asset: { assetId } })} /><label className="aso-field"><span>Масштаб фону</span><select value={background.fit} onChange={e => onChange({ ...background, fit: e.target.value as 'cover' | 'stretch' })}><option value="cover">Cover</option><option value="stretch">Stretch</option></select></label></>}
    <div className="aso-background-presets"><span>Готові фони</span>{BUILTIN_BACKGROUNDS.map(bg => <button key={bg.id} aria-label={`Фон ${bg.name}`} title={bg.name} style={{ background: '#564294' }} onClick={() => onChange({ type: 'image', asset: { assetId: bg.id }, fit: 'cover' })}>◯</button>)}<button title="Midnight" style={{ background: '#243447' }} onClick={() => onChange({ type: 'solid', color: '#243447' })} aria-label="Фон Midnight" /><button title="Aurora" style={{ background: 'linear-gradient(30deg,#4338ca,#22d3ee)' }} onClick={() => onChange({ type: 'gradient', from: '#4338ca', to: '#22d3ee', angle: 30 })} aria-label="Фон Aurora" /><button title="Sunset" style={{ background: 'linear-gradient(45deg,#f97316,#db2777)' }} onClick={() => onChange({ type: 'gradient', from: '#f97316', to: '#db2777', angle: 45 })} aria-label="Фон Sunset" /></div>
  </>;
}
