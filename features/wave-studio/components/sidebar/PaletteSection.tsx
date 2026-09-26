import { PALETTES } from '../../domain/constants';
import type { Palette, WaveProject } from '../../domain/types';
import { SectionHeading } from '../shared/SectionHeading';

type PaletteSectionProps = {
  project: WaveProject;
  onApplyPalette: (palette: Palette) => void;
};

export const PaletteSection = ({ project, onApplyPalette }: PaletteSectionProps) => (
  <section className="panel-section palette-section" aria-labelledby="palette-heading">
    <SectionHeading number="03" title="Швидкий старт" description="Палітри для натхнення" titleId="palette-heading" />
    <div className="palette-list">
      {PALETTES.map((palette) => {
        const active =
          project.background.toUpperCase() === palette.background &&
          project.waves.slice(0, 5).every((wave, index) => wave.color.toUpperCase() === palette.colors[index]);

        return (
          <button
            key={palette.name}
            className={`palette-button ${active ? 'active' : ''}`}
            type="button"
            aria-label={`Застосувати палітру ${palette.name}`}
            onClick={() => onApplyPalette(palette)}
          >
            <span className="palette-sample">
              {[palette.background, ...palette.colors].map((color) => (
                <span key={color} style={{ background: color }} />
              ))}
            </span>
            <span className="palette-name">{palette.name}</span>
          </button>
        );
      })}
    </div>
  </section>
);
