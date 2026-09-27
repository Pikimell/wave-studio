import { useEffect, useId, useMemo, useState } from 'react';
import styles from './PreviewPanel.module.css';
import type { Group } from '../../domain/schema';
import { useAssetContext } from '../../hooks/useAssets';
import { useFontReady } from '../../hooks/useFontReady';
import { createScene } from '../../render/scene';
import { SlideViewport } from '../workspace/SlideViewport';
export function PreviewPanel({ group, onSlide }: { group?: Group; onSlide: (id: string) => void }) {
  const { urls } = useAssetContext();
  const fontVersion = useFontReady(group?.elements ?? []);
  const [open, setOpen] = useState(true);
  const [snapshot, setSnapshot] = useState(group);
  const namespace = useId().replace(/:/g, '');
  useEffect(() => {
    const timer = setTimeout(() => setSnapshot(group), 5000);
    return () => clearTimeout(timer);
  }, [group]);
  // Never show a different group's thumbnails while waiting for debounce.
  const visible = snapshot?.id === group?.id ? snapshot : undefined;
  const scene = useMemo(() => { void fontVersion; return visible ? createScene(visible, urls) : null; }, [visible, urls, fontVersion]);
  return <footer className={`${styles.scope} aso-preview`}><button className="aso-preview-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '▾' : '▸'} Group preview <small>{group?.name ?? 'Оберіть групу'}{group && snapshot !== group ? ' · оновлення через 5 с' : ''}</small></button>
    {open && <div className="aso-thumbnails">{scene ? scene.slides.map((slide, index) => <button key={slide.id} onClick={() => onSlide(slide.id)} aria-label={`Перейти до слайда ${index + 1}`}><svg height={96} width={96 * scene.group.width / scene.height} viewBox={`${slide.rect.x} 0 ${scene.group.width} ${scene.height}`} aria-hidden="true"><SlideViewport scene={scene} index={index} namespace={namespace} /></svg><span>{String(index + 1).padStart(2, '0')}</span></button>) : <p>{group ? 'Готуємо preview…' : 'Тут з’явиться огляд поточної групи.'}</p>}</div>}
  </footer>;
}
