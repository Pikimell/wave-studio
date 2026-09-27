import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './InspectorSection.module.css';

export function InspectorSection({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return <details className={styles.section} open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className={styles.heading}><span>{title}</span><ChevronDown size={16} aria-hidden="true" /></summary>
    <div className={styles.content}>{children}</div>
  </details>;
}
