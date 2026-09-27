import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { loadFonts, persistFont, prepareFont, type StoredFont } from '../services/fontStore';

export type FontMap = Record<string, StoredFont>;
export function useFonts(onError: (message: string) => void) {
  const [fonts, setFonts] = useState<FontMap>({});
  const [version, setVersion] = useState(0);
  const faces = useRef<FontFace[]>([]);
  const live = useRef(true);
  const errorRef = useRef(onError); errorRef.current = onError;
  const add = useCallback(async (font: StoredFont) => {
    const face = new FontFace(font.family, await font.blob.arrayBuffer());
    await face.load();
    if (!live.current) return;
    document.fonts.add(face);
    faces.current.push(face);
    setFonts(current => ({ ...current, [font.family]: font }));
    setVersion(value => value + 1);
  }, []);
  useEffect(() => {
    live.current = true;
    loadFonts().then(stored => Promise.all(stored.map(font => add(font)))).catch(() => errorRef.current('Не вдалося відновити власні шрифти. Завантажте потрібні файли повторно.'));
    return () => {
      live.current = false;
      faces.current.forEach(face => document.fonts.delete(face));
      faces.current = [];
    };
  }, [add]);
  const upload = useCallback(async (file: File) => {
    const font = await prepareFont(file);
    try { await add(font); } catch { throw new Error('Браузер не зміг відкрити цей файл шрифту.'); }
    try { await persistFont(font); } catch { errorRef.current('Шрифт працює лише в цій вкладці: локальне збереження не вдалося.'); }
    return font;
  }, [add]);
  return { fonts, version, upload };
}

export const FontContext = createContext<ReturnType<typeof useFonts>>({ fonts: {}, version: 0, upload: async () => { throw new Error('Шрифти ще не готові.'); } });
export const useFontContext = () => useContext(FontContext);
