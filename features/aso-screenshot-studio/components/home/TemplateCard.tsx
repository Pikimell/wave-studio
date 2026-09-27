import { useEffect, useId, useMemo, useState } from 'react';
import type { Project } from '../../domain/schema';
import { createScene } from '../../render/scene';
import { loadTemplate, type TemplateEntry } from '../../services/templateCatalog';
import { SlideViewport } from '../workspace/SlideViewport';
import styles from './TemplateCard.module.css';

export function TemplateCard({ template, onStart }: { template: TemplateEntry; onStart: () => void }) {
  const [project, setProject] = useState<Project | null>(null);
  const [failed, setFailed] = useState(false);
  const namespace = useId().replace(/:/g, '');
  useEffect(() => {
    let active = true;
    loadTemplate(template).then(value => { if (active) setProject(value); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [template]);
  const group = project?.groups.find(item => item.slides.length > 0);
  const scene = useMemo(() => group ? createScene(group) : null, [group]);
  const slides = scene?.slides.slice(0, 5) ?? [];

  return <article className={styles.card}>
    <div className={styles.preview} aria-label={`Прев’ю шаблону ${template.name}`}>
      {scene && slides.length ? slides.map((slide, index) => <div className={styles.slide} key={slide.id}>
        <svg viewBox={`${slide.rect.x} 0 ${scene.group.width} ${scene.height}`} style={{ aspectRatio: `${scene.group.width} / ${scene.height}` }} role="img" aria-label={`Слайд ${index + 1}`}>
          <SlideViewport scene={scene} index={index} namespace={namespace} />
        </svg>
        <span>{String(index + 1).padStart(2, '0')}</span>
      </div>) : <span className={styles.placeholder}>{failed ? 'Прев’ю недоступне' : project ? 'У шаблоні немає слайдів' : 'Завантаження прев’ю…'}</span>}
    </div>
    <div className={styles.details}><span className={styles.kicker}>ШАБЛОН</span><h3>{template.name}</h3><p>{template.description}</p><button type="button" onClick={onStart}>Почати з шаблону →</button></div>
  </article>;
}
