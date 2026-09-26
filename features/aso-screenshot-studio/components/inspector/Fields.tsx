import { useEffect, useState } from 'react';
export function TextField({ label, value, onChange, maxLength = 200 }: { label: string; value: string; onChange: (value: string) => void; maxLength?: number }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <label className="aso-field"><span>{label}</span><input value={draft} maxLength={maxLength} onChange={e => setDraft(e.target.value)} onBlur={() => { if (draft !== value) onChange(draft); }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} /></label>;
}
export function NumberField({ label, value, onChange, min = -10000000, max = 10000000, step = 1 }: { label: string; value: number | undefined; onChange: (value: number) => void; min?: number; max?: number; step?: number }) {
  const [draft, setDraft] = useState(value === undefined ? '' : String(value));
  useEffect(() => setDraft(value === undefined ? '' : String(value)), [value]);
  return <label className="aso-field"><span>{label}</span><input type="number" placeholder={value === undefined ? "Mixed" : undefined} value={draft} min={min} max={max} step={step} onChange={e => {
    setDraft(e.target.value);
    const next = Number(e.target.value);
    if (e.target.value !== '' && Number.isFinite(next) && next >= min && next <= max && (step !== 1 || Number.isInteger(next))) onChange(next);
  }} onBlur={() => setDraft(value === undefined ? '' : String(value))} /></label>;
}
