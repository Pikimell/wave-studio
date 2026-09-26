import { useEffect, useRef, useState } from 'react';
import { applyCommand, type Command } from '../domain/commands';
import type { Project } from '../domain/schema';
import { parseProjectJson, serializeProject } from '../services/projectFiles';
import { useHistory } from './useHistory';
const STORAGE_KEY = 'aso-screenshot-studio.project.v1';
export function useStudioProject() {
  const history = useHistory<Project | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const { replace } = history;
  const latest = useRef(history.value); latest.current = history.value;
  useEffect(() => {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (json) replace(parseProjectJson(json));
    } catch { setError('Не вдалося відновити локальну копію. Можна відкрити JSON або створити новий проєкт.'); }
    setReady(true);
  }, [replace]);
  useEffect(() => {
    if (!ready || !history.value) return;
    setSaved(false);
    const timer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, serializeProject(history.value!)); setSaved(true); }
      catch { setError('Автозбереження недоступне. Завантажте проєкт кнопкою Save JSON.'); }
    }, 600);
    return () => clearTimeout(timer);
  }, [ready, history.value]);
  useEffect(() => {
    if (!ready) return;
    const flush = () => { try { if (latest.current) localStorage.setItem(STORAGE_KEY, serializeProject(latest.current)); } catch { /* Save JSON remains available. */ } };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flush);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', flush); flush(); };
  }, [ready]);
  function dispatch(command: Command) {
    if (!history.value) return;
    try {
      history.update(current => current ? applyCommand(current, command) : current);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Не вдалося застосувати зміни'); }
  }
  return { ...history, project: history.value, ready, saved, error, setError, dispatch };
}
