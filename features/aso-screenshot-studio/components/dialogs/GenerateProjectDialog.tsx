import { useEffect, useRef, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import type { Project, Group } from '../../domain/schema';
import { deckSpecToGroup, type GeneratedDeckSpec } from '../../domain/generation';
import { PRESETS } from '../../domain/presets';
import { requestGeneration } from '../../services/generationClient';
import { PresetOptions } from './AddGroupDialog';
import styles from './GenerateProjectDialog.module.css';

interface Metadata { description: string; generationNotes: string; audienceProfile: string; slidePlan: string }

export function GenerateProjectDialog({ project, apiKey, setApiKey, model, setModel, onSave, onGenerate, onClose }: {
  project: Project; apiKey: string; setApiKey: (value: string) => void; model: string; setModel: (value: string) => void;
  onSave: (metadata: Metadata) => void; onGenerate: (group: Group, metadata: Metadata) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null), controller = useRef<AbortController | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [description, setDescription] = useState(project.description);
  const [generationNotes, setGenerationNotes] = useState(project.generationNotes);
  const [audienceProfile, setAudienceProfile] = useState(project.audienceProfile);
  const [slidePlan, setSlidePlan] = useState(project.slidePlan);
  const [slideCount, setSlideCount] = useState(6);
  const [locale, setLocale] = useState('en');
  const [presetId, setPresetId] = useState('iphone-69-1290-portrait');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const metadata = { description, generationNotes, audienceProfile, slidePlan };
  useEffect(() => { dialog.current?.showModal(); return () => controller.current?.abort(); }, []);
  function close() { onSave(metadata); onClose(); }
  async function run(action: 'audience' | 'plan' | 'slides') {
    setError(''); setBusy(true); const abort = new AbortController(); controller.current = abort;
    try {
      const common = { projectName: project.name, description: description.trim(), generationNotes: generationNotes.trim() };
      if (action === 'audience') {
        const result = await requestGeneration({ action, ...common }, apiKey.trim(), model.trim(), abort.signal);
        if ('audienceProfile' in result && !abort.signal.aborted) { setAudienceProfile(result.audienceProfile); onSave({ ...metadata, description: common.description, generationNotes: common.generationNotes, audienceProfile: result.audienceProfile }); setStep(2); }
      } else if (action === 'plan') {
        const result = await requestGeneration({ action, ...common, audienceProfile: audienceProfile.trim(), slideCount }, apiKey.trim(), model.trim(), abort.signal);
        if ('plan' in result && !abort.signal.aborted) { setSlidePlan(result.plan); setSlideCount(result.recommendedSlideCount); onSave({ ...metadata, audienceProfile: audienceProfile.trim(), slidePlan: result.plan }); setStep(3); }
      } else {
        const result = await requestGeneration({ action, ...common, audienceProfile: audienceProfile.trim(), slidePlan: slidePlan.trim(), slideCount, locale, presetId }, apiKey.trim(), model.trim(), abort.signal);
        if ('slides' in result && !abort.signal.aborted) {
          const deck = result as GeneratedDeckSpec;
          const productionNotes = deck.slides.map((slide, index) => `${index + 1}. ${slide.strategicRole}: ${slide.headlineBefore}${slide.emphasis}${slide.headlineAfter}\nКлючова думка: ${slide.userTakeaway}\nКомпозиція: ${slide.composition} — ${slide.compositionReason}\nЕкран: ${slide.screenshotBrief}`).join('\n\n');
          onGenerate(deckSpecToGroup(deck, presetId), { ...metadata, slidePlan: `${slidePlan.trim()}\n\nProduction notes\n${deck.artDirection}\n\n${productionNotes}`.slice(0, 30000) });
        }
      }
    } catch (reason) { if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : 'Не вдалося виконати генерацію.'); }
    finally { if (!abort.signal.aborted) setBusy(false); }
  }
  const canCall = apiKey.trim().length >= 20 && !!model.trim();
  return <dialog ref={dialog} className={`${styles.scope} aso-dialog`} aria-labelledby="aso-generate-title" onCancel={event => { event.preventDefault(); if (!busy) close(); }}>
    <form onSubmit={event => event.preventDefault()}>
      <div className={styles.heading}><div><span className={styles.kicker}><Sparkles size={14} /> AI ASO</span><h2 id="aso-generate-title">Опис і генерація проєкту</h2></div><button type="button" aria-label="Закрити" disabled={busy} onClick={close}>×</button></div>
      <ol className={styles.steps}>{['Проєкт', 'Аудиторія', 'План і JSON'].map((label, index) => <li key={label} className={step === index + 1 ? styles.active : step > index + 1 ? styles.done : ''}><span>{step > index + 1 ? <Check size={13} /> : index + 1}</span>{label}</li>)}</ol>
      {step === 1 && <section className={styles.content} aria-label="Крок 1: опис проєкту">
        <div><h3>Опишіть продукт</h3><p>Що робить застосунок, для кого він і чому його обирають? Цей опис збережеться в проєкті та стане основою всіх наступних кроків.</p></div>
        <label className="aso-field"><span>Опис проєкту</span><textarea autoFocus rows={8} maxLength={20000} required value={description} onChange={event => setDescription(event.target.value)} placeholder="Наприклад: застосунок допомагає фрилансерам… Ключові можливості…" /></label>
        <label className="aso-field"><span>Побажання до кампанії (необов’язково)</span><textarea rows={3} maxLength={10000} value={generationNotes} onChange={event => setGenerationNotes(event.target.value)} placeholder="Тон, акцент, обмеження, ключова функція…" /></label>
        <div className="aso-grid2"><label className="aso-field"><span>Бажана кількість слайдів</span><input type="number" min={1} max={10} value={slideCount} onChange={event => setSlideCount(Math.max(1, Math.min(10, Number(event.target.value) || 1)))} /></label><label className="aso-field"><span>Мова результату</span><input maxLength={40} value={locale} onChange={event => setLocale(event.target.value)} placeholder="en, uk, en-US" /></label></div>
      </section>}
      {step === 2 && <section className={styles.content} aria-label="Крок 2: аудиторія">
        <div><h3>Перевірте портрет клієнта</h3><p>Відредагуйте аудиторію, болі, бажаний результат, заперечення та ключову обіцянку. Ваші правки важливіші за AI-чернетку.</p></div>
        <label className="aso-field"><span>Клієнт, проблема і рішення</span><textarea autoFocus rows={16} maxLength={30000} required value={audienceProfile} onChange={event => setAudienceProfile(event.target.value)} /></label>
      </section>}
      {step === 3 && <section className={styles.content} aria-label="Крок 3: план слайдів">
        <div><h3>Підтвердьте план</h3><p>Перевірте історію, точні заголовки, екрани та композиції. Перші слайди мають пояснити продукт, його користь і довести обіцянку. Вся серія матиме єдиний наскрізний фон.</p></div>
        <label className="aso-field"><span>План слайдів</span><textarea autoFocus rows={14} maxLength={30000} required value={slidePlan} onChange={event => setSlidePlan(event.target.value)} /></label>
        <div className="aso-grid2"><label className="aso-field"><span>Фінальна кількість</span><input type="number" min={1} max={10} value={slideCount} onChange={event => setSlideCount(Math.max(1, Math.min(10, Number(event.target.value) || 1)))} /></label><label className="aso-field"><span>Розмір групи</span><select value={presetId} onChange={event => setPresetId(event.target.value)}><PresetOptions /></select></label></div>
        <p className={styles.note}>Буде створено редаговану групу з різними композиціями, заголовками з акцентом, доречними підзаголовками та суцільним фоном на всю серію. Завантажте відповідні екрани за підказками з плану.</p>
      </section>}
      <details className={styles.connection} open={!apiKey}><summary>Підключення OpenAI</summary><div className="aso-grid2"><label className="aso-field"><span>API key</span><input type="password" autoComplete="off" spellCheck={false} value={apiKey} onChange={event => setApiKey(event.target.value)} disabled={busy} /></label><label className="aso-field"><span>Модель</span><input list="aso-generation-models" value={model} onChange={event => setModel(event.target.value)} disabled={busy} /><datalist id="aso-generation-models"><option value="gpt-4.1-mini" /><option value="gpt-4.1" /></datalist></label></div><p>Ключ зберігається лише в пам’яті вкладки. Запити оплачуються вашим API-акаунтом.</p></details>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <footer className={styles.actions}><button type="button" disabled={busy} onClick={step === 1 ? close : () => setStep(step === 3 ? 2 : 1)}>{step === 1 ? 'Зберегти й закрити' : 'Назад'}</button>
        {step === 1 && <button type="button" className="aso-primary" disabled={busy || !description.trim() || !canCall} onClick={() => void run('audience')}>{busy ? 'Аналізуємо…' : 'Проаналізувати аудиторію'}</button>}
        {step === 2 && <button type="button" className="aso-primary" disabled={busy || !audienceProfile.trim() || !canCall} onClick={() => void run('plan')}>{busy ? 'Створюємо план…' : 'Створити план'}</button>}
        {step === 3 && <button type="button" className="aso-primary" disabled={busy || !slidePlan.trim() || !locale.trim() || !PRESETS.some(item => item.id === presetId) || !canCall} onClick={() => void run('slides')}>{busy ? 'Генеруємо JSON…' : `Згенерувати ${slideCount} слайдів`}</button>}
      </footer>
    </form>
  </dialog>;
}
