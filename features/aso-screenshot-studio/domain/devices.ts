/** Original, generic 2D frames: no vendor logos or third-party assets. Geometry uses a 1000-unit viewBox. */
export const DEVICES = [
  { id: 'phone-front', name: 'Phone · Midnight', width: 1000, height: 2060, radius: 120, color: '#17202c', border: '#64748b', screen: { x: 28, y: 28, width: 944, height: 2004, radius: 95 }, camera: 'pill' },
  { id: 'phone-light', name: 'Phone · Silver', width: 1000, height: 2060, radius: 120, color: '#cbd5e1', border: '#94a3b8', screen: { x: 28, y: 28, width: 944, height: 2004, radius: 95 }, camera: 'dot' },
  { id: 'tablet-front', name: 'Tablet · Graphite', width: 1000, height: 1380, radius: 60, color: '#17202c', border: '#64748b', screen: { x: 36, y: 36, width: 928, height: 1308, radius: 30 }, camera: 'none' }
] as const;
