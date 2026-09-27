import { useState } from 'react';
import { Link2, Unlink2 } from 'lucide-react';
import { LIMITS, type ElementGeometry } from '../../domain/schema';
import { resizeWithAspectRatio } from '../../domain/aspectRatio';
import { NumberField } from './Fields';
import styles from './GeometryFields.module.css';

export function GeometryFields({ element, onChange }: { element: ElementGeometry; onChange: (patch: Partial<ElementGeometry>) => void }) {
  const [locked, setLocked] = useState(false);
  function resize(key: 'width' | 'height', value: number) {
    if (!locked) { onChange({ [key]: value }); return; }
    onChange(resizeWithAspectRatio(element.width, element.height, key, value));
  }
  return <>
    <div className="aso-grid2"><NumberField label="X" value={element.x} onChange={x => onChange({ x })} min={-LIMITS.coordinate} step={0.1} /><NumberField label="Y" value={element.y} onChange={y => onChange({ y })} min={-LIMITS.coordinate} step={0.1} /></div>
    <div className={styles.sizeRow}>
      <NumberField label="Ширина" value={element.width} onChange={value => resize('width', value)} min={1} max={LIMITS.dimension} step={0.1} />
      <button type="button" className={styles.lock} aria-label={locked ? 'Вимкнути збереження пропорцій' : 'Увімкнути збереження пропорцій'} aria-pressed={locked} title={locked ? 'Пропорції зафіксовано' : 'Фіксувати пропорції'} onClick={() => setLocked(value => !value)}>{locked ? <Link2 size={16} /> : <Unlink2 size={16} />}</button>
      <NumberField label="Висота" value={element.height} onChange={value => resize('height', value)} min={1} max={LIMITS.dimension} step={0.1} />
    </div>
    <div className="aso-grid2"><NumberField label="Поворот, °" value={element.rotation} onChange={rotation => onChange({ rotation })} min={-360} max={360} step={0.1} /><NumberField label="Z-index" value={element.zIndex} onChange={zIndex => onChange({ zIndex })} min={-1000000} max={1000000} step={1} /></div>
  </>;
}
