import { useRef, useState } from 'react';
import type { StudioElement } from '../../domain/schema';
import type { ElementPatch } from '../../domain/commands';
import { DEVICES } from '../../domain/devices';
import { useAssetContext } from '../../hooks/useAssets';
import { NumberField } from './Fields';
export function AssetPicker({ assetId, onChange, label = 'Завантажити зображення' }: { assetId?: string; onChange: (id: string) => void; label?: string }) {
  const { assets, upload } = useAssetContext();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <div className="aso-asset-picker">
    <p className="aso-note">{assetId ? assets[assetId]?.name ?? 'Файл відсутній — завантажте повторно' : 'PNG, JPEG або WebP · до 20 MB'}</p>
    <button disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Завантаження…' : label}</button>
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
      setBusy(true); setError('');
      try { onChange(await upload(file)); } catch (e) { setError(e instanceof Error ? e.message : 'Не вдалося завантажити'); }
      finally { setBusy(false); }
    }} />
    {Object.keys(assets).length > 0 && <label className="aso-field"><span>З наявних файлів</span><select value={assetId ?? ''} onChange={e => onChange(e.target.value)}><option value="" disabled>Оберіть файл</option>{assetId && !assets[assetId] && <option value={assetId}>Відсутній файл</option>}{Object.values(assets).map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label>}
    {error && <p className="aso-warning" role="alert">{error}</p>}
  </div>;
}
export function AssetInspector({ element, update }: { element: StudioElement; update: (patch: ElementPatch) => void }) {
  return <>
    <NumberField label="Opacity" value={element.opacity} min={0} max={1} step={0.05} onChange={opacity => update({ opacity })} />
    {element.type === 'device' && <><label className="aso-field"><span>Пристрій</span><select value={element.deviceId} onChange={e => {
      const device = DEVICES.find(d => d.id === e.target.value)!;
      update({ deviceId: device.id, height: element.width * device.height / device.width });
    }}>{!DEVICES.some(d => d.id === element.deviceId) && <option value={element.deviceId}>Невідомий пристрій</option>}{DEVICES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label><AssetPicker assetId={element.screenshot?.assetId} label="Upload Screenshot" onChange={assetId => update({ screenshot: { assetId } })} /></>}
    {element.type === 'image' && <><AssetPicker assetId={element.asset?.assetId} onChange={assetId => update({ asset: { assetId } })} /><label className="aso-field"><span>Fit</span><select value={element.fit} onChange={e => update({ fit: e.target.value as 'cover' | 'contain' | 'stretch' })}><option value="cover">Cover</option><option value="contain">Contain</option><option value="stretch">Stretch</option></select></label></>}
    {element.type === 'shape' && <><label className="aso-field"><span>Фігура</span><select value={element.shape} onChange={e => update({ shape: e.target.value as 'rectangle' | 'ellipse' })}><option value="rectangle">Прямокутник</option><option value="ellipse">Еліпс</option></select></label><label className="aso-field"><span>Заливка</span><input type="color" value={element.fill} onChange={e => update({ fill: e.target.value })} /></label>{element.shape === 'rectangle' && <NumberField label="Радіус кутів" value={element.radius} min={0} max={6000} onChange={radius => update({ radius })} />}</>}
    {element.type === 'decoration' && <label className="aso-field"><span>Колір декору</span><input type="color" value={element.color} onChange={e => update({ color: e.target.value })} /></label>}
  </>;
}
