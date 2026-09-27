import { useCallback, useEffect, useState } from 'react';
import { applyCommand, type Command } from '../domain/commands';
import type { Project } from '../domain/schema';
import { getProject, saveProject } from '../services/projectStore';
import { useHistory } from './useHistory';
export function useStudioProject(projectId: string) {
  const history = useHistory<Project | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const { replace, value } = history;
  useEffect(() => {
    try {
      if (projectId) {
        const project = getProject(projectId);
        replace(project);
        setSaved(!!project);
        if (!project) setError('Проєкт не знайдено. Поверніться до списку проєктів.');
      }
      else setError('Проєкт не обрано. Поверніться до списку проєктів.');
    } catch { setError('Не вдалося відновити проєкт із локального сховища.'); }
    setReady(true);
  }, [projectId, replace]);
  const persist = useCallback((project: Project | null) => {
    if (!project) return;
    try { saveProject(project); setSaved(true); setError(''); }
    catch { setSaved(false); setError('Не вдалося зберегти проєкт. Експортуйте його через Save JSON.'); }
  }, []);
  function dispatch(command: Command) {
    history.update(current => {
      if (!current) return current;
      try {
        const next = applyCommand(current, command);
        persist(next);
        return next;
      } catch (e) { setError(e instanceof Error ? e.message : 'Не вдалося застосувати зміни'); return current; }
    });
  }
  function undo() { const next = history.undo(); persist(next); }
  function redo() { const next = history.redo(); persist(next); }
  function replaceProject(project: Project | null) { history.replace(project); persist(project); }
  return { ...history, undo, redo, replace: replaceProject, project: value, ready, saved, error, setError, dispatch };
}
