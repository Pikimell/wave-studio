'use client';

import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import type { PhoneMockupProject } from '../domain/types';
import { PhoneSceneRenderer } from '../services/three/PhoneSceneRenderer';

export const usePhoneScene = (containerRef: RefObject<HTMLDivElement>, project: PhoneMockupProject) => {
  const rendererRef = useRef<PhoneSceneRenderer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new PhoneSceneRenderer(container, project);
    rendererRef.current = renderer;

    renderer.loadCurrentModel()
      .catch(() => setError('Не вдалося завантажити 3D модель.'))
      .finally(() => setLoading(false));

    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [containerRef]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    setLoading(true);
    renderer.updateProject(project)
      .catch(() => setError('Не вдалося оновити сцену.'))
      .finally(() => setLoading(false));
  }, [project]);

  const setScreenshot = useCallback((image: CanvasImageSource & { width: number; height: number }) => {
    rendererRef.current?.setScreenshot(image);
  }, []);

  const exportPng = useCallback(() => {
    rendererRef.current?.exportPng();
  }, []);

  return {
    loading,
    error,
    setScreenshot,
    exportPng
  };
};
