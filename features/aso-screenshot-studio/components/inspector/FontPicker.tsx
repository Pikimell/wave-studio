import { useEffect, useRef, useState } from 'react';
import { BUNDLED_FONTS, SYSTEM_FONTS, type FontCategory } from '../../domain/fontLibrary';
import { useFontContext } from '../../hooks/useFonts';
import styles from './FontPicker.module.css';

export function FontPicker({ label, value, onChange, emptyLabel }: { label: string; value: string; onChange: (family: string) => void; emptyLabel?: string }) {
  const { fonts, upload } = useFontContext();
  const details = useRef<HTMLDetailsElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    function close(event: globalThis.PointerEvent) {
      if (details.current && !details.current.contains(event.target as Node)) details.current.open = false;
    }
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  const custom = Object.values(fonts).sort((a, b) => a.name.localeCompare(b.name));
  const display = custom.find(font => font.family === value)?.name ?? (value || emptyLabel || 'Оберіть шрифт');
  const matches = (name: string) => name.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim());
  function choose(family: string) { onChange(family); if (details.current) details.current.open = false; setQuery(''); }
  return <div className={styles.picker}>
    <div className={styles.heading}><span className={styles.label}>{label}</span><span className={styles.count}>{BUNDLED_FONTS.length + SYSTEM_FONTS.length + custom.length} шрифтів</span></div>
    <details ref={details} className={styles.details} onToggle={event => { if (!event.currentTarget.open) setQuery(''); }}>
      <summary className={styles.summary}><span style={{ fontFamily: value || undefined }}>{display}</span><span aria-hidden="true">⌄</span></summary>
      <div className={styles.menu}>
        <input className={styles.search} type="search" placeholder="Пошук шрифту…" value={query} onChange={event => setQuery(event.target.value)} aria-label="Пошук шрифту" />
        <div className={styles.list}>
          {emptyLabel && !query && <button type="button" onClick={() => choose('')}>{emptyLabel}</button>}
          {(['Sans', 'Display', 'Serif', 'Handwriting'] as FontCategory[]).map(category => {
            const items = BUNDLED_FONTS.filter(font => font.category === category && matches(font.name));
            return items.length ? <section key={category}><h4>{category}</h4>{items.map(font => <button type="button" className={styles.option} key={font.name} aria-label={font.cyrillic ? font.name : `${font.name}, лише латиниця`} aria-pressed={value === font.name} onClick={() => choose(font.name)}><span style={{ fontFamily: font.name }}>{font.name}</span>{!font.cyrillic && <small>Latin</small>}</button>)}</section> : null;
          })}
          {SYSTEM_FONTS.some(matches) && <section><h4>Системні</h4>{SYSTEM_FONTS.filter(matches).map(name => <button type="button" className={styles.option} key={name} aria-pressed={value === name} onClick={() => choose(name)}><span style={{ fontFamily: name }}>{name}</span></button>)}</section>}
          {custom.some(font => matches(font.name)) && <section><h4>Власні</h4>{custom.filter(font => matches(font.name)).map(font => <button type="button" className={styles.option} key={font.family} aria-pressed={value === font.family} onClick={() => choose(font.family)}><span style={{ fontFamily: font.family }}>{font.name}</span></button>)}</section>}
          {!BUNDLED_FONTS.some(font => matches(font.name)) && !SYSTEM_FONTS.some(matches) && !custom.some(font => matches(font.name)) && <p className={styles.empty}>Шрифт не знайдено</p>}
        </div>
        <button type="button" className={styles.upload} aria-label="Додати свій шрифт" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Завантаження…' : '+ Додати свій шрифт'}</button>
        <input ref={input} type="file" accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf" hidden onChange={async event => {
          const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
          setBusy(true); setError('');
          try { const font = await upload(file); choose(font.family); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Не вдалося додати шрифт.'); }
          finally { setBusy(false); }
        }} />
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
    </details>
  </div>;
}
