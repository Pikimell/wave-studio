import { DEVICES } from '../domain/devices';
import { layoutText } from './text';
import type { Background, StudioElement } from '../domain/schema';
export const escapeXml = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));
export function backgroundSvg(background: Background, width: number, height: number, id: string, assets: Record<string, string> = {}) {
  if (background.type === 'solid') return `<rect width="${width}" height="${height}" fill="${background.color}"/>`;
  if (background.type === 'gradient') {
    const angle = background.angle * Math.PI / 180;
    const dx = Math.sin(angle) / 2, dy = Math.cos(angle) / 2;
    return `<defs><linearGradient id="${id}" x1="${0.5 - dx}" y1="${0.5 + dy}" x2="${0.5 + dx}" y2="${0.5 - dy}"><stop stop-color="${background.from}"/>${background.mid ? `<stop offset=".5" stop-color="${background.mid}"/>` : ''}<stop offset="1" stop-color="${background.to}"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#${id})"/>`;
  }
  if (background.type === 'image' && assets[background.asset.assetId]) return `<image width="${width}" height="${height}" href="${escapeXml(assets[background.asset.assetId])}" preserveAspectRatio="${background.fit === 'stretch' ? 'none' : 'xMidYMid slice'}"/>`;
  return `<rect width="${width}" height="${height}" fill="#e2e8f0"/><text x="32" y="64" fill="#334155" font-size="32" font-family="Arial">Background image missing</text>`;
}
function placeholder(width: number, height: number, label: string, device = false) {
  return `<rect width="${width}" height="${height}" rx="${device ? 70 : 24}" fill="${device ? '#111827' : '#dbe4ee'}" stroke="#64748b" stroke-width="4"/>${device ? `<rect x="18" y="18" width="${Math.max(1, width - 36)}" height="${Math.max(1, height - 36)}" rx="54" fill="#334155"/>` : ''}<text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="${device ? '#cbd5e1' : '#334155'}" font-family="Arial" font-size="${Math.min(32, width / 12)}">${label}</text>`;
}
export function elementSvg(element: StudioElement, namespace: string, assets: Record<string, string> = {}) {
  let content: string;
  switch (element.type) {
    case 'shape': content = element.shape === 'ellipse'
      ? `<ellipse cx="${element.width / 2}" cy="${element.height / 2}" rx="${element.width / 2}" ry="${element.height / 2}" fill="${element.fill}"/>`
      : `<rect width="${element.width}" height="${element.height}" rx="${element.radius}" fill="${element.fill}"/>`; break;
    case 'text': {
      const layout = layoutText(element), id = `${namespace}-text-${element.id}`;
      let y = element.padding;
      const freeHeight = Math.max(0, layout.height - element.padding * 2 - layout.contentHeight);
      if (element.verticalAlign === 'center') y += freeHeight / 2;
      if (element.verticalAlign === 'bottom') y += freeHeight;
      const lines = layout.lines.map(line => {
        let x = element.padding;
        if (element.textAlign === 'center') x += (layout.width - element.padding * 2 - line.width) / 2;
        if (element.textAlign === 'right') x += layout.width - element.padding * 2 - line.width;
        const content = line.chunks.map(chunk => {
          const style = chunk.style;
          const svg = `<text x="${x}" y="${y + line.fontSize}" font-family="${escapeXml(style.fontFamily)}" font-size="${style.fontSize}" font-weight="${style.fontWeight}" font-style="${style.italic ? 'italic' : 'normal'}" fill="${style.color}" letter-spacing="${element.letterSpacing}" xml:space="preserve">${escapeXml(chunk.text)}</text>`;
          x += chunk.width; return svg;
        }).join('');
        y += line.height; return content;
      }).join('');
      content = `<defs><clipPath id="${id}"><rect width="${layout.width}" height="${layout.height}"/></clipPath></defs><g clip-path="url(#${id})">${element.background ? `<rect width="${layout.width}" height="${layout.height}" fill="${element.background}"/>` : ''}${lines}</g>`;
      break;
    }
    case 'image': content = element.asset && assets[element.asset.assetId] ? `<svg width="${element.width}" height="${element.height}" overflow="hidden"><image width="${element.width}" height="${element.height}" href="${escapeXml(assets[element.asset.assetId])}" preserveAspectRatio="${element.fit === 'stretch' ? 'none' : element.fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}"/></svg>` : placeholder(element.width, element.height, 'Image missing'); break;
    case 'device': {
      const device = DEVICES.find(d => d.id === element.deviceId);
      if (!device) { content = placeholder(element.width, element.height, 'Device missing', true); break; }
      const screen = device.screen, id = `${namespace}-screen-${element.id}`;
      const url = element.screenshot && assets[element.screenshot.assetId];
      const uploadHint = `<g transform="translate(${device.width / 2} ${device.height / 2})" fill="none" stroke="#e2e8f0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><circle r="62" fill="#475569" fill-opacity=".92" stroke="none"/><path d="M-22 8v22a7 7 0 0 0 7 7h30a7 7 0 0 0 7-7V8M0 17v-37m-14 14L0-20 14-6"/></g><text x="${device.width / 2}" y="${device.height / 2 + 105}" text-anchor="middle" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="28">Двічі клацніть</text>`;
      const screenImage = url ? `<image x="${screen.x}" y="${screen.y}" width="${screen.width}" height="${screen.height}" href="${escapeXml(url)}" preserveAspectRatio="xMidYMid slice"/>` : '';
      const screenshot = `<g clip-path="url(#${id})"><rect x="${screen.x}" y="${screen.y}" width="${screen.width}" height="${screen.height}" fill="#334155"/>${screenImage || uploadHint}</g>`;
      const statusZones = device.id === 'iphone-16-max' ? [[screen.x, screen.y, 138, 56], [262, screen.y, screen.x + screen.width - 262, 56]]
        : device.id === 'pixel-9-pro' ? [[screen.x, screen.y, 145, 58], [190, screen.y, screen.x + screen.width - 190, 58]] : [];
      const statusId = `${id}-status`;
      const statusCover = statusZones.length ? `<g clip-path="url(#${id})"><g clip-path="url(#${statusId})"><rect x="${screen.x}" y="${screen.y}" width="${screen.width}" height="${screen.height}" fill="#334155"/>${screenImage}</g></g>` : '';
      const artwork = device.artworkPath ? assets[`device-artwork:${device.id}`] ?? device.artworkPath : null;
      const artworkImage = artwork ? `<image width="${device.width}" height="${device.height}" href="${escapeXml(artwork)}" preserveAspectRatio="none"/>` : '';
      const camera = device.camera === 'pill' ? '<rect x="375" y="48" width="250" height="65" rx="32" fill="#0b1018"/>'
        : device.camera === 'dot' ? '<circle cx="500" cy="74" r="20" fill="#0b1018"/>'
          : device.camera === 'hole' ? '<circle cx="500" cy="72" r="17" fill="#05070a" stroke="#313843" stroke-width="5"/>'
            : '';
      const genericFrame = device.formFactor === 'laptop'
        ? `<rect x="70" y="24" width="${device.width - 140}" height="${screen.y + screen.height + 90}" rx="${device.radius}" fill="${device.color}" stroke="${device.border}" stroke-width="10"/><rect x="${screen.x - 10}" y="${screen.y - 10}" width="${screen.width + 20}" height="${screen.height + 20}" rx="${screen.radius + 10}" fill="#10151c"/>${screenshot}<rect x="${screen.x}" y="${screen.y}" width="${screen.width}" height="${screen.height}" rx="${screen.radius}" fill="none" stroke="#6c737e" stroke-opacity=".55" stroke-width="4"/><path d="M0 ${device.height - 150} H${device.width} L${device.width - 120} ${device.height - 12} H120 Z" fill="${device.border}"/><path d="M${device.width * .41} ${device.height - 126} H${device.width * .59} Q${device.width * .56} ${device.height - 88} ${device.width * .5} ${device.height - 88} Q${device.width * .44} ${device.height - 88} ${device.width * .41} ${device.height - 126}Z" fill="#7b8490" opacity=".55"/>`
        : device.formFactor === 'desktop'
          ? `<rect x="70" y="70" width="${device.width - 140}" height="${screen.y + screen.height + 270}" rx="${device.radius}" fill="${device.color}" stroke="${device.border}" stroke-width="12"/><rect x="${screen.x - 12}" y="${screen.y - 12}" width="${screen.width + 24}" height="${screen.height + 24}" rx="${screen.radius + 12}" fill="#10151c"/>${screenshot}<rect x="${screen.x}" y="${screen.y}" width="${screen.width}" height="${screen.height}" rx="${screen.radius}" fill="none" stroke="#6c737e" stroke-opacity=".55" stroke-width="4"/><rect x="${device.width * .45}" y="${screen.y + screen.height + 300}" width="${device.width * .1}" height="260" rx="18" fill="${device.border}"/><path d="M${device.width * .34} ${device.height - 80} H${device.width * .66} L${device.width * .72} ${device.height - 20} H${device.width * .28} Z" fill="${device.border}"/>`
          : device.formFactor === 'watch'
            ? `<rect x="${device.width * .36}" y="0" width="${device.width * .28}" height="${screen.y + 30}" rx="44" fill="${device.border}"/><rect x="${device.width * .36}" y="${screen.y + screen.height - 30}" width="${device.width * .28}" height="${device.height - screen.y - screen.height + 30}" rx="44" fill="${device.border}"/><rect x="46" y="46" width="${device.width - 92}" height="${device.height - 92}" rx="${device.radius}" fill="${device.color}" stroke="${device.border}" stroke-width="14"/><rect x="${screen.x - 10}" y="${screen.y - 10}" width="${screen.width + 20}" height="${screen.height + 20}" rx="${screen.radius + 10}" fill="#10151c"/>${screenshot}<rect x="${screen.x}" y="${screen.y}" width="${screen.width}" height="${screen.height}" rx="${screen.radius}" fill="none" stroke="#6c737e" stroke-opacity=".6" stroke-width="4"/><rect x="${device.width - 38}" y="${device.height * .42}" width="32" height="160" rx="16" fill="${device.border}"/>`
            : `<rect x="3" y="3" width="${device.width - 6}" height="${device.height - 6}" rx="${device.radius}" fill="${device.color}" stroke="${device.border}" stroke-width="6"/><rect x="${screen.x - 8}" y="${screen.y - 8}" width="${screen.width + 16}" height="${screen.height + 16}" rx="${screen.radius + 8}" fill="#10151c"/>${screenshot}<rect x="${screen.x}" y="${screen.y}" width="${screen.width}" height="${screen.height}" rx="${screen.radius}" fill="none" stroke="#6c737e" stroke-opacity=".7" stroke-width="3"/>${camera}`;
      const frame = artwork
        ? device.artworkLayer === 'front' ? `${screenshot}${artworkImage}${statusCover}` : `${artworkImage}${screenshot}${device.camera === 'notch' ? '<rect x="334" y="77" width="628" height="145" rx="70" fill="#111"/>' : ''}`
        : genericFrame;
      content = `<svg width="${element.width}" height="${element.height}" viewBox="0 0 ${device.width} ${device.height}" preserveAspectRatio="none"><defs><clipPath id="${id}"><rect x="${screen.x}" y="${screen.y}" width="${screen.width}" height="${screen.height}" rx="${screen.radius}"/></clipPath>${statusZones.length ? `<clipPath id="${statusId}">${statusZones.map(([x, y, width, height]) => `<rect x="${x}" y="${y}" width="${width}" height="${height}"/>`).join('')}</clipPath>` : ''}</defs><g${device.transform ? ` transform="${device.transform}"` : ''}>${frame}</g></svg>`;
      break;
    }
    case 'decoration': {
      const shape = element.decorationId === 'star'
        ? `<path d="M50 3 62 36 97 38 70 60 79 95 50 76 21 95 30 60 3 38 38 36Z" fill="${element.color}"/>`
        : element.decorationId === 'ring'
          ? `<circle cx="50" cy="50" r="39" fill="none" stroke="${element.color}" stroke-width="13"/>`
          : `<path d="M50 0 Q50 50 100 50 Q50 50 50 100 Q50 50 0 50 Q50 50 50 0" fill="${element.color}"/>`;
      content = `<svg width="${element.width}" height="${element.height}" viewBox="0 0 100 100">${shape}</svg>`;
      break;
    }
  }
  return `<g opacity="${element.opacity}" transform="translate(${element.x} ${element.y}) rotate(${element.rotation} ${element.width / 2} ${element.height / 2})">${content}</g>`;
}
