import { useEffect, useRef, useState } from 'react';
import { createGroup, PRESETS } from '../../domain/presets';
import type { Group } from '../../domain/schema';
export function PresetOptions() {
  return <>{(['app-store', 'google-play'] as const).map(platform => <optgroup key={platform} label={platform === 'app-store' ? 'App Store' : 'Google Play'}>{PRESETS.filter(p => p.platform === platform).map(p => <option key={p.id} value={p.id}>{p.name} · {p.width} × {p.height}</option>)}</optgroup>)}</>;
}
export function AddGroupDialog({ onAdd, onClose }: { onAdd: (group: Group) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [preset, setPreset] = useState(PRESETS[0].id);
  const [error, setError] = useState('');
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog className="aso-dialog" ref={dialog} onCancel={onClose} aria-labelledby="aso-group-title">
    <form onSubmit={e => {
      e.preventDefault(); const data = new FormData(e.currentTarget);
      const locale = String(data.get('locale')).trim();
      try { new Intl.Locale(locale); } catch { setError('Вкажіть коректну locale, наприклад en, uk або en-US.'); return; }
      const name = String(data.get('name')).trim();
      onAdd(createGroup(preset, { name: name || PRESETS.find(p => p.id === preset)!.name, locale,
        prefix: String(data.get('prefix')).trim(), variant: String(data.get('variant')).trim(), gap: Number(data.get('gap')) }));
      onClose();
    }}>
      <div className="aso-row"><h2 id="aso-group-title">Нова група</h2><button type="button" aria-label="Закрити" onClick={onClose}>×</button></div>
      <p>Один розмір. Одна мова. Спільна композиція.</p>
      <label className="aso-field"><span>Розмір слайда</span><select value={preset} onChange={e => setPreset(e.target.value)}><PresetOptions /></select></label>
      <label className="aso-field"><span>Назва групи</span><input name="name" placeholder={PRESETS.find(p => p.id === preset)?.name} maxLength={200} /></label>
      <div className="aso-grid2"><label className="aso-field"><span>Locale</span><input name="locale" required defaultValue="en" maxLength={40} /></label><label className="aso-field"><span>Gap, px</span><input type="number" name="gap" defaultValue={40} min={0} max={12000} required /></label></div>
      <div className="aso-grid2"><label className="aso-field"><span>Prefix</span><input name="prefix" maxLength={100} placeholder="Launch" /></label><label className="aso-field"><span>Variant</span><input name="variant" maxLength={100} placeholder="A" /></label></div>
      {error && <p role="alert">{error}</p>}
      <button className="aso-primary" type="submit">Створити групу</button>
    </form>
  </dialog>;
}
