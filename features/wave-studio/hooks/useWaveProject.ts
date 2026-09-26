'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { MAX_DIMENSION, MAX_WAVES, MIN_DIMENSION, PALETTES, STORAGE_KEY } from '../domain/constants';
import type { ProjectAction } from '../domain/actions';
import { clamp, makeId, normalizeHex, randomSeed, sliderToFrequency } from '../domain/math';
import { createInitialProject, sanitizeProject } from '../domain/project';
import type { WaveLayer, WaveProject } from '../domain/types';

const projectReducer = (project: WaveProject, action: ProjectAction): WaveProject => {
  switch (action.type) {
    case 'hydrate':
      return action.project;
    case 'set-dimension':
      return { ...project, [action.key]: action.value };
    case 'set-background':
      return { ...project, background: action.color };
    case 'select-wave':
      return { ...project, selectedId: project.selectedId === action.id ? null : action.id };
    case 'update-wave':
      return {
        ...project,
        waves: project.waves.map((wave) => (wave.id === action.id ? { ...wave, ...action.patch } : wave))
      };
    case 'set-wave-type':
      return {
        ...project,
        waves: project.waves.map((wave) => (wave.id === action.id ? { ...wave, type: action.waveType } : wave))
      };
    case 'regenerate-wave':
      return {
        ...project,
        waves: project.waves.map((wave) => (wave.id === action.id ? { ...wave, seed: randomSeed() } : wave))
      };
    case 'delete-wave':
      return {
        ...project,
        selectedId: project.selectedId === action.id ? null : project.selectedId,
        waves: project.waves.filter((wave) => wave.id !== action.id)
      };
    case 'move-wave': {
      const index = project.waves.findIndex((wave) => wave.id === action.id);
      const targetIndex = action.direction === 'up' ? index + 1 : index - 1;
      if (index < 0 || targetIndex < 0 || targetIndex >= project.waves.length) return project;

      const waves = [...project.waves];
      [waves[index], waves[targetIndex]] = [waves[targetIndex], waves[index]];
      return { ...project, waves };
    }
    case 'add-wave': {
      if (project.waves.length >= MAX_WAVES) return project;

      const color = PALETTES[0].colors[project.waves.length % 4];
      const wave: WaveLayer = {
        id: makeId(),
        color,
        type: 'fill',
        position: clamp(62 + project.waves.length * 5, 5, 95),
        amplitude: 16,
        frequency: 2.2,
        offset: 0,
        opacity: 82,
        seed: randomSeed()
      };

      return { ...project, selectedId: wave.id, waves: [...project.waves, wave] };
    }
    case 'apply-palette':
      return {
        ...project,
        background: action.palette.background,
        waves: project.waves.map((wave, index) => ({ ...wave, color: action.palette.colors[index % action.palette.colors.length] }))
      };
    case 'randomize-all':
      return {
        ...project,
        waves: project.waves.map((wave) => ({ ...wave, seed: randomSeed() }))
      };
    default:
      return project;
  }
};

export const useWaveProject = (onInvalidInput: (message: string) => void) => {
  const [project, dispatch] = useReducer(projectReducer, undefined, createInitialProject);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) dispatch({ type: 'hydrate', project: sanitizeProject(JSON.parse(saved)) });
    } catch {
      dispatch({ type: 'hydrate', project: createInitialProject() });
    } finally {
      hydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch {
      // The editor remains usable without persistent project storage.
    }
  }, [project]);

  const setDimension = useCallback(
    (key: 'width' | 'height', value: number) => {
      if (!Number.isInteger(value) || value < MIN_DIMENSION || value > MAX_DIMENSION) {
        onInvalidInput('Вкажіть розмір від 256 до 12 000 px.');
        return false;
      }

      dispatch({ type: 'set-dimension', key, value });
      return true;
    },
    [onInvalidInput]
  );

  const setBackground = useCallback(
    (value: string) => {
      const color = normalizeHex(value.trim());
      if (!color) {
        onInvalidInput('Вкажіть колір у форматі #RRGGBB.');
        return false;
      }

      dispatch({ type: 'set-background', color });
      return true;
    },
    [onInvalidInput]
  );

  const updateWaveColor = useCallback(
    (id: string, value: string) => {
      const color = normalizeHex(value.trim());
      if (!color) {
        onInvalidInput('Вкажіть колір у форматі #RRGGBB.');
        return false;
      }

      dispatch({ type: 'update-wave', id, patch: { color } });
      return true;
    },
    [onInvalidInput]
  );

  const updateWaveNumber = useCallback((id: string, field: keyof WaveLayer, value: number | string) => {
    const nextValue = field === 'frequency' ? sliderToFrequency(value) : Number(value);
    dispatch({ type: 'update-wave', id, patch: { [field]: nextValue } });
  }, []);

  return {
    project,
    dispatch,
    setDimension,
    setBackground,
    updateWaveColor,
    updateWaveNumber
  };
};
