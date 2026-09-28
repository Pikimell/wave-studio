import { useRef, useState } from 'react';
import styles from './AssetInspector.module.css';
import type { StudioElement } from '../../domain/schema';
import type { ElementPatch } from '../../domain/commands';
import { DEVICE_GROUPS, DEVICES } from '../../domain/devices';
import { useAssetContext } from '../../hooks/useAssets';
import type { StoredAsset } from '../../services/assetStore';
import { imageDimensionsWhenStandard } from '../../domain/imageDimensions';
import { NumberField } from './Fields';
interface AssetPickerProps {
  assetId?: string;
  fileName?: string;
  onChange: (asset: StoredAsset) => void;
  label?: string;
  accept?: string;
  note?: string;
  filter?: (asset: StoredAsset) => boolean;
}
export function AssetPicker({ assetId, fileName, onChange, label = 'Завантажити зображення', accept = 'image/png,image/jpeg,image/webp', note = 'PNG, JPEG або WebP · до 20 MB', filter = asset => asset.mimeType !== 'image/svg+xml' }: AssetPickerProps) {
  const { assets, upload } = useAssetContext();
  const uploads = Object.values(assets).filter(asset => !asset.id.startsWith('builtin-') && filter(asset));
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <div className={`${styles.scope} aso-asset-picker`}>
    <p className="aso-note">{assetId ? assets[assetId]?.name ?? (fileName ? `Потрібний файл: ${fileName} — завантажте повторно` : 'Файл відсутній — завантажте повторно') : note}</p>
    <button disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Завантаження…' : label}</button>
    <input ref={input} type="file" accept={accept} hidden onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
      setBusy(true); setError('');
      try { onChange(await upload(file)); } catch (e) { setError(e instanceof Error ? e.message : 'Не вдалося завантажити'); }
      finally { setBusy(false); }
    }} />
    {(uploads.length > 0 || !!assetId) && <label className="aso-field"><span>З наявних файлів</span><select value={assetId ?? ''} onChange={e => { const asset = assets[e.target.value]; if (asset) onChange(asset); }}><option value="" disabled>Оберіть файл</option>{assetId && !uploads.some(asset => asset.id === assetId) && <option value={assetId}>{assets[assetId]?.name ?? fileName ?? 'Відсутній файл'}</option>}{uploads.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label>}
    {error && <p className="aso-warning" role="alert">{error}</p>}
  </div>;
}
export function AssetInspector({ element, update }: { element: StudioElement; update: (patch: ElementPatch) => void }) {
  return <>
    <NumberField label="Opacity" value={element.opacity} min={0} max={1} step={0.05} onChange={opacity => update({ opacity })} />
    {element.type === 'device' && <><label className="aso-field"><span>Пристрій</span><select value={element.deviceId} onChange={e => {
      const device = DEVICES.find(d => d.id === e.target.value)!;
      update({ deviceId: device.id, height: element.width * device.height / device.width });
    }}>{!DEVICES.some(d => d.id === element.deviceId) && <option value={element.deviceId}>Невідомий пристрій</option>}{DEVICE_GROUPS.map(deviceGroup => {
      const devices = DEVICES.filter(device => !device.legacy && device.group === deviceGroup.id);
      return devices.length ? <optgroup key={deviceGroup.id} label={deviceGroup.name}>{devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</optgroup> : null;
    })}{DEVICES.some(d => d.id === element.deviceId && d.legacy) && <optgroup label="Legacy">{DEVICES.filter(d => d.legacy).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</optgroup>}</select></label><AssetPicker assetId={element.screenshot?.assetId} label="Upload Screenshot" onChange={asset => update({ screenshot: { assetId: asset.id } })} /></>}
    {element.type === 'image' && <><AssetPicker assetId={element.asset?.assetId} fileName={element.asset?.fileName} onChange={asset => update({ asset: { assetId: asset.id, fileName: asset.name.slice(0, 255) }, ...imageDimensionsWhenStandard(element, asset.width, asset.height) })} /><label className="aso-field"><span>Fit</span><select value={element.fit} onChange={e => update({ fit: e.target.value as 'cover' | 'contain' | 'stretch' })}><option value="cover">Cover</option><option value="contain">Contain</option><option value="stretch">Stretch</option></select></label></>}
    {element.type === 'svg' && <><AssetPicker assetId={element.asset?.assetId} fileName={element.asset?.fileName} label="Завантажити SVG" accept="image/svg+xml,.svg" note="SVG · до 20 MB" filter={asset => asset.mimeType === 'image/svg+xml'} onChange={asset => update({ asset: { assetId: asset.id, fileName: asset.name.slice(0, 255) }, ...imageDimensionsWhenStandard(element, asset.width, asset.height) })} /><label className="aso-field"><span>Fit</span><select value={element.fit} onChange={e => update({ fit: e.target.value as 'contain' | 'stretch' })}><option value="contain">Contain</option><option value="stretch">Stretch</option></select></label><label className="aso-field"><span>Колір SVG</span><select value={element.colorMode} onChange={e => update({ colorMode: e.target.value as 'original' | 'tint' })}><option value="original">Original</option><option value="tint">Tint</option></select></label>{element.colorMode === 'tint' && <label className="aso-field"><span>Tint</span><input type="color" value={element.tint} onChange={e => update({ tint: e.target.value })} /></label>}</>}
    {element.type === 'shape' && <><label className="aso-field"><span>Фігура</span><select value={element.shape} onChange={e => update({ shape: e.target.value as 'rectangle' | 'ellipse' })}><option value="rectangle">Прямокутник</option><option value="ellipse">Еліпс</option></select></label><label className="aso-field"><span>Заливка</span><input type="color" value={element.fill} onChange={e => update({ fill: e.target.value })} /></label>{element.shape === 'rectangle' && <NumberField label="Радіус кутів" value={element.radius} min={0} max={6000} onChange={radius => update({ radius })} />}</>}
    {element.type === 'decoration' && <label className="aso-field"><span>Колір декору</span><input type="color" value={element.color} onChange={e => update({ color: e.target.value })} /></label>}
  </>;
}
