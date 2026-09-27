import { validatePayload, validateTranslations, type LocalizationPayload, type Translation } from '../domain/localization';
export async function requestLocalization(payload: LocalizationPayload, apiKey: string, model: string, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<Translation[]> {
  const validated = validatePayload(payload);
  const translations: Translation[] = [];
  for (const locale of validated.targetLocales) {
    if (signal.aborted) throw new Error('Локалізацію скасовано.');
    const singleLocalePayload = { ...validated, targetLocales: [locale] };
    let response: Response;
    try {
      response = await fetcher('/api/aso-screenshot-studio/localize', { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload: singleLocalePayload, apiKey, model }), signal });
    } catch { throw new Error(signal.aborted ? 'Локалізацію скасовано.' : 'Немає зв’язку із сервером. Спробуйте ще раз.'); }
    const body = await response.json();
    if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Помилка локалізації.');
    translations.push(...validateTranslations(body, singleLocalePayload));
  }
  return validateTranslations({ translations }, validated);
}
