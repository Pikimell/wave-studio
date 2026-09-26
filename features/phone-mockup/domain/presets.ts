import type { PhonePreset, PhonePresetId } from './types';

export const PHONE_PRESETS: PhonePreset[] = [
  { id: 'hero', label: 'Hero', azimuth: 20, elevation: 6, distance: 6, rotationY: 0, rotationZ: 0 },
  { id: 'straight', label: 'Straight', azimuth: 0, elevation: 0, distance: 5.4, rotationY: 0, rotationZ: 0 },
  { id: 'floating', label: 'Floating', azimuth: 24, elevation: 12, distance: 6.4, rotationY: 0.3, rotationZ: -0.12 },
  { id: 'tilt', label: 'Tilt', azimuth: 34, elevation: 6, distance: 6.1, rotationY: 0.45, rotationZ: 0.14 },
  { id: 'back', label: 'Back', azimuth: 180, elevation: 6, distance: 6.2, rotationY: 0, rotationZ: 0 },
  { id: 'low-angle', label: 'Low angle', azimuth: 16, elevation: -24, distance: 6.2, rotationY: 0.15, rotationZ: 0.06 },
  { id: 'top-down', label: 'Top down', azimuth: 0, elevation: 46, distance: 6.6, rotationY: 0, rotationZ: 0 },
  { id: 'back-angle', label: 'Back angle', azimuth: 205, elevation: 10, distance: 6.3, rotationY: -0.3, rotationZ: 0.1 },
  { id: 'profile', label: 'Profile', azimuth: 90, elevation: 0, distance: 5.8, rotationY: 0, rotationZ: 0 },
  { id: 'dramatic', label: 'Dramatic', azimuth: -22, elevation: -30, distance: 6.4, rotationY: -0.35, rotationZ: -0.1 },
  { id: 'isometric', label: 'Isometric', azimuth: 30, elevation: 30, distance: 6.6, rotationY: 0.2, rotationZ: 0 },
  { id: 'overhead', label: 'Overhead', azimuth: -18, elevation: 38, distance: 6.7, rotationY: -0.22, rotationZ: -0.08 }
];

export const getPhonePreset = (id: PhonePresetId) => PHONE_PRESETS.find((preset) => preset.id === id);
