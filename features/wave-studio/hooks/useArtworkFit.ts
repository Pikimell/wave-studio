'use client';

import { RefObject, useLayoutEffect, useState } from 'react';

export const useArtworkFit = (
  stageRef: RefObject<HTMLDivElement>,
  dimensions: { width: number; height: number }
) => {
  const [size, setSize] = useState({ width: dimensions.width, height: dimensions.height });

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const fit = () => {
      const bounds = stage.getBoundingClientRect();
      const computed = getComputedStyle(stage);
      const availableWidth = bounds.width - parseFloat(computed.paddingLeft) - parseFloat(computed.paddingRight);
      const availableHeight = bounds.height - parseFloat(computed.paddingTop) - parseFloat(computed.paddingBottom);
      if (availableWidth <= 0 || availableHeight <= 0) return;

      const scale = Math.min(availableWidth / dimensions.width, availableHeight / dimensions.height);
      setSize({
        width: Math.max(1, dimensions.width * scale),
        height: Math.max(1, dimensions.height * scale)
      });
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);

    return () => observer.disconnect();
  }, [dimensions.height, dimensions.width, stageRef]);

  return size;
};
