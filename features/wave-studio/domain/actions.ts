import type { Palette, WaveLayer, WaveProject, WaveType } from './types';

export type ProjectAction =
  | { type: 'hydrate'; project: WaveProject }
  | { type: 'set-dimension'; key: 'width' | 'height'; value: number }
  | { type: 'set-background'; color: string }
  | { type: 'select-wave'; id: string }
  | { type: 'update-wave'; id: string; patch: Partial<WaveLayer> }
  | { type: 'set-wave-type'; id: string; waveType: WaveType }
  | { type: 'regenerate-wave'; id: string }
  | { type: 'delete-wave'; id: string }
  | { type: 'move-wave'; id: string; direction: 'up' | 'down' }
  | { type: 'add-wave' }
  | { type: 'apply-palette'; palette: Palette }
  | { type: 'randomize-all' };
