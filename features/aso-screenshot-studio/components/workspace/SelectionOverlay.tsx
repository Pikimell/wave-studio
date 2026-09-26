import type { PointerEvent } from 'react';
import type { StudioElement } from '../../domain/schema';
import type { ResizeCorner } from '../../domain/geometry';
export type GestureMode = 'move' | 'rotate' | ResizeCorner;
export function SelectionOverlay({ element, scale, onStart }: { element: StudioElement; scale: number; onStart: (event: PointerEvent<SVGElement>, mode: GestureMode) => void }) {
  const size = 8 / scale;
  return <g transform={`translate(${element.x} ${element.y}) rotate(${element.rotation} ${element.width / 2} ${element.height / 2})`}>
    <rect width={element.width} height={element.height} fill="transparent" stroke="#a3e635" strokeWidth={1.5 / scale} style={{ cursor: 'move' }} onPointerDown={e => onStart(e, 'move')} />
    <path d={`M ${element.width / 2} 0 v ${-26 / scale}`} stroke="#a3e635" strokeWidth={1 / scale} pointerEvents="none" />
    <circle cx={element.width / 2} cy={-26 / scale} r={5 / scale} fill="#a3e635" style={{ cursor: 'grab' }} onPointerDown={e => onStart(e, 'rotate')} />
    {(['nw', 'ne', 'sw', 'se'] as const).map(corner => <rect key={corner} x={(corner.endsWith('e') ? element.width : 0) - size / 2} y={(corner.startsWith('s') ? element.height : 0) - size / 2} width={size} height={size} fill="#18232f" stroke="#a3e635" strokeWidth={1 / scale} style={{ cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize' }} onPointerDown={e => onStart(e, corner)} />)}
  </g>;
}
