import { DEVICES } from '../domain/devices';
import { layoutText } from './text';
import type { Background, StudioElement } from '../domain/schema';
export const escapeXml = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));
export function backgroundSvg(background: Background, width: number, height: number, id: string, assets: Record<string, string> = {}) {
  if (background.type === 'solid') return `<rect width="${width}" height="${height}" fill="${background.color}"/>`;
  if (background.type === 'gradient') return `<defs><linearGradient id="${id}" x1="0" y1="0.5" x2="1" y2="0.5" gradientTransform="rotate(${background.angle} .5 .5)"><stop stop-color="${background.from}"/><stop offset="1" stop-color="${background.to}"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#${id})"/>`;
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
      content = `<svg width="${element.width}" height="${element.height}" viewBox="0 0 ${device.width} ${device.height}" preserveAspectRatio="none"><defs><clipPath id="${id}"><rect x="${screen.x}" y="${screen.y}" width="${screen.width}" height="${screen.height}" rx="${screen.radius}"/></clipPath></defs><rect x="3" y="3" width="${device.width - 6}" height="${device.height - 6}" rx="${device.radius}" fill="${device.color}" stroke="${device.border}" stroke-width="6"/><g clip-path="url(#${id})"><rect x="${screen.x}" y="${screen.y}" width="${screen.width}" height="${screen.height}" fill="#334155"/>${url ? `<image x="${screen.x}" y="${screen.y}" width="${screen.width}" height="${screen.height}" href="${escapeXml(url)}" preserveAspectRatio="xMidYMid slice"/>` : `<text x="500" y="${device.height / 2}" text-anchor="middle" fill="#cbd5e1" font-family="Arial" font-size="42">Screenshot missing</text>`}</g>${device.camera === 'pill' ? '<rect x="375" y="48" width="250" height="65" rx="32" fill="#0b1018"/>' : device.camera === 'dot' ? '<circle cx="500" cy="74" r="20" fill="#0b1018"/>' : ''}</svg>`;
      break;
    }
    case 'decoration': content = `<path d="M ${element.width / 2} 0 Q ${element.width / 2} ${element.height / 2} ${element.width} ${element.height / 2} Q ${element.width / 2} ${element.height / 2} ${element.width / 2} ${element.height} Q ${element.width / 2} ${element.height / 2} 0 ${element.height / 2} Q ${element.width / 2} ${element.height / 2} ${element.width / 2} 0" fill="${element.color}"/>`; break;
  }
  return `<g opacity="${element.opacity}" transform="translate(${element.x} ${element.y}) rotate(${element.rotation} ${element.width / 2} ${element.height / 2})">${content}</g>`;
}
