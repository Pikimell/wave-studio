import { useEffect, useState } from 'react';
import { CANVAS_PRESETS } from '../../domain/constants';
import { SectionHeading } from '../shared/SectionHeading';

type CanvasSectionProps = {
  width: number;
  height: number;
  background: string;
  onSetDimension: (key: 'width' | 'height', value: number) => boolean;
  onSetBackground: (value: string) => boolean;
  onPresetSelect: (width: number, height: number) => void;
};

export const CanvasSection = ({ width, height, background, onSetDimension, onSetBackground, onPresetSelect }: CanvasSectionProps) => {
  const [draftBackground, setDraftBackground] = useState(background);

  useEffect(() => {
    setDraftBackground(background);
  }, [background]);

  return (
    <section className="panel-section" aria-labelledby="canvas-heading">
      <SectionHeading number="01" title="Полотно" description="Розмір і колір фону" titleId="canvas-heading" />
      <div className="dimensions-grid">
        <label className="field">
          <span>
            Ширина <small>px</small>
          </span>
          <input
            value={width}
            type="number"
            min="256"
            max="12000"
            step="1"
            inputMode="numeric"
            onChange={(event) => onSetDimension('width', Number(event.target.value))}
          />
        </label>
        <span className="dimension-times" aria-hidden="true">
          x
        </span>
        <label className="field">
          <span>
            Висота <small>px</small>
          </span>
          <input
            value={height}
            type="number"
            min="256"
            max="12000"
            step="1"
            inputMode="numeric"
            onChange={(event) => onSetDimension('height', Number(event.target.value))}
          />
        </label>
      </div>

      <div className="presets" aria-label="Готові розміри">
        {CANVAS_PRESETS.map((preset) => (
          <button
            key={`${preset.width}x${preset.height}`}
            type="button"
            className={width === preset.width && height === preset.height ? 'active' : undefined}
            onClick={() => onPresetSelect(preset.width, preset.height)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="color-field">
        <div className="field-label">Колір фону</div>
        <div className="color-control">
          <label className="color-swatch" aria-label="Вибрати колір фону">
            <input value={background} type="color" onChange={(event) => onSetBackground(event.target.value)} />
          </label>
          <input
            value={draftBackground}
            className="hex-input"
            type="text"
            maxLength={7}
            spellCheck={false}
            aria-label="HEX колір фону"
            onChange={(event) => setDraftBackground(event.target.value)}
            onBlur={(event) => {
              if (!onSetBackground(event.target.value)) setDraftBackground(background);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
          />
          <span className="color-control-label">HEX</span>
        </div>
      </div>
    </section>
  );
};
