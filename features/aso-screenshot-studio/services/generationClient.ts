import { validateAudienceResult, validateDeckSpec, validateGenerationPayload, validatePlanResult, type GenerationPayload } from '../domain/generation';

export async function requestGeneration(payload: GenerationPayload, apiKey: string, model: string, signal: AbortSignal) {
  validateGenerationPayload(payload);
  let response: Response;
  try {
    response = await fetch('/api/aso-screenshot-studio/generate', { method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload, apiKey, model }), signal });
  } catch { throw new Error(signal.aborted ? 'Генерацію скасовано.' : 'Немає зв’язку із сервером. Спробуйте ще раз.'); }
  let body: unknown;
  try { body = await response.json(); } catch { throw new Error('Сервер повернув некоректну відповідь.'); }
  if (!response.ok) {
    const error = body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string' ? (body as { error: string }).error : 'Помилка генерації.';
    throw new Error(error);
  }
  if (payload.action === 'audience') return validateAudienceResult(body);
  if (payload.action === 'plan') return validatePlanResult(body);
  return validateDeckSpec(body, payload.slideCount!);
}
