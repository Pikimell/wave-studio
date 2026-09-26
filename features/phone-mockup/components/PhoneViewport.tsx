'use client';

import { RefObject } from 'react';

type PhoneViewportProps = {
  containerRef: RefObject<HTMLDivElement>;
  loading: boolean;
  error: string | null;
};

export const PhoneViewport = ({ containerRef, loading, error }: PhoneViewportProps) => (
  <div className="phone-viewport">
    <div ref={containerRef} className="phone-canvas" />
    {loading && (
      <div className="phone-loader">
        <div className="phone-spinner" />
        <span>Завантажуємо 3D модель...</span>
      </div>
    )}
    {error && <div className="phone-error">{error}</div>}
  </div>
);
