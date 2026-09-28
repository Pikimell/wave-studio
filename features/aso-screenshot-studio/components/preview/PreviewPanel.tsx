import { useEffect, useId, useMemo, useRef, useState } from 'react';
import styles from './PreviewPanel.module.css';
import type { Group } from '../../domain/schema';
import { useAssetContext } from '../../hooks/useAssets';
import { useFontReady } from '../../hooks/useFontReady';
import { createScene } from '../../render/scene';
import { SlideViewport } from '../workspace/SlideViewport';

const MIN_PANEL_HEIGHT = 72;
const MAX_PANEL_HEIGHT = 360;
const DEFAULT_PANEL_HEIGHT = 150;
const RESIZE_HANDLE_HEIGHT = 10;
const THUMBNAILS_VERTICAL_PADDING = 20;

function clampPanelHeight(value: number) {
  return Math.min(MAX_PANEL_HEIGHT, Math.max(MIN_PANEL_HEIGHT, value));
}

export function PreviewPanel({ group, onSlide }: { group?: Group; onSlide: (id: string) => void }) {
  const { urls } = useAssetContext();
  const fontVersion = useFontReady(group?.elements ?? []);
  const [height, setHeight] = useState(DEFAULT_PANEL_HEIGHT);
  const [snapshot, setSnapshot] = useState(group);
  const drag = useRef<{ y: number; height: number } | null>(null);
  const snapshotGroupId = useRef(group?.id);
  const namespace = useId().replace(/:/g, '');
  useEffect(() => {
    if (group?.id !== snapshotGroupId.current) {
      snapshotGroupId.current = group?.id;
      setSnapshot(group);
      return;
    }
    const timer = setTimeout(() => setSnapshot(group), 5000);
    return () => clearTimeout(timer);
  }, [group]);
  useEffect(() => {
    function move(event: PointerEvent) {
      if (!drag.current) return;
      setHeight(clampPanelHeight(drag.current.height + drag.current.y - event.clientY));
    }
    function end() {
      drag.current = null;
      document.body.style.removeProperty('cursor');
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      end();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, []);
  // Never show a different group's thumbnails while waiting for debounce.
  const visible = snapshot?.id === group?.id ? snapshot : undefined;
  const scene = useMemo(() => { void fontVersion; return visible ? createScene(visible, urls) : null; }, [visible, urls, fontVersion]);
  const slideHeight = Math.max(1, height - RESIZE_HANDLE_HEIGHT - THUMBNAILS_VERTICAL_PADDING);
  const slideWidth = scene ? slideHeight * scene.group.width / scene.height : 0;
  const thumbnailGap = scene ? scene.group.gap * (slideHeight / scene.group.height) : 0;
  return <footer className={`${styles.scope} aso-preview`} style={{ height }}>
    <div
      className="aso-preview-resize"
      aria-label="Змінити висоту Group Preview"
      aria-orientation="horizontal"
      aria-valuemax={MAX_PANEL_HEIGHT}
      aria-valuemin={MIN_PANEL_HEIGHT}
      aria-valuenow={height}
      role="separator"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'ArrowUp') { event.preventDefault(); setHeight(value => clampPanelHeight(value + 12)); }
        if (event.key === 'ArrowDown') { event.preventDefault(); setHeight(value => clampPanelHeight(value - 12)); }
        if (event.key === 'Home') { event.preventDefault(); setHeight(MIN_PANEL_HEIGHT); }
        if (event.key === 'End') { event.preventDefault(); setHeight(MAX_PANEL_HEIGHT); }
      }}
      onPointerDown={event => {
        event.preventDefault();
        drag.current = { y: event.clientY, height };
        document.body.style.cursor = 'ns-resize';
      }}
    />
    <div className="aso-thumbnails" style={{ gap: thumbnailGap }}>{scene?.slides.map((slide, index) => <button key={slide.id} onClick={() => onSlide(slide.id)} aria-label={`Перейти до слайда ${index + 1}`}>
      <svg height={slideHeight} width={slideWidth} viewBox={`${slide.rect.x} 0 ${scene.group.width} ${scene.height}`} aria-hidden="true"><SlideViewport scene={scene} index={index} namespace={namespace} /></svg>
    </button>)}</div>
  </footer>;
}
