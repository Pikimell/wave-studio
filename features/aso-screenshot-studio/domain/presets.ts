import { createSlide, newId, type Group, type Platform } from './schema';

// Verified 2026-09-26. Google Play sizes are practical 9:16/16:9 choices, not mandatory exact sizes.
// https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
// https://support.google.com/googleplay/android-developer/answer/9866151
export const PRESETS: { id: string; name: string; platform: Platform; width: number; height: number }[] = [
  { id: 'iphone-69', name: 'iPhone 6.9″', platform: 'app-store', width: 1320, height: 2868 },
  { id: 'iphone-65', name: 'iPhone 6.5″', platform: 'app-store', width: 1284, height: 2778 },
  { id: 'ipad-13', name: 'iPad 13″', platform: 'app-store', width: 2064, height: 2752 },
  { id: 'play-portrait', name: 'Phone · Portrait', platform: 'google-play', width: 1080, height: 1920 },
  { id: 'play-landscape', name: 'Phone · Landscape', platform: 'google-play', width: 1920, height: 1080 }
];
export function createGroup(presetId: string, options: Partial<Pick<Group, 'name' | 'locale' | 'prefix' | 'variant' | 'gap'>> = {}): Group {
  const preset = PRESETS.find(p => p.id === presetId);
  if (!preset) throw new Error('Невідомий preset');
  return { id: newId(), name: preset.name, platform: preset.platform, presetId: preset.id,
    width: preset.width, height: preset.height, locale: 'en', prefix: '', variant: '', gap: 40,
    background: { type: 'solid', color: '#243447' }, backgroundScope: 'group',
    slides: [createSlide()], elements: [], ...options };
}
