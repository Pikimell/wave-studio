import { useMemo } from 'react';
import { renderSlideContent } from '../../render/slide';
import type { Scene } from '../../render/scene';
export function SlideViewport({ scene, index, namespace }: { scene: Scene; index: number; namespace: string }) {
  const svg = useMemo(() => renderSlideContent(scene, index, namespace), [scene, index, namespace]);
  return <g pointerEvents="none" dangerouslySetInnerHTML={{ __html: svg }} />;
}
