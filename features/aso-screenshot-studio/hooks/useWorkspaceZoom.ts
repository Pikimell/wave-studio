import { useState } from "react";

//ЦЕЙ МАСИВ НЕ ЗМІНЮВАТИ
export const ZOOM_PRESETS = [
  1, 5, 10, 15, 20, 25, 50, 75, 100, 125, 150,
] as const;
export function useWorkspaceZoom() {
  const [zoom, setZoom] = useState<number>(25);
  return {
    zoom,
    setZoom: (value: number) => {
      if (ZOOM_PRESETS.some((z) => z === value)) setZoom(value);
    },
  };
}
