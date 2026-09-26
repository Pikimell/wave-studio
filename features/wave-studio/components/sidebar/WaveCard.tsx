import { ChevronDown, ChevronsDown, ChevronsUp, RefreshCcw, Trash2 } from 'lucide-react';
import { useEffect, useState, type Dispatch } from 'react';
import type { ProjectAction } from '../../domain/actions';
import { frequencyToSlider, formatFrequency, formatOffset } from '../../domain/math';
import type { WaveLayer, WaveType } from '../../domain/types';
import { WaveSlider } from './WaveSlider';

type WaveCardProps = {
  wave: WaveLayer;
  index: number;
  total: number;
  active: boolean;
  dispatch: Dispatch<ProjectAction>;
  onUpdateWaveColor: (id: string, value: string) => boolean;
  onUpdateWaveNumber: (id: string, field: keyof WaveLayer, value: number | string) => void;
};

export const WaveCard = ({ wave, index, total, active, dispatch, onUpdateWaveColor, onUpdateWaveNumber }: WaveCardProps) => {
  const [draftColor, setDraftColor] = useState(wave.color);

  useEffect(() => {
    setDraftColor(wave.color);
  }, [wave.color]);

  return (
    <article className={`wave-card ${active ? 'active' : ''}`}>
    <button className="wave-summary" type="button" aria-expanded={active} onClick={() => dispatch({ type: 'select-wave', id: wave.id })}>
      <span className="wave-swatch" style={{ background: wave.color }} />
      <span className="wave-name">
        Хвиля {index + 1}
        <small>
          {wave.type === 'line' ? 'Контур' : 'Заливка'} · {wave.opacity}% непрозорості
        </small>
      </span>
      <ChevronDown className="chevron" aria-hidden="true" />
    </button>

    {active ? (
      <div className="wave-settings">
        <div className="wave-row">
          <label>Колір хвилі</label>
          <div className="wave-color-control">
            <input type="color" value={wave.color} aria-label={`Колір хвилі ${index + 1}`} onChange={(event) => onUpdateWaveColor(wave.id, event.target.value)} />
            <input
              type="text"
              value={draftColor}
              maxLength={7}
              spellCheck={false}
              aria-label={`HEX колір хвилі ${index + 1}`}
              onChange={(event) => setDraftColor(event.target.value)}
              onBlur={(event) => {
                if (!onUpdateWaveColor(wave.id, event.target.value)) setDraftColor(wave.color);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur();
              }}
            />
          </div>
        </div>

        <div className="wave-row">
          <label>Вигляд</label>
          <div className="wave-mode">
            {(['fill', 'line'] as WaveType[]).map((type) => (
              <button
                key={type}
                type="button"
                className={wave.type === type ? 'active' : undefined}
                onClick={() => dispatch({ type: 'set-wave-type', id: wave.id, waveType: type })}
              >
                {type === 'fill' ? 'Заливка' : 'Контур'}
              </button>
            ))}
          </div>
        </div>

        <WaveSlider label="Позиція" value={wave.position} min={5} max={95} output={`${wave.position}%`} onChange={(value) => onUpdateWaveNumber(wave.id, 'position', value)} />
        <WaveSlider label="Зсув X" value={wave.offset} min={-100} max={100} output={formatOffset(wave.offset)} onChange={(value) => onUpdateWaveNumber(wave.id, 'offset', value)} />
        <WaveSlider label="Висота" value={wave.amplitude} min={1} max={35} output={`${wave.amplitude}%`} onChange={(value) => onUpdateWaveNumber(wave.id, 'amplitude', value)} />
        <WaveSlider
          label="Частота"
          value={frequencyToSlider(wave.frequency)}
          min={0}
          max={1000}
          output={formatFrequency(wave.frequency)}
          ariaValueText={formatFrequency(wave.frequency)}
          onChange={(value) => onUpdateWaveNumber(wave.id, 'frequency', value)}
        />
        <WaveSlider label="Непрозорість" value={wave.opacity} min={5} max={100} output={`${wave.opacity}%`} onChange={(value) => onUpdateWaveNumber(wave.id, 'opacity', value)} />

        <div className="wave-actions">
          <button type="button" className="wave-action" onClick={() => dispatch({ type: 'regenerate-wave', id: wave.id })}>
            <RefreshCcw aria-hidden="true" /> Нова форма
          </button>
          <div className="wave-order">
            <button type="button" className="wave-action" aria-label="Перемістити хвилю вище" disabled={index === total - 1} onClick={() => dispatch({ type: 'move-wave', id: wave.id, direction: 'up' })}>
              <ChevronsUp aria-hidden="true" />
            </button>
            <button type="button" className="wave-action" aria-label="Перемістити хвилю нижче" disabled={index === 0} onClick={() => dispatch({ type: 'move-wave', id: wave.id, direction: 'down' })}>
              <ChevronsDown aria-hidden="true" />
            </button>
          </div>
          <button type="button" className="wave-action danger" onClick={() => dispatch({ type: 'delete-wave', id: wave.id })}>
            <Trash2 aria-hidden="true" /> Видалити
          </button>
        </div>
      </div>
    ) : null}
    </article>
  );
};
