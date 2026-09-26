import type { Dispatch } from 'react';
import { PaletteSection } from './PaletteSection';
import { CanvasSection } from './CanvasSection';
import { WavesSection } from './WavesSection';
import type { ProjectAction } from '../../domain/actions';
import type { WaveLayer, WaveProject } from '../../domain/types';

type SidebarProps = {
  project: WaveProject;
  dispatch: Dispatch<ProjectAction>;
  onSetDimension: (key: 'width' | 'height', value: number) => boolean;
  onSetBackground: (value: string) => boolean;
  onUpdateWaveColor: (id: string, value: string) => boolean;
  onUpdateWaveNumber: (id: string, field: keyof WaveLayer, value: number | string) => void;
};

export const Sidebar = ({
  project,
  dispatch,
  onSetDimension,
  onSetBackground,
  onUpdateWaveColor,
  onUpdateWaveNumber
}: SidebarProps) => (
  <aside className="sidebar" aria-label="Налаштування фону">
    <div className="sidebar-intro">
      <p className="eyebrow">ГЕНЕРАТОР ФОНІВ</p>
      <h1>
        Створіть свою
        <br />
        <em>ідеальну хвилю.</em>
      </h1>
      <p className="intro-copy">Комбінуйте кольори й плавні форми, поки не отримаєте потрібний настрій.</p>
    </div>

    <CanvasSection
      width={project.width}
      height={project.height}
      background={project.background}
      onSetDimension={onSetDimension}
      onSetBackground={onSetBackground}
      onPresetSelect={(width, height) => {
        onSetDimension('width', width);
        onSetDimension('height', height);
      }}
    />

    <WavesSection
      waves={project.waves}
      selectedId={project.selectedId}
      dispatch={dispatch}
      onUpdateWaveColor={onUpdateWaveColor}
      onUpdateWaveNumber={onUpdateWaveNumber}
    />

    <PaletteSection project={project} onApplyPalette={(palette) => dispatch({ type: 'apply-palette', palette })} />

    <div className="sidebar-footer">
      Створено для вільної творчості <span>*</span>
    </div>
  </aside>
);
