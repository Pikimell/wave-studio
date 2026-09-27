import type { Scene } from './scene';
import { backgroundSvg, elementSvg } from './svg';
/** All content is in group coordinates. Each slide is a window; gaps have no window. */
export function renderSlideContent(scene: Scene, index: number, namespace: string) {
  const slide = scene.slides[index];
  if (!slide) throw new Error('Слайд не знайдено');
  const { group } = scene;
  const id = `${namespace}-${slide.id}`;
  const background = slide.background ?? group.background;
  const repeat = slide.background !== null || group.backgroundScope === 'slide';
  return `<defs><clipPath id="${id}"><rect x="${slide.rect.x}" y="0" width="${group.width}" height="${group.height}"/></clipPath></defs><g clip-path="url(#${id})"><g transform="translate(${repeat ? slide.rect.x : 0} 0)">${backgroundSvg(background, repeat ? group.width : scene.width, group.height, `${id}-bg`, scene.assets)}</g>${scene.elements.map(e => elementSvg(e, id, scene.assets)).join('')}</g>`;
}
export function renderSlideSvg(scene: Scene, index: number, namespace = 'export') {
  const slide = scene.slides[index];
  if (!slide) throw new Error('Слайд не знайдено');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.group.width}" height="${scene.height}" viewBox="${slide.rect.x} 0 ${scene.group.width} ${scene.height}">${scene.fontCss ? `<style>${scene.fontCss}</style>` : ''}${renderSlideContent(scene, index, namespace)}</svg>`;
}
