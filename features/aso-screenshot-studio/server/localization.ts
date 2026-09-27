import { validatePayload, validateTranslations, type Translation } from '../domain/localization';
import { LOCALIZATION_PROMPT, TRANSLATION_SCHEMA } from './prompts';
export class LocalizationError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function localize(input: unknown, fetcher: typeof fetch = fetch): Promise<Translation[]> {
  if (!input || typeof input !== 'object') throw new LocalizationError('Некоректний запит.', 400);
  const { apiKey, model, payload: raw } = input as Record<string, unknown>;
  if (typeof apiKey !== 'string' || !/^[^\s]{20,512}$/.test(apiKey)) throw new LocalizationError('Вкажіть коректний OpenAI API key.', 400);
  if (typeof model !== 'string' || !/^[a-zA-Z0-9._:-]{1,150}$/.test(model)) throw new LocalizationError('Вкажіть коректний model ID.', 400);
  let payload;
  try { payload = validatePayload(raw); } catch (e) { throw new LocalizationError(e instanceof Error ? e.message : 'Некоректний текст.', 400); }
  if (payload.targetLocales.length !== 1) throw new LocalizationError('Надсилайте кожну цільову мову окремим запитом.', 400);
  let response: Response;
  try {
    response = await fetcher('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(90000),
      body: JSON.stringify({ model, store: false, messages: [{ role: 'system', content: LOCALIZATION_PROMPT }, { role: 'user', content: JSON.stringify(payload) }],
        response_format: { type: 'json_schema', json_schema: { name: 'aso_localization', strict: true, schema: TRANSLATION_SCHEMA } } })
    });
  } catch { throw new LocalizationError('OpenAI не відповідає. Перевірте мережу й спробуйте ще раз.', 502); }
  if (!response.ok) {
    // Never echo upstream messages: they can include parts of a credential or user content.
    const message = response.status === 401 ? 'OpenAI відхилив API key.' : response.status === 429 ? 'Ліміт або баланс OpenAI вичерпано. Спробуйте пізніше.' : response.status === 400 || response.status === 404 ? 'Модель недоступна або не підтримує Structured Outputs. Змініть model ID.' : response.status === 403 ? 'Цей ключ не має доступу до моделі.' : 'Помилка сервісу OpenAI. Спробуйте ще раз.';
    throw new LocalizationError(message, response.status === 429 ? 429 : 502);
  }
  try {
    const body = await response.json();
    const choice = body.choices?.[0];
    if (choice?.finish_reason !== 'stop' || typeof choice.message?.content !== 'string' || choice.message.refusal) throw new Error();
    return validateTranslations(JSON.parse(choice.message.content), payload);
  } catch { throw new LocalizationError('Неповний або некоректний переклад. Жодна група не змінена. Спробуйте іншу модель або менше мов.', 502); }
}
