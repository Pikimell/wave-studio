import { useEffect, useRef, useState } from 'react';
import type { Group } from '../../domain/schema';
import { collectText, translatedGroups } from '../../domain/localization';
import { requestLocalization } from '../../services/localizationClient';
const LOCALES = [{ id: 'uk', name: 'Українська' }, { id: 'en', name: 'English' }, { id: 'de', name: 'Deutsch' }, { id: 'fr', name: 'Français' }, { id: 'es', name: 'Español' }, { id: 'pl', name: 'Polski' }, { id: 'cs', name: 'Čeština' }, { id: 'ja', name: '日本語' }];
export function LocalizeDialog({ group, apiKey, setApiKey, model, setModel, onAdd, onClose }: {
  group: Group; apiKey: string; setApiKey: (key: string) => void; model: string; setModel: (model: string) => void;
  onAdd: (groups: Group[]) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null), controller = useRef<AbortController | null>(null);
  const [targets, setTargets] = useState<string[]>([]), [customLocale, setCustomLocale] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { dialog.current?.showModal(); return () => controller.current?.abort(); }, []);
  return <dialog ref={dialog} className="aso-dialog" aria-labelledby="aso-localize-title" onCancel={onClose}><form onSubmit={async event => {
    event.preventDefault(); setError(''); setBusy(true);
    const abort = new AbortController(); controller.current = abort;
    try {
      const targetLocales = [...new Set([...targets, ...customLocale.split(',').map(s => s.trim()).filter(Boolean)])];
      const translations = await requestLocalization({ sourceLocale: group.locale, targetLocales, segments: collectText(group) }, apiKey.trim(), model.trim(), abort.signal);
      if (!abort.signal.aborted) { onAdd(translatedGroups(group, translations)); onClose(); }
    } catch (e) { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Помилка локалізації'); }
    finally { if (!abort.signal.aborted) setBusy(false); }
  }}><div className="aso-row"><h2 id="aso-localize-title">Localize · {group.locale}</h2><button type="button" aria-label="Закрити локалізацію" onClick={onClose}>×</button></div>
    <p>Для кожної мови буде створено копію групи. Стилі, зображення й геометрія збережуться. Після перекладу перевірте довжину тексту.</p>
    <label className="aso-field"><span>OpenAI API key</span><input type="password" autoComplete="off" spellCheck={false} required value={apiKey} onChange={e => setApiKey(e.target.value)} disabled={busy} /></label>
    <p className="aso-note">Ключ живе лише в пам’яті вкладки. До OpenAI передаються текст і мови; запит оплачується вашим API-акаунтом.</p>
    <label className="aso-field"><span>Модель</span><input list="aso-models" required value={model} onChange={e => setModel(e.target.value)} disabled={busy} /><datalist id="aso-models"><option value="gpt-4.1-mini" /><option value="gpt-4.1" /></datalist></label>
    <fieldset disabled={busy} className="aso-locales"><legend>Цільові мови</legend>{LOCALES.filter(l => l.id !== group.locale).map(locale => <label className="aso-check" key={locale.id}><input type="checkbox" checked={targets.includes(locale.id)} onChange={e => setTargets(e.target.checked ? [...targets, locale.id] : targets.filter(id => id !== locale.id))} />{locale.name}</label>)}</fieldset>
    <label className="aso-field"><span>Інші locale через кому</span><input value={customLocale} onChange={e => setCustomLocale(e.target.value)} placeholder="pt-BR, it" disabled={busy} /></label>
    {error && <p className="aso-warning" role="alert">{error}</p>}
    <button className="aso-primary" disabled={busy} type="submit">{busy ? 'Перекладаємо…' : 'Створити локалізовані групи'}</button>
  </form></dialog>;
}
