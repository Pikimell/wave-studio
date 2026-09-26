import { useCallback, useRef, useState } from 'react';
export interface History<T> { past: T[]; present: T; future: T[] }
export function pushHistory<T>(history: History<T>, next: T): History<T> {
  if (next === history.present) return history;
  return { past: [...history.past, history.present].slice(-10), present: next, future: [] };
}
export function undoHistory<T>(history: History<T>): History<T> {
  if (!history.past.length) return history;
  return { past: history.past.slice(0, -1), present: history.past[history.past.length - 1], future: [history.present, ...history.future] };
}
export function redoHistory<T>(history: History<T>): History<T> {
  if (!history.future.length) return history;
  return { past: [...history.past, history.present].slice(-10), present: history.future[0], future: history.future.slice(1) };
}
export function useHistory<T>(initial: T) {
  const [history, setHistory] = useState<History<T>>({ past: [], present: initial, future: [] });
  const current = useRef(history), transaction = useRef<{ changed: boolean } | null>(null);
  const commit = useCallback((next: History<T>) => { current.current = next; setHistory(next); }, []);
  const update = useCallback((apply: (value: T) => T) => {
    const h = current.current, next = apply(h.present);
    if (next === h.present) return;
    commit(transaction.current?.changed ? { ...h, present: next, future: [] } : pushHistory(h, next));
    if (transaction.current) transaction.current.changed = true;
  }, [commit]);
  const replace = useCallback((value: T) => { transaction.current = null; commit({ past: [], present: value, future: [] }); }, [commit]);
  const undo = useCallback(() => { transaction.current = null; commit(undoHistory(current.current)); }, [commit]);
  const redo = useCallback(() => { transaction.current = null; commit(redoHistory(current.current)); }, [commit]);
  return { value: history.present, canUndo: !!history.past.length, canRedo: !!history.future.length, update, replace, undo, redo,
    begin: () => { transaction.current = { changed: false }; }, end: () => { transaction.current = null; } };
}
