import { blendWithWhite } from './math';
import type { WaveLayer, WaveProject } from './types';

const rng = (seed: number) => {
  let current = seed >>> 0;

  return () => {
    current = (1664525 * current + 1013904223) >>> 0;
    return current / 4294967296;
  };
};

export const createWavePath = (wave: WaveLayer, width: number, height: number) => {
  const random = rng(wave.seed);
  const amplitude = (height * wave.amplitude) / 100;
  const center = (height * wave.position) / 100;
  const averageSpan = width / (wave.frequency * 2);
  const points: Array<[number, number]> = [];
  const startX = -width - averageSpan * 2;
  const requiredEndX = width * 2 + averageSpan * 2;
  let x = startX;
  let drift = (random() - 0.5) * 0.4;
  const firstDirection = random() < 0.5 ? -1 : 1;

  for (let index = 0; x < requiredEndX && index < 800; index += 1) {
    drift = Math.max(-0.3, Math.min(0.3, drift * 0.7 + (random() - 0.5) * 0.32));
    const direction = index % 2 === 0 ? firstDirection : -firstDirection;
    const variation = 0.55 + random() * 0.5;
    points.push([x, center + amplitude * (direction * variation + drift)]);
    x += averageSpan * (0.65 + random() * 0.7);
  }

  const n = (number: number) => Number(number.toFixed(2));
  let path = `M ${n(points[0][0])} ${n(points[0][1])}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const distance = next[0] - current[0];
    const left = 0.34 + random() * 0.14;
    const right = 0.34 + random() * 0.14;
    path += ` C ${n(current[0] + distance * left)} ${n(current[1])} ${n(next[0] - distance * right)} ${n(next[1])} ${n(next[0])} ${n(next[1])}`;
  }

  return { path, startX: points[0][0], endX: points[points.length - 1][0] };
};

export const createSvgMarkup = ({ width, height, background, waves }: WaveProject) => {
  const gradients = waves
    .filter((wave) => wave.type === 'fill')
    .map(
      (wave) =>
        `<linearGradient id="gradient-${wave.id}" x1="0" y1="0" x2="0.18" y2="1"><stop offset="0%" stop-color="${blendWithWhite(
          wave.color,
          0.25
        )}"/><stop offset="100%" stop-color="${wave.color}"/></linearGradient>`
    )
    .join('');

  const paths = waves
    .map((wave) => {
      const { path, startX, endX } = createWavePath(wave, width, height);
      const opacity = wave.opacity / 100;
      const transform = `translate(${Number(((width * wave.offset) / 100).toFixed(2))} 0)`;

      return wave.type === 'line'
        ? `<path d="${path}" transform="${transform}" fill="none" stroke="${wave.color}" stroke-width="${Math.max(2, height * 0.003)}" stroke-linecap="round" opacity="${opacity}"/>`
        : `<path d="${path} L ${endX} ${height} L ${startX} ${height} Z" transform="${transform}" fill="url(#gradient-${wave.id})" opacity="${opacity}"/>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet"><defs>${gradients}</defs><rect width="${width}" height="${height}" fill="${background}"/>${paths}</svg>`;
};
