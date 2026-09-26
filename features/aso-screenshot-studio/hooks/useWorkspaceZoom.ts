import { useState } from 'react';
export const ZOOM_PRESETS = [25, 50, 75, 100, 125, 150, 200] as const;
export function useWorkspaceZoom() {
  const [zoom, setZoom] = useState<number>(25);
  return { zoom, setZoom: (value: number) => { if (ZOOM_PRESETS.some(z => z === value)) setZoom(value); } };
}
