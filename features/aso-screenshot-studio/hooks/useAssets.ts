import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { BUILTIN_BACKGROUNDS } from '../domain/backgrounds';
import { loadAssets, persistAsset, prepareAsset, type StoredAsset } from '../services/assetStore';
export interface LocalAsset extends StoredAsset { url: string }
export type AssetMap = Record<string, LocalAsset>;
export function useAssets(onError: (message: string) => void) {
  const [assets, setAssets] = useState<AssetMap>({});
  const live = useRef(true), urls = useRef<string[]>([]);
  const errorRef = useRef(onError); errorRef.current = onError;
  const add = useCallback((asset: StoredAsset) => {
    const url = URL.createObjectURL(asset.blob); urls.current.push(url);
    setAssets(current => ({ ...current, [asset.id]: { ...asset, url } }));
  }, []);
  useEffect(() => {
    live.current = true;
    let cancelled = false;
    for (const background of BUILTIN_BACKGROUNDS) {
      fetch(background.url).then(async response => {
        if (!response.ok) throw new Error('Фон недоступний');
        const blob = await response.blob();
        if (!cancelled) add({ id: background.id, name: background.name, mimeType: 'image/svg+xml', width: background.width, height: background.height, blob });
      }).catch(() => { /* A missing built-in is reported by preflight if used. */ });
    }
    loadAssets().then(stored => { if (!cancelled) stored.forEach(add); }).catch(() => {
      if (!cancelled) errorRef.current('Сховище зображень недоступне. Нові файли працюватимуть до закриття вкладки.');
    });
    return () => { cancelled = true; live.current = false; urls.current.forEach(URL.revokeObjectURL); urls.current = []; };
  }, [add]);
  const upload = useCallback(async (file: File) => {
    const asset = await prepareAsset(file);
    if (!live.current) throw new Error('Редактор закрито.');
    add(asset);
    try { await persistAsset(asset); } catch { errorRef.current('Зображення доступне лише в цій вкладці: локальне збереження не вдалося. Після reload завантажте файл повторно.'); }
    return asset;
  }, [add]);
  return { assets, upload };
}

export const AssetContext = createContext<{ assets: AssetMap; urls: Record<string, string>; upload: (file: File) => Promise<StoredAsset> }>({ assets: {}, urls: {}, upload: async () => { throw new Error('Сховище ще не готове'); } });
export const useAssetContext = () => useContext(AssetContext);
