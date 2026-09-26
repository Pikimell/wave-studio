import type { Dispatch } from 'react';
import { Plus } from 'lucide-react';
import { MAX_WAVES } from '../../domain/constants';
import type { ProjectAction } from '../../domain/actions';
import type { WaveLayer } from '../../domain/types';
import { SectionHeading } from '../shared/SectionHeading';
import { WaveCard } from './WaveCard';

type WavesSectionProps = {
  waves: WaveLayer[];
  selectedId: string | null;
  dispatch: Dispatch<ProjectAction>;
  onUpdateWaveColor: (id: string, value: string) => boolean;
  onUpdateWaveNumber: (id: string, field: keyof WaveLayer, value: number | string) => void;
};

export const WavesSection = ({ waves, selectedId, dispatch, onUpdateWaveColor, onUpdateWaveNumber }: WavesSectionProps) => (
  <section className="panel-section waves-section" aria-labelledby="waves-heading">
    <SectionHeading
      number="02"
      title="Шари хвиль"
      description="Кожна хвиля — окремий шар"
      titleId="waves-heading"
      action={<span className="count-pill">{waves.length}</span>}
    />
    <div className="wave-list">
      {waves.map((wave, index) => (
        <WaveCard
          key={wave.id}
          wave={wave}
          index={index}
          total={waves.length}
          active={selectedId === wave.id}
          dispatch={dispatch}
          onUpdateWaveColor={onUpdateWaveColor}
          onUpdateWaveNumber={onUpdateWaveNumber}
        />
      ))}
    </div>
    <button className="add-wave" type="button" disabled={waves.length >= MAX_WAVES} onClick={() => dispatch({ type: 'add-wave' })}>
      <Plus aria-hidden="true" />
      Додати хвилю
    </button>
  </section>
);
