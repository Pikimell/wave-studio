import { localize, LocalizationError } from '@/features/aso-screenshot-studio/server/localization';
export const runtime = 'nodejs';
export const maxDuration = 120;
export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    // Read a bounded body even if Content-Length is absent or misleading.
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: 'Порожній запит.' }, { status: 400, headers });
    const chunks: Uint8Array[] = []; let length = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.length;
      if (length > 256000) { await reader.cancel(); return Response.json({ error: 'Запит завеликий. Зменште кількість тексту.' }, { status: 413, headers }); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length); let offset = 0;
    chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.length; });
    const translations = await localize(JSON.parse(new TextDecoder().decode(bytes)));
    return Response.json({ translations }, { headers });
  } catch (error) {
    if (error instanceof LocalizationError) return Response.json({ error: error.message }, { status: error.status, headers });
    return Response.json({ error: 'Не вдалося обробити запит локалізації.' }, { status: 400, headers });
  }
}
