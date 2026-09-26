import type { TextElement, TextStyle } from '../domain/schema';
export type MeasureText = (text: string, style: TextStyle) => number;
export interface TextChunk { text: string; style: TextStyle; width: number }
export interface TextLine { chunks: TextChunk[]; width: number; fontSize: number; height: number }
let context: CanvasRenderingContext2D | null = null;
export const measureText: MeasureText = (text, style) => {
  if (!context && typeof document !== 'undefined') context = document.createElement('canvas').getContext('2d');
  if (!context) return Array.from(text).length * style.fontSize * 0.6;
  context.font = `${style.italic ? 'italic' : 'normal'} ${style.fontWeight} ${style.fontSize}px "${style.fontFamily.replace(/["\\]/g, '')}"`;
  return context.measureText(text).width;
};
/** Same measured line layout for canvas, thumbnails and SVG/PNG; manual newlines remain in segments. */
export function layoutText(element: TextElement, measure: MeasureText = measureText) {
  const available = Math.max(1, element.width - element.padding * 2);
  const wraps = element.wrap && element.widthMode === 'fixed';
  const lines: TextLine[] = [];
  let line: TextLine = { chunks: [], width: 0, fontSize: element.style.fontSize, height: element.style.fontSize * element.lineHeight };
  const widthOf = (text: string, style: TextStyle) => Math.max(0, measure(text, style) + Array.from(text).length * element.letterSpacing);
  function newline() {
    lines.push(line);
    line = { chunks: [], width: 0, fontSize: element.style.fontSize, height: element.style.fontSize * element.lineHeight };
  }
  function append(text: string, style: TextStyle) {
    const width = widthOf(text, style);
    line.chunks.push({ text, style, width }); line.width += width;
    line.fontSize = Math.max(line.fontSize, style.fontSize);
    line.height = Math.max(line.height, style.fontSize * element.lineHeight);
  }
  for (const segment of element.segments) {
    const style = { ...element.style, ...segment.style };
    for (const token of segment.text.replace(/\r\n?/g, '\n').split(/(\n|[^\S\n]+)/u).filter(Boolean)) {
      if (token === '\n') { newline(); continue; }
      if (wraps && line.width + widthOf(token, style) > available && line.chunks.length) newline();
      if (wraps && /^\s+$/.test(token) && !line.chunks.length) continue;
      if (wraps && widthOf(token, style) > available) {
        const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(token);
        for (const { segment: char } of graphemes) {
          if (line.width + widthOf(char, style) > available && line.chunks.length) newline();
          append(char, style);
        }
      } else append(token, style);
    }
  }
  newline();
  const contentWidth = Math.max(0, ...lines.map(l => l.width)), contentHeight = lines.reduce((sum, l) => sum + l.height, 0);
  const width = element.widthMode === 'auto' ? Math.max(1, contentWidth + element.padding * 2) : element.width;
  const height = element.heightMode === 'auto' ? Math.max(1, contentHeight + element.padding * 2) : element.height;
  return { lines, width, height, contentWidth, contentHeight,
    overflow: contentWidth > width - element.padding * 2 + 0.5 || contentHeight > height - element.padding * 2 + 0.5 };
}
