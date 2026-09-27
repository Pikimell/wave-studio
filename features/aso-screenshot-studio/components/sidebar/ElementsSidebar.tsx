import { useRef, useState } from 'react';
import { ChevronDown, Circle, FileImage, Image as ImageIcon, Laptop, Monitor, RectangleHorizontal, Shapes, Smartphone, Sparkles, Star, Tablet, Type, Upload, Watch } from 'lucide-react';
import styles from './ElementsSidebar.module.css';
import type { Group, StudioElement } from '../../domain/schema';
import { DEVICE_GROUPS, DEVICES, type DeviceSpec } from '../../domain/devices';
import { DECORATIONS } from '../../domain/decorations';
import { useAssetContext } from '../../hooks/useAssets';
import type { StoredAsset } from '../../services/assetStore';

function DeviceIcon({ device }: { device: DeviceSpec }) {
  if (device.formFactor === 'tablet') return <Tablet size={15} />;
  if (device.formFactor === 'laptop') return <Laptop size={15} />;
  if (device.formFactor === 'desktop') return <Monitor size={15} />;
  if (device.formFactor === 'watch') return <Watch size={15} />;
  return <Smartphone size={15} />;
}

export function ElementsSidebar({ group, onAdd, onAddAsset, onSelect }: { group?: Group; onAdd: (type: StudioElement['type'], variant?: string) => void; onAddAsset: (asset: StoredAsset) => void; onSelect: (id: string, additive: boolean) => void }) {
  const { assets, upload } = useAssetContext();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const uploads = Object.values(assets).filter(asset => !asset.id.startsWith('builtin-'));
  return <aside className={`${styles.sidebar} aso-sidebar`} aria-label="Панель елементів">
    <div className={styles.intro}><span className={styles.eyebrow}>ІНСТРУМЕНТИ</span><h2>Додати на слайд</h2><p>Оберіть елемент для активної групи.</p></div>
    <details className={styles.section} open><summary className={styles.sectionHeading}><Shapes size={16} /><span>Елементи</span><ChevronDown size={15} /></summary><nav className={styles.menu} aria-label="Додавання елементів">
      <button className={styles.menuItem} disabled={!group} onClick={() => onAdd('text')}><Type size={19} /><span><strong>Текст</strong><small>Заголовок або підпис</small></span></button>
      <button className={styles.menuItem} disabled={!group} onClick={() => onAdd('image')}><ImageIcon size={19} /><span><strong>Зображення</strong><small>Додати блок для файлу</small></span></button>
      <details className={styles.category}><summary><Smartphone size={19} /><span><strong>Пристрій</strong><small>Рамки для скріншота</small></span><ChevronDown className={styles.chevron} size={15} /></summary><div className={styles.options}>{DEVICE_GROUPS.map(deviceGroup => {
        const devices = DEVICES.filter(device => !device.legacy && device.group === deviceGroup.id);
        if (!devices.length) return null;
        return <div className={styles.deviceGroup} key={deviceGroup.id}><span>{deviceGroup.name}</span>{devices.map(device => <button key={device.id} disabled={!group} onClick={() => onAdd('device', device.id)}><DeviceIcon device={device} />{device.name}</button>)}</div>;
      })}</div></details>
      <details className={styles.category}><summary><Shapes size={19} /><span><strong>Фігура</strong><small>Прості форми</small></span><ChevronDown className={styles.chevron} size={15} /></summary><div className={styles.options}><button disabled={!group} onClick={() => onAdd('shape', 'rectangle')}><RectangleHorizontal size={15} />Прямокутник</button><button disabled={!group} onClick={() => onAdd('shape', 'ellipse')}><Circle size={15} />Еліпс</button></div></details>
      <details className={styles.category}><summary><Sparkles size={19} /><span><strong>Декор</strong><small>Акценти композиції</small></span><ChevronDown className={styles.chevron} size={15} /></summary><div className={styles.options}>{DECORATIONS.map(decoration => <button key={decoration.id} disabled={!group} onClick={() => onAdd('decoration', decoration.id)}><Star size={15} />{decoration.name}</button>)}</div></details>
    </nav></details>
    <details className={styles.section} open><summary className={styles.sectionHeading}><FileImage size={16} /><span>Мої файли</span><ChevronDown size={15} /></summary><p>Завантажте файл і одразу додайте його на слайд. Щоб замінити зображення в наявному елементі, скористайтеся Inspector.</p>
      <button className={styles.upload} disabled={!group || busy} onClick={() => input.current?.click()}><Upload size={16} />{busy ? 'Завантаження…' : 'Завантажити й додати'}</button>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={async event => {
        const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
        setBusy(true); setError('');
        try { onAddAsset(await upload(file)); } catch (e) { setError(e instanceof Error ? e.message : 'Не вдалося завантажити зображення'); }
        finally { setBusy(false); }
      }} />
      {error && <p className={styles.warning} role="alert">{error}</p>}
      {uploads.length > 0 && <div className={styles.uploadList}>{uploads.map(asset => <button key={asset.id} disabled={!group} title={`Додати ${asset.name}`} onClick={() => onAddAsset(asset)}><span className={styles.uploadThumb} style={{ backgroundImage: `url(${asset.url})` }} /><span>{asset.name}</span></button>)}</div>}
    </details>
    <details className={styles.objects} open><summary><span>Елементи групи <small>{group?.elements.length ?? 0}</small></span><ChevronDown size={15} /></summary>{group?.elements.length ? <div className={styles.objectList}>{group.elements.map((element, index) => <button key={element.id} onClick={event => onSelect(element.id, event.shiftKey)}><span>{index + 1}.</span>{({ text: 'Текст', device: 'Пристрій', image: 'Зображення', shape: 'Фігура', decoration: 'Декор' } as const)[element.type]}</button>)}</div> : <p>У групі поки немає елементів.</p>}</details>
  </aside>;
}
