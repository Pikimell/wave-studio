'use client';

import { useState } from 'react';
import { Layers, Smartphone } from 'lucide-react';
import { PhoneMockupStudio } from '@/features/phone-mockup/components/PhoneMockupStudio';
import { WaveStudio } from '@/features/wave-studio/components/WaveStudio';

type StudioMode = 'wave' | 'phone';

const STUDIO_OPTIONS: Array<{
  id: StudioMode;
  label: string;
  description: string;
  icon: typeof Layers;
}> = [
  {
    id: 'wave',
    label: 'Wave Studio',
    description: 'Хвилясті фони',
    icon: Layers
  },
  {
    id: 'phone',
    label: 'Phone Mockup',
    description: '3D мокапи телефону',
    icon: Smartphone
  }
];

export const StudioHub = () => {
  const [mode, setMode] = useState<StudioMode>('wave');

  return (
    <div className="studio-hub">
      <nav className="studio-switcher" aria-label="Перемикач інструментів">
        {STUDIO_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = mode === option.id;

          return (
            <button
              key={option.id}
              type="button"
              className={active ? 'studio-tab active' : 'studio-tab'}
              aria-pressed={active}
              onClick={() => setMode(option.id)}
            >
              <Icon aria-hidden="true" />
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </button>
          );
        })}
      </nav>

      <section className={mode === 'wave' ? 'studio-panel active' : 'studio-panel'} aria-hidden={mode !== 'wave'}>
        <WaveStudio />
      </section>

      <section className={mode === 'phone' ? 'studio-panel active phone-panel' : 'studio-panel phone-panel'} aria-hidden={mode !== 'phone'}>
        <PhoneMockupStudio />
      </section>
    </div>
  );
};
