import { BUILTIN_BACKGROUNDS } from '../../domain/backgrounds';
import { GRADIENT_PRESETS } from '../../domain/gradientPresets';
import type { Background } from '../../domain/schema';
import { AssetPicker } from './AssetInspector';
import { NumberField } from './Fields';
import styles from './BackgroundEditor.module.css';
import { InspectorSection } from './InspectorSection';

const gradientCss = (background: Extract<Background, { type: 'gradient' }>) =>
  `linear-gradient(${background.angle}deg, ${background.from}, ${background.mid ? `${background.mid}, ` : ''}${background.to})`;

export function BackgroundEditor({ background, onChange, inherited = false }: { background: Background | null; onChange: (value: Background | null) => void; inherited?: boolean }) {
  return <>
    <label className="aso-field"><span>Тип фону</span><select value={background?.type ?? 'inherit'} onChange={e => {
      const type = e.target.value;
      onChange(type === 'inherit' ? null : type === 'solid' ? { type, color: '#243447' } : type === 'gradient' ? { ...GRADIENT_PRESETS[0].background } : { type: 'image', asset: { assetId: 'missing' }, fit: 'cover' });
    }}>{inherited && <option value="inherit">Успадкувати фон групи</option>}<option value="solid">Суцільний колір</option><option value="gradient">Градієнт</option><option value="image">Зображення</option></select></label>
    {background?.type === 'solid' && <label className="aso-field"><span>Колір фону</span><input type="color" value={background.color} onChange={e => onChange({ ...background, color: e.target.value })} /></label>}
    {background?.type === 'gradient' && <><div className={styles.colors}>{(['from', 'mid', 'to'] as const).map(key => <label className="aso-field" key={key}><span>{key === 'from' ? 'Початок' : key === 'mid' ? 'Середина' : 'Кінець'}</span><input type="color" value={background[key] ?? background.from} onChange={e => onChange({ ...background, [key]: e.target.value })} /></label>)}</div><NumberField label="Кут градієнта" value={background.angle} min={-360} max={360} onChange={angle => onChange({ ...background, angle })} /></>}
    {background?.type === 'image' && <><AssetPicker assetId={background.asset.assetId === 'missing' ? undefined : background.asset.assetId} onChange={asset => onChange({ ...background, asset: { assetId: asset.id } })} /><label className="aso-field"><span>Масштаб фону</span><select value={background.fit} onChange={e => onChange({ ...background, fit: e.target.value as 'cover' | 'stretch' })}><option value="cover">Cover</option><option value="stretch">Stretch</option></select></label></>}
    <InspectorSection title="Готові градієнти" defaultOpen={false}><div className={styles.presets}><p>М’які поєднання кольорів у стилі iOS і macOS</p>
      {(['Світлі', 'Насичені', 'Темні'] as const).map(category => <div className={styles.category} key={category}><h5>{category}</h5><div className={styles.presetGrid}>{GRADIENT_PRESETS.filter(preset => preset.category === category).map(preset => <button type="button" key={preset.id} className={styles.preset} aria-label={`Градієнт ${preset.name}`} aria-pressed={background?.type === 'gradient' && JSON.stringify(background) === JSON.stringify(preset.background)} onClick={() => onChange({ ...preset.background })}><span className={styles.swatch} style={{ background: gradientCss(preset.background) }} /><span>{preset.name}</span></button>)}</div></div>)}
      <div className={styles.category}><h5>Інші фони</h5><div className={styles.otherGrid}>{BUILTIN_BACKGROUNDS.map(bg => <button type="button" key={bg.id} onClick={() => onChange({ type: 'image', asset: { assetId: bg.id }, fit: 'cover' })}>{bg.name}</button>)}<button type="button" onClick={() => onChange({ type: 'solid', color: '#243447' })}>Midnight</button></div></div>
    </div></InspectorSection>
  </>;
}
