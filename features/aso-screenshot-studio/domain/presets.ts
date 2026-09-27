import { createSlide, newId, type Group, type Platform } from './schema';

export interface Preset {
  id: string; name: string; platform: Platform; category: string; width: number; height: number;
}

// Verified 2026-09-27. App Store sizes are exact accepted screenshot dimensions.
// Google Play sizes are practical 9:16/16:9 choices within the current official limits.
// https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
// https://support.google.com/googleplay/android-developer/answer/9866151
export const PRESETS: Preset[] = [
  { id: 'iphone-duo-outer-portrait', name: 'iPhone Duo outer · Portrait', platform: 'app-store', category: 'iPhone', width: 1398, height: 2034 },
  { id: 'iphone-duo-outer-landscape', name: 'iPhone Duo outer · Landscape', platform: 'app-store', category: 'iPhone', width: 2034, height: 1398 },
  { id: 'iphone-duo-inner-portrait', name: 'iPhone Duo inner · Portrait', platform: 'app-store', category: 'iPhone', width: 2007, height: 2853 },
  { id: 'iphone-duo-inner-landscape', name: 'iPhone Duo inner · Landscape', platform: 'app-store', category: 'iPhone', width: 2853, height: 2007 },
  { id: 'iphone-69-1260-portrait', name: 'iPhone 6.9″ · Portrait', platform: 'app-store', category: 'iPhone', width: 1260, height: 2736 },
  { id: 'iphone-69-1260-landscape', name: 'iPhone 6.9″ · Landscape', platform: 'app-store', category: 'iPhone', width: 2736, height: 1260 },
  { id: 'iphone-69-1290-portrait', name: 'iPhone 6.9″ · Portrait', platform: 'app-store', category: 'iPhone', width: 1290, height: 2796 },
  { id: 'iphone-69-1290-landscape', name: 'iPhone 6.9″ · Landscape', platform: 'app-store', category: 'iPhone', width: 2796, height: 1290 },
  { id: 'iphone-69', name: 'iPhone 6.9″ · Portrait', platform: 'app-store', category: 'iPhone', width: 1320, height: 2868 },
  { id: 'iphone-69-landscape', name: 'iPhone 6.9″ · Landscape', platform: 'app-store', category: 'iPhone', width: 2868, height: 1320 },
  { id: 'iphone-65', name: 'iPhone 6.5″ · Portrait', platform: 'app-store', category: 'iPhone', width: 1284, height: 2778 },
  { id: 'iphone-65-landscape', name: 'iPhone 6.5″ · Landscape', platform: 'app-store', category: 'iPhone', width: 2778, height: 1284 },
  { id: 'iphone-65-1242-portrait', name: 'iPhone 6.5″ · Portrait', platform: 'app-store', category: 'iPhone', width: 1242, height: 2688 },
  { id: 'iphone-65-1242-landscape', name: 'iPhone 6.5″ · Landscape', platform: 'app-store', category: 'iPhone', width: 2688, height: 1242 },
  { id: 'iphone-63-1179-portrait', name: 'iPhone 6.3″ · Portrait', platform: 'app-store', category: 'iPhone', width: 1179, height: 2556 },
  { id: 'iphone-63-1179-landscape', name: 'iPhone 6.3″ · Landscape', platform: 'app-store', category: 'iPhone', width: 2556, height: 1179 },
  { id: 'iphone-63-1206-portrait', name: 'iPhone 6.3″ · Portrait', platform: 'app-store', category: 'iPhone', width: 1206, height: 2622 },
  { id: 'iphone-63-1206-landscape', name: 'iPhone 6.3″ · Landscape', platform: 'app-store', category: 'iPhone', width: 2622, height: 1206 },
  { id: 'iphone-61-1170-portrait', name: 'iPhone 6.1″ · Portrait', platform: 'app-store', category: 'iPhone', width: 1170, height: 2532 },
  { id: 'iphone-61-1170-landscape', name: 'iPhone 6.1″ · Landscape', platform: 'app-store', category: 'iPhone', width: 2532, height: 1170 },
  { id: 'iphone-61-1125-portrait', name: 'iPhone 6.1″ · Portrait', platform: 'app-store', category: 'iPhone', width: 1125, height: 2436 },
  { id: 'iphone-61-1125-landscape', name: 'iPhone 6.1″ · Landscape', platform: 'app-store', category: 'iPhone', width: 2436, height: 1125 },
  { id: 'iphone-61-1080-portrait', name: 'iPhone 6.1″ · Portrait', platform: 'app-store', category: 'iPhone', width: 1080, height: 2340 },
  { id: 'iphone-61-1080-landscape', name: 'iPhone 6.1″ · Landscape', platform: 'app-store', category: 'iPhone', width: 2340, height: 1080 },
  { id: 'iphone-55-portrait', name: 'iPhone 5.5″ · Portrait', platform: 'app-store', category: 'iPhone', width: 1242, height: 2208 },
  { id: 'iphone-55-landscape', name: 'iPhone 5.5″ · Landscape', platform: 'app-store', category: 'iPhone', width: 2208, height: 1242 },
  { id: 'iphone-47-portrait', name: 'iPhone 4.7″ · Portrait', platform: 'app-store', category: 'iPhone', width: 750, height: 1334 },
  { id: 'iphone-47-landscape', name: 'iPhone 4.7″ · Landscape', platform: 'app-store', category: 'iPhone', width: 1334, height: 750 },
  { id: 'iphone-40-portrait-no-status', name: 'iPhone 4″ · Portrait no status bar', platform: 'app-store', category: 'iPhone', width: 640, height: 1096 },
  { id: 'iphone-40-portrait-status', name: 'iPhone 4″ · Portrait with status bar', platform: 'app-store', category: 'iPhone', width: 640, height: 1136 },
  { id: 'iphone-40-landscape-no-status', name: 'iPhone 4″ · Landscape no status bar', platform: 'app-store', category: 'iPhone', width: 1136, height: 600 },
  { id: 'iphone-40-landscape-status', name: 'iPhone 4″ · Landscape with status bar', platform: 'app-store', category: 'iPhone', width: 1136, height: 640 },
  { id: 'iphone-35-portrait-no-status', name: 'iPhone 3.5″ · Portrait no status bar', platform: 'app-store', category: 'iPhone', width: 640, height: 920 },
  { id: 'iphone-35-portrait-status', name: 'iPhone 3.5″ · Portrait with status bar', platform: 'app-store', category: 'iPhone', width: 640, height: 960 },
  { id: 'iphone-35-landscape-no-status', name: 'iPhone 3.5″ · Landscape no status bar', platform: 'app-store', category: 'iPhone', width: 960, height: 600 },
  { id: 'iphone-35-landscape-status', name: 'iPhone 3.5″ · Landscape with status bar', platform: 'app-store', category: 'iPhone', width: 960, height: 640 },
  { id: 'ipad-13', name: 'iPad 13″ · Portrait', platform: 'app-store', category: 'iPad', width: 2064, height: 2752 },
  { id: 'ipad-13-landscape', name: 'iPad 13″ · Landscape', platform: 'app-store', category: 'iPad', width: 2752, height: 2064 },
  { id: 'ipad-13-2048-portrait', name: 'iPad 13″ / 12.9″ · Portrait', platform: 'app-store', category: 'iPad', width: 2048, height: 2732 },
  { id: 'ipad-13-2048-landscape', name: 'iPad 13″ / 12.9″ · Landscape', platform: 'app-store', category: 'iPad', width: 2732, height: 2048 },
  { id: 'ipad-11-1488-portrait', name: 'iPad 11″ · Portrait', platform: 'app-store', category: 'iPad', width: 1488, height: 2266 },
  { id: 'ipad-11-1488-landscape', name: 'iPad 11″ · Landscape', platform: 'app-store', category: 'iPad', width: 2266, height: 1488 },
  { id: 'ipad-11-1668-2420-portrait', name: 'iPad 11″ · Portrait', platform: 'app-store', category: 'iPad', width: 1668, height: 2420 },
  { id: 'ipad-11-1668-2420-landscape', name: 'iPad 11″ · Landscape', platform: 'app-store', category: 'iPad', width: 2420, height: 1668 },
  { id: 'ipad-11-1668-2388-portrait', name: 'iPad 11″ · Portrait', platform: 'app-store', category: 'iPad', width: 1668, height: 2388 },
  { id: 'ipad-11-1668-2388-landscape', name: 'iPad 11″ · Landscape', platform: 'app-store', category: 'iPad', width: 2388, height: 1668 },
  { id: 'ipad-11-1640-portrait', name: 'iPad 11″ · Portrait', platform: 'app-store', category: 'iPad', width: 1640, height: 2360 },
  { id: 'ipad-11-1640-landscape', name: 'iPad 11″ · Landscape', platform: 'app-store', category: 'iPad', width: 2360, height: 1640 },
  { id: 'ipad-105-portrait', name: 'iPad 10.5″ · Portrait', platform: 'app-store', category: 'iPad', width: 1668, height: 2224 },
  { id: 'ipad-105-landscape', name: 'iPad 10.5″ · Landscape', platform: 'app-store', category: 'iPad', width: 2224, height: 1668 },
  { id: 'ipad-97-1536-portrait-no-status', name: 'iPad 9.7″ · Portrait no status bar', platform: 'app-store', category: 'iPad', width: 1536, height: 2008 },
  { id: 'ipad-97-1536-portrait-status', name: 'iPad 9.7″ · Portrait with status bar', platform: 'app-store', category: 'iPad', width: 1536, height: 2048 },
  { id: 'ipad-97-2048-landscape-no-status', name: 'iPad 9.7″ · Landscape no status bar', platform: 'app-store', category: 'iPad', width: 2048, height: 1496 },
  { id: 'ipad-97-2048-landscape-status', name: 'iPad 9.7″ · Landscape with status bar', platform: 'app-store', category: 'iPad', width: 2048, height: 1536 },
  { id: 'ipad-97-768-portrait-no-status', name: 'iPad 9.7″ · Portrait no status bar', platform: 'app-store', category: 'iPad', width: 768, height: 1004 },
  { id: 'ipad-97-768-portrait-status', name: 'iPad 9.7″ · Portrait with status bar', platform: 'app-store', category: 'iPad', width: 768, height: 1024 },
  { id: 'ipad-97-1024-landscape-no-status', name: 'iPad 9.7″ · Landscape no status bar', platform: 'app-store', category: 'iPad', width: 1024, height: 748 },
  { id: 'ipad-97-1024-landscape-status', name: 'iPad 9.7″ · Landscape with status bar', platform: 'app-store', category: 'iPad', width: 1024, height: 768 },
  { id: 'mac-1280', name: 'Mac · 16:10', platform: 'app-store', category: 'Laptop / Mac', width: 1280, height: 800 },
  { id: 'mac-1440', name: 'Mac · 16:10', platform: 'app-store', category: 'Laptop / Mac', width: 1440, height: 900 },
  { id: 'mac-2560', name: 'Mac · 16:10', platform: 'app-store', category: 'Laptop / Mac', width: 2560, height: 1600 },
  { id: 'mac-2880', name: 'Mac · 16:10', platform: 'app-store', category: 'Laptop / Mac', width: 2880, height: 1800 },
  { id: 'play-portrait', name: 'Android phone · Portrait', platform: 'google-play', category: 'Android', width: 1080, height: 1920 },
  { id: 'play-landscape', name: 'Android phone · Landscape', platform: 'google-play', category: 'Android', width: 1920, height: 1080 },
  { id: 'play-tablet-1200-portrait', name: 'Android tablet · Portrait', platform: 'google-play', category: 'Android', width: 1200, height: 1920 },
  { id: 'play-tablet-1200-landscape', name: 'Android tablet · Landscape', platform: 'google-play', category: 'Android', width: 1920, height: 1200 },
  { id: 'play-tablet-1600-portrait', name: 'Android tablet · Portrait', platform: 'google-play', category: 'Android', width: 1600, height: 2560 },
  { id: 'play-tablet-1600-landscape', name: 'Android tablet · Landscape', platform: 'google-play', category: 'Android', width: 2560, height: 1600 },
  { id: 'play-chromebook-1920', name: 'Chromebook / Laptop · 16:9', platform: 'google-play', category: 'Laptop / Mac', width: 1920, height: 1080 },
  { id: 'play-chromebook-2560', name: 'Chromebook / Laptop · 16:9', platform: 'google-play', category: 'Laptop / Mac', width: 2560, height: 1440 },
  { id: 'play-chromebook-3840', name: 'Chromebook / Laptop · 16:9', platform: 'google-play', category: 'Laptop / Mac', width: 3840, height: 2160 }
];
export function createGroup(presetId: string, options: Partial<Pick<Group, 'name' | 'locale' | 'prefix' | 'variant' | 'gap'>> = {}): Group {
  const preset = PRESETS.find(p => p.id === presetId);
  if (!preset) throw new Error('Невідомий preset');
  return { id: newId(), name: preset.name, platform: preset.platform, presetId: preset.id,
    width: preset.width, height: preset.height, locale: 'en', prefix: '', variant: '', gap: 40,
    background: { type: 'solid', color: '#243447' }, backgroundScope: 'group',
    slides: [createSlide()], elements: [], ...options };
}
