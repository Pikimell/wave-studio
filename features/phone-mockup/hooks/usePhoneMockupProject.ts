'use client';

import { useCallback, useState } from 'react';
import { DEFAULT_PHONE_PROJECT, normalizePhoneProject } from '../domain/project';
import type { PhoneMockupJson, PhoneMockupProject } from '../domain/types';

export const usePhoneMockupProject = () => {
  const [project, setProject] = useState<PhoneMockupProject>(DEFAULT_PHONE_PROJECT);

  const updateProject = useCallback((patch: PhoneMockupJson) => {
    setProject((current) => normalizePhoneProject({
      ...current,
      ...patch,
      filters: {
        ...current.filters,
        ...patch.filters
      },
      scene: {
        ...current.scene,
        ...patch.scene,
        rotation: {
          ...current.scene.rotation,
          ...patch.scene?.rotation
        }
      }
    }));
  }, []);

  const replaceProject = useCallback((nextProject: PhoneMockupProject) => {
    setProject(normalizePhoneProject(nextProject));
  }, []);

  return {
    project,
    updateProject,
    replaceProject
  };
};
