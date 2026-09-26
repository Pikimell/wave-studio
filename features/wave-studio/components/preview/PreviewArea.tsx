import { Download, RefreshCcw } from 'lucide-react';
import type { WaveProject } from '../../domain/types';
import { IconButtonContent } from '../shared/IconButtonContent';
import { ArtworkPreview } from './ArtworkPreview';

type PreviewAreaProps = {
  project: WaveProject;
  pngExporting: boolean;
  onExportPng: () => void;
  onExportSvg: () => void;
  onRandomizeAll: () => void;
};

export const PreviewArea = ({ project, pngExporting, onExportPng, onExportSvg, onRandomizeAll }: PreviewAreaProps) => (
  <section className="preview-area" aria-label="Попередній перегляд">
    <div className="preview-header">
      <div>
        <p className="eyebrow">ВАШЕ ПОЛОТНО</p>
        <h2>Попередній перегляд</h2>
      </div>
      <div className="preview-header-actions">
        <span className="dimensions-label">
          {project.width.toLocaleString('uk-UA')} x {project.height.toLocaleString('uk-UA')} px
        </span>
        <button className="ghost-button" type="button" title="Перегенерувати всі хвилі" onClick={onRandomizeAll}>
          <IconButtonContent icon={RefreshCcw} label="Новий варіант" />
        </button>
      </div>
    </div>

    <ArtworkPreview project={project} />

    <div className="preview-bottom">
      <div className="preview-hint">
        <span className="sparkle">*</span>
        <span>Налаштовуйте шари зліва — результат оновлюється одразу.</span>
      </div>
      <div className="export-actions">
        <button className="secondary-button" type="button" onClick={onExportSvg}>
          <IconButtonContent icon={Download} label="SVG" />
        </button>
        <button className="primary-button" type="button" disabled={pngExporting} onClick={onExportPng}>
          <IconButtonContent icon={Download} label={pngExporting ? 'Експорт...' : 'Завантажити PNG'} />
        </button>
      </div>
    </div>
  </section>
);
