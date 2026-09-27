import { layoutText } from './text';
import { groupWidth, slideRect } from '../domain/geometry';
import type { Group } from '../domain/schema';
import { DEVICES } from '../domain/devices';
export function createScene(group: Group, assets: Record<string, string> = {}) {
  const artwork = Object.fromEntries(DEVICES.filter(device => device.artworkPath).map(device => [`device-artwork:${device.id}`, device.artworkPath!]));
  return { group, assets: { ...artwork, ...assets }, fontCss: '', width: groupWidth(group), height: group.height,
    slides: group.slides.map((slide, index) => ({ ...slide, rect: slideRect(group, index), index })),
    elements: group.elements.map(e => {
      if (e.type !== 'text') return e;
      const layout = layoutText(e);
      return { ...e, width: layout.width, height: layout.height };
    }).sort((a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id)) };
}
export type Scene = ReturnType<typeof createScene>;
