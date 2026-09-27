/** Licensed 2D artwork and model-specific vector frames share one SVG export path. */
export interface DeviceSpec {
  id: string; name: string; width: number; height: number; radius: number; color: string; border: string;
  screen: { x: number; y: number; width: number; height: number; radius: number };
  camera: 'pill' | 'dot' | 'hole' | 'notch' | 'none';
  group: DeviceGroupId;
  formFactor?: 'phone' | 'tablet' | 'laptop' | 'desktop' | 'watch';
  artworkPath?: string;
  artworkLayer?: 'front' | 'back';
  legacy?: boolean;
  /** Affine 2D angle applied to the complete frame and masked screenshot. */
  transform?: string;
}
export interface DeviceGroup { id: DeviceGroupId; name: string }
export type DeviceGroupId = 'iphone' | 'android' | 'popular-android' | 'ipad' | 'mac' | 'watch' | 'legacy';
export const DEVICE_GROUPS: DeviceGroup[] = [
  { id: 'iphone', name: 'iPhone' },
  { id: 'android', name: 'Android' },
  { id: 'popular-android', name: 'Популярні Android' },
  { id: 'ipad', name: 'iPad' },
  { id: 'mac', name: 'Mac' },
  { id: 'watch', name: 'Watch' }
];
export const DEVICES: DeviceSpec[] = [
  { id: 'iphone-17', name: 'iPhone 17', width: 1000, height: 2060, radius: 120, color: '#f1f4f8', border: '#b8c1cc', screen: { x: 28, y: 28, width: 944, height: 2004, radius: 95 }, camera: 'pill', group: 'iphone' },
  { id: 'iphone-17-pro', name: 'iPhone 17 Pro', width: 1000, height: 2060, radius: 120, color: '#292e37', border: '#8c929a', screen: { x: 28, y: 28, width: 944, height: 2004, radius: 95 }, camera: 'pill', group: 'iphone' },
  { id: 'iphone-16-max', name: 'iPhone 17 Pro Max', width: 415, height: 843, radius: 60, color: '#e9e4da', border: '#c7c4be', screen: { x: 14, y: 11, width: 387, height: 821, radius: 51 }, camera: 'none', group: 'iphone', artworkPath: '/aso-screenshot-studio/devices/iphone-16-max.svg?v=2', artworkLayer: 'front' },
  { id: 'iphone-air', name: 'iPhone Air', width: 930, height: 2060, radius: 112, color: '#e8edf3', border: '#aab4bf', screen: { x: 24, y: 28, width: 882, height: 2004, radius: 88 }, camera: 'pill', group: 'iphone' },
  { id: 'iphone-17-3d', name: 'iPhone 17 (3D)', width: 1000, height: 2060, radius: 120, color: '#202733', border: '#7e8794', screen: { x: 28, y: 28, width: 944, height: 2004, radius: 95 }, camera: 'pill', group: 'iphone', transform: 'matrix(0.82 0.04 -0.06 0.94 122 44)' },
  { id: 'iphone-17-pro-max-3d', name: 'iPhone 17 Pro Max (3D)', width: 1000, height: 2060, radius: 120, color: '#2f333a', border: '#949aa3', screen: { x: 28, y: 28, width: 944, height: 2004, radius: 95 }, camera: 'pill', group: 'iphone', transform: 'matrix(0.76 0.06 -0.08 0.9 205 82)' },
  { id: 'generic-android-phone', name: 'Generic Android Phone', width: 1000, height: 2160, radius: 92, color: '#1e293b', border: '#64748b', screen: { x: 24, y: 24, width: 952, height: 2112, radius: 72 }, camera: 'hole', group: 'android' },
  { id: 'pixel-9-pro', name: 'Generic Abstract Pixel 9', width: 353, height: 745, radius: 64, color: '#242428', border: '#8b8b8f', screen: { x: 15, y: 15, width: 321, height: 717, radius: 45 }, camera: 'none', group: 'android', artworkPath: '/aso-screenshot-studio/devices/pixel-9-pro.svg', artworkLayer: 'front' },
  { id: 'generic-android-tablet', name: 'Generic Android Tablet', width: 1600, height: 2560, radius: 90, color: '#202734', border: '#657182', screen: { x: 54, y: 58, width: 1492, height: 2444, radius: 44 }, camera: 'none', group: 'android', formFactor: 'tablet' },
  { id: 'galaxy-s26-ultra', name: 'Samsung Galaxy S26 Ultra', width: 1000, height: 2165, radius: 84, color: '#3f444d', border: '#a7adb8', screen: { x: 22, y: 22, width: 956, height: 2121, radius: 67 }, camera: 'hole', group: 'popular-android' },
  { id: 'galaxy-s26', name: 'Samsung Galaxy S26', width: 1000, height: 2160, radius: 96, color: '#202832', border: '#7f8a98', screen: { x: 24, y: 24, width: 952, height: 2112, radius: 76 }, camera: 'hole', group: 'popular-android' },
  { id: 'galaxy-s25-ultra', name: 'Samsung Galaxy S25 Ultra', width: 1000, height: 2165, radius: 84, color: '#46484d', border: '#a7a9ac', screen: { x: 22, y: 22, width: 956, height: 2121, radius: 67 }, camera: 'hole', group: 'popular-android' },
  { id: 'galaxy-a56', name: 'Samsung Galaxy A56 5G', width: 1000, height: 2180, radius: 96, color: '#273244', border: '#748197', screen: { x: 25, y: 25, width: 950, height: 2130, radius: 76 }, camera: 'hole', group: 'popular-android' },
  { id: 'pixel-10-pro', name: 'Google Pixel 10 Pro', width: 1000, height: 2140, radius: 106, color: '#252a32', border: '#9aa3ae', screen: { x: 28, y: 28, width: 944, height: 2084, radius: 82 }, camera: 'hole', group: 'popular-android' },
  { id: 'pixel-10', name: 'Google Pixel 10', width: 1000, height: 2140, radius: 106, color: '#e7ebef', border: '#aab4bf', screen: { x: 28, y: 28, width: 944, height: 2084, radius: 82 }, camera: 'hole', group: 'popular-android' },
  { id: 'oneplus-15', name: 'OnePlus 15', width: 1000, height: 2160, radius: 100, color: '#1f2933', border: '#5f7186', screen: { x: 24, y: 24, width: 952, height: 2112, radius: 78 }, camera: 'hole', group: 'popular-android' },
  { id: 'xiaomi-15-ultra', name: 'Xiaomi 15 Ultra', width: 1000, height: 2180, radius: 98, color: '#111827', border: '#8b95a1', screen: { x: 25, y: 25, width: 950, height: 2130, radius: 76 }, camera: 'hole', group: 'popular-android' },
  { id: 'xiaomi-17t', name: 'Xiaomi 17T', width: 1000, height: 2180, radius: 98, color: '#e8edf4', border: '#a4afbd', screen: { x: 25, y: 25, width: 950, height: 2130, radius: 76 }, camera: 'hole', group: 'popular-android' },
  { id: 'motorola-razr-ultra-2026', name: 'Motorola Razr Ultra (2026)', width: 980, height: 2140, radius: 118, color: '#171d29', border: '#7f8da1', screen: { x: 28, y: 30, width: 924, height: 2080, radius: 90 }, camera: 'hole', group: 'popular-android' },
  { id: 'generic-ipad-pro-11', name: 'Generic iPad Pro 11"', width: 1668, height: 2388, radius: 110, color: '#2f3642', border: '#7b8490', screen: { x: 62, y: 70, width: 1544, height: 2248, radius: 34 }, camera: 'none', group: 'ipad', formFactor: 'tablet' },
  { id: 'generic-ipad-pro-13', name: 'Generic iPad Pro 13"', width: 2064, height: 2752, radius: 130, color: '#2f3642', border: '#7b8490', screen: { x: 82, y: 88, width: 1900, height: 2576, radius: 38 }, camera: 'none', group: 'ipad', formFactor: 'tablet' },
  { id: 'ipad-pro-11', name: 'iPad Pro 11"', width: 1668, height: 2388, radius: 110, color: '#3e3e3e', border: '#545454', screen: { x: 62, y: 70, width: 1544, height: 2248, radius: 34 }, camera: 'none', group: 'ipad', formFactor: 'tablet' },
  { id: 'ipad-pro-12-9', name: 'iPad Pro 13"', width: 2240, height: 2924, radius: 135, color: '#3e3e3e', border: '#545454', screen: { x: 93, y: 99, width: 2048, height: 2732, radius: 35 }, camera: 'none', group: 'ipad', formFactor: 'tablet', artworkPath: '/aso-screenshot-studio/devices/ipad-pro-12-9-space-gray.svg' },
  { id: 'generic-macbook', name: 'Generic MacBook', width: 2560, height: 1700, radius: 26, color: '#d4d7dc', border: '#8f969f', screen: { x: 150, y: 92, width: 2260, height: 1412, radius: 18 }, camera: 'none', group: 'mac', formFactor: 'laptop' },
  { id: 'macbook-air-13', name: 'MacBook Air 13"', width: 2560, height: 1664, radius: 26, color: '#e6e8eb', border: '#a1a7ae', screen: { x: 150, y: 92, width: 2260, height: 1412, radius: 18 }, camera: 'none', group: 'mac', formFactor: 'laptop' },
  { id: 'macbook-pro-14', name: 'MacBook Pro 14"', width: 3024, height: 1964, radius: 34, color: '#30343b', border: '#7e8792', screen: { x: 160, y: 104, width: 2704, height: 1692, radius: 22 }, camera: 'none', group: 'mac', formFactor: 'laptop' },
  { id: 'macbook-pro-16', name: 'MacBook Pro 16"', width: 3456, height: 2234, radius: 38, color: '#30343b', border: '#7e8792', screen: { x: 178, y: 116, width: 3100, height: 1936, radius: 24 }, camera: 'none', group: 'mac', formFactor: 'laptop' },
  { id: 'imac-24', name: 'iMac 24"', width: 4480, height: 3040, radius: 42, color: '#e7ebf0', border: '#a6aeb8', screen: { x: 190, y: 170, width: 4100, height: 2306, radius: 20 }, camera: 'none', group: 'mac', formFactor: 'desktop' },
  { id: 'apple-watch-ultra-3', name: 'Apple Watch Ultra 3', width: 820, height: 980, radius: 190, color: '#d1a36f', border: '#986f42', screen: { x: 86, y: 92, width: 648, height: 796, radius: 138 }, camera: 'none', group: 'watch', formFactor: 'watch' },
  { id: 'phone-front', name: 'Phone · Midnight (старий)', width: 1000, height: 2060, radius: 120, color: '#17202c', border: '#64748b', screen: { x: 28, y: 28, width: 944, height: 2004, radius: 95 }, camera: 'pill', group: 'legacy', legacy: true },
  { id: 'phone-light', name: 'Phone · Silver (старий)', width: 1000, height: 2060, radius: 120, color: '#cbd5e1', border: '#94a3b8', screen: { x: 28, y: 28, width: 944, height: 2004, radius: 95 }, camera: 'dot', group: 'legacy', legacy: true },
  { id: 'phone-angled', name: 'Phone · Angled Midnight (старий)', width: 1000, height: 2060, radius: 120, color: '#17202c', border: '#64748b', screen: { x: 28, y: 28, width: 944, height: 2004, radius: 95 }, camera: 'pill', group: 'legacy', transform: 'matrix(0.74 0.06 -0.08 0.88 220 90)', legacy: true },
  { id: 'tablet-front', name: 'Tablet · Graphite (старий)', width: 1000, height: 1380, radius: 60, color: '#17202c', border: '#64748b', screen: { x: 36, y: 36, width: 928, height: 1308, radius: 30 }, camera: 'none', group: 'legacy', formFactor: 'tablet', legacy: true }
];
