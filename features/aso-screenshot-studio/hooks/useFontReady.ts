import { useEffect, useState } from 'react';
import type { StudioElement } from '../domain/schema';
import { useFontContext } from './useFonts';

export function useFontReady(elements: StudioElement[]) {
  const { version: libraryVersion } = useFontContext();
  const families = [...new Set(elements.flatMap(element => element.type === 'text' ? [element.style.fontFamily, ...element.segments.map(segment => segment.style.fontFamily).filter((font): font is string => !!font)] : []))].sort().join('|');
  const [version, refresh] = useState(0);
  useEffect(() => {
    if (!families) return;
    let active = true;
    Promise.all(families.split('|').map(font => document.fonts.load(`400 16px "${font}"`, 'Aa ЯЇЄ'))).then(() => {
      if (active) refresh(value => value + 1);
    }).catch(() => { /* Export preflight reports unsupported fonts. */ });
    return () => { active = false; };
  }, [families, libraryVersion]);
  return version;
}
