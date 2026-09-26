'use client';

import { Download, FileJson, ImagePlus, RotateCcw, Save } from 'lucide-react';
import { PHONE_MODELS } from '../domain/models';
import { PHONE_PRESETS } from '../domain/presets';
import type { PhoneLanguage, PhoneMockupProject, PhoneOrientation, PhonePresetId } from '../domain/types';

type PhoneControlsProps = {
  project: PhoneMockupProject;
  onProjectChange: (patch: Partial<PhoneMockupProject>) => void;
  onScreenshotImport: (file: File) => void;
  onJsonImport: (file: File) => void;
  onJsonExport: () => void;
  onPngExport: () => void;
};

const LANGUAGES: Array<{ value: PhoneLanguage; label: string }> = [
  { value: 'uk', label: 'Українська' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' }
];

export const PhoneControls = ({
  project,
  onProjectChange,
  onScreenshotImport,
  onJsonImport,
  onJsonExport,
  onPngExport
}: PhoneControlsProps) => {
  const updateFilter = (key: keyof PhoneMockupProject['filters'], value: number) => {
    onProjectChange({ filters: { ...project.filters, [key]: value } });
  };

  const updateRotation = (key: keyof PhoneMockupProject['scene']['rotation'], value: number) => {
    onProjectChange({
      presetId: 'custom',
      scene: {
        ...project.scene,
        rotation: {
          ...project.scene.rotation,
          [key]: value
        }
      }
    });
  };

  return (
    <aside className="phone-controls">
      <div className="phone-controls-header">
        <p className="eyebrow">3D mockup</p>
        <h1>Phone mockup studio</h1>
        <p>Налаштування зібрані в JSON-friendly форматі для майбутнього серверного POST рендерингу.</p>
      </div>

      <div className="phone-group">
        <label>
          <span>Мова</span>
          <select value={project.language} onChange={(event) => onProjectChange({ language: event.target.value as PhoneLanguage })}>
            {LANGUAGES.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}
          </select>
        </label>

        <label>
          <span>Девайс</span>
          <select value={project.deviceId} onChange={(event) => onProjectChange({ deviceId: event.target.value as PhoneMockupProject['deviceId'] })}>
            {PHONE_MODELS.map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}
          </select>
        </label>
      </div>

      <div className="phone-group">
        <span className="phone-group-title">Орієнтація</span>
        <div className="phone-segment">
          {(['portrait', 'landscape'] as PhoneOrientation[]).map((orientation) => (
            <button
              key={orientation}
              type="button"
              className={project.orientation === orientation ? 'active' : ''}
              onClick={() => onProjectChange({ orientation })}
            >
              {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
            </button>
          ))}
        </div>
      </div>

      <div className="phone-group">
        <span className="phone-group-title">Скріншот і налаштування</span>
        <label className="phone-file-button">
          <ImagePlus aria-hidden="true" />
          <span>Імпорт скріншота</span>
          <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && onScreenshotImport(event.target.files[0])} />
        </label>
        <label className="phone-file-button">
          <FileJson aria-hidden="true" />
          <span>Імпорт JSON</span>
          <input type="file" accept="application/json,.json" onChange={(event) => event.target.files?.[0] && onJsonImport(event.target.files[0])} />
        </label>
      </div>

      <div className="phone-group">
        <span className="phone-group-title">Фільтри екрана</span>
        <PhoneSlider label="Яскравість" value={project.filters.brightness} min={0} max={200} onChange={(value) => updateFilter('brightness', value)} />
        <PhoneSlider label="Контраст" value={project.filters.contrast} min={0} max={200} onChange={(value) => updateFilter('contrast', value)} />
        <PhoneSlider label="Сатурація" value={project.filters.saturation} min={0} max={200} onChange={(value) => updateFilter('saturation', value)} />
      </div>

      <div className="phone-group">
        <span className="phone-group-title">Нахил</span>
        <div className="phone-preset-grid">
          {PHONE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={project.presetId === preset.id ? 'active' : ''}
              onClick={() => onProjectChange({ presetId: preset.id as PhonePresetId, mirrored: project.presetId === preset.id ? !project.mirrored : false })}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="phone-group">
        <span className="phone-group-title">Сцена</span>
        <PhoneSlider label="Світло" value={project.scene.exposure} min={30} max={220} onChange={(value) => onProjectChange({ scene: { ...project.scene, exposure: value } })} />
        <PhoneSlider label="Вісь X" value={project.scene.rotation.x} min={0} max={100} onChange={(value) => updateRotation('x', value)} />
        <PhoneSlider label="Вісь Y" value={project.scene.rotation.y} min={0} max={100} onChange={(value) => updateRotation('y', value)} />
        <PhoneSlider label="Вісь Z" value={project.scene.rotation.z} min={0} max={100} onChange={(value) => updateRotation('z', value)} />
      </div>

      <div className="phone-actions">
        <button type="button" className="secondary-button" onClick={() => onProjectChange({ filters: { brightness: 100, contrast: 100, saturation: 100 } })}>
          <RotateCcw aria-hidden="true" />
          Фільтри
        </button>
        <button type="button" className="secondary-button" onClick={onJsonExport}>
          <Save aria-hidden="true" />
          JSON
        </button>
        <button type="button" className="primary-button" onClick={onPngExport}>
          <Download aria-hidden="true" />
          PNG
        </button>
      </div>
    </aside>
  );
};

type PhoneSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

const PhoneSlider = ({ label, value, min, max, onChange }: PhoneSliderProps) => (
  <label className="phone-slider">
    <span>
      {label}
      <b>{value}%</b>
    </span>
    <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
  </label>
);
