import type { Guide } from '../../domain/snapping';
export function SnapGuides({ guides, scale }: { guides: Guide[]; scale: number }) {
  return <g pointerEvents="none">{guides.map((g, i) => <line key={i} x1={g.axis === 'x' ? g.value : g.from} y1={g.axis === 'y' ? g.value : g.from} x2={g.axis === 'x' ? g.value : g.to} y2={g.axis === 'y' ? g.value : g.to} stroke={g.kind === 'spacing' ? '#fbbf24' : '#f472b6'} strokeWidth={1 / scale} strokeDasharray={g.kind === 'spacing' ? `${4 / scale} ${3 / scale}` : undefined} />)}</g>;
}
