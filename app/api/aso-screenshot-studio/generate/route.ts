import { generateProjectContent, GenerationError } from '@/features/aso-screenshot-studio/server/generation';

export const runtime = 'nodejs';
export const maxDuration = 180;

export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: 'Порожній запит.' }, { status: 400, headers });
    const chunks: Uint8Array[] = []; let length = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.length;
      if (length > 512000) { await reader.cancel(); return Response.json({ error: 'Запит завеликий. Скоротіть опис проєкту.' }, { status: 413, headers }); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length); let offset = 0;
    chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.length; });
    return Response.json(await generateProjectContent(JSON.parse(new TextDecoder().decode(bytes))), { headers });
  } catch (error) {
    if (error instanceof GenerationError) return Response.json({ error: error.message }, { status: error.status, headers });
    return Response.json({ error: 'Не вдалося обробити запит генерації.' }, { status: 400, headers });
  }
}
