import { validatePayload, validateTranslations, type LocalizationPayload } from '../domain/localization';
export async function requestLocalization(payload: LocalizationPayload, apiKey: string, model: string, signal: AbortSignal) {
  validatePayload(payload);
  let response: Response;
  try {
    response = await fetch('/api/aso-screenshot-studio/localize', { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload, apiKey, model }), signal });
  } catch { throw new Error(signal.aborted ? 'Локалізацію скасовано.' : 'Немає зв’язку із сервером. Спробуйте ще раз.'); }
  const body = await response.json();
  if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Помилка локалізації.');
  return validateTranslations(body, payload);
}
