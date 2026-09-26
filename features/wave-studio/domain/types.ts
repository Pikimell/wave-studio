export type WaveType = 'fill' | 'line';

export type WaveLayer = {
  id: string;
  color: string;
  type: WaveType;
  position: number;
  amplitude: number;
  frequency: number;
  offset: number;
  opacity: number;
  seed: number;
};

export type WaveProject = {
  width: number;
  height: number;
  background: string;
  selectedId: string | null;
  waves: WaveLayer[];
};

export type Palette = {
  name: string;
  background: string;
  colors: string[];
};

export type ToastPayload = {
  id: number;
  message: string;
};
