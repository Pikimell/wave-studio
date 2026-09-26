import { useState } from 'react';
import type { Project } from '../domain/schema';
import { resolveSelection, type Selection } from '../domain/selection';
export { resolveSelection, type Selection } from '../domain/selection';
export function useSelection(project: Project | null) {
  const [stored, select] = useState<Selection>(null);
  return { selection: resolveSelection(project, stored), select };
}
