import { validateAudienceResult, validateDeckSpec, validateGenerationPayload, validatePlanResult } from '../domain/generation';
import { AUDIENCE_PROMPT, AUDIENCE_SCHEMA, PLAN_PROMPT, PLAN_SCHEMA, SLIDES_PROMPT, SLIDES_SCHEMA } from './generationPrompts';

export class GenerationError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function generateProjectContent(input: unknown, fetcher: typeof fetch = fetch) {
  if (!input || typeof input !== 'object') throw new GenerationError('Некоректний запит.', 400);
  const { apiKey, model, payload: raw } = input as Record<string, unknown>;
  if (typeof apiKey !== 'string' || !/^[^\s]{20,512}$/.test(apiKey)) throw new GenerationError('Вкажіть коректний OpenAI API key.', 400);
  if (typeof model !== 'string' || !/^[a-zA-Z0-9._:-]{1,150}$/.test(model)) throw new GenerationError('Вкажіть коректний model ID.', 400);
  let payload;
  try { payload = validateGenerationPayload(raw); }
  catch (error) { throw new GenerationError(error instanceof Error ? error.message : 'Некоректні дані проєкту.', 400); }
  const config = payload.action === 'audience'
    ? { prompt: AUDIENCE_PROMPT, schema: AUDIENCE_SCHEMA, name: 'aso_audience_brief' }
    : payload.action === 'plan'
      ? { prompt: PLAN_PROMPT, schema: PLAN_SCHEMA, name: 'aso_slide_plan' }
      : { prompt: SLIDES_PROMPT, schema: SLIDES_SCHEMA, name: 'aso_slide_group' };
  let response: Response;
  try {
    response = await fetcher('https://api.openai.com/v1/chat/completions', {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(120000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, store: false, temperature: 0.7,
        messages: [{ role: 'system', content: config.prompt }, { role: 'user', content: JSON.stringify(payload) }],
        response_format: { type: 'json_schema', json_schema: { name: config.name, strict: true, schema: config.schema } } })
    });
  } catch { throw new GenerationError('OpenAI не відповідає. Перевірте мережу й спробуйте ще раз.', 502); }
  if (!response.ok) {
    const message = response.status === 401 ? 'OpenAI відхилив API key.'
      : response.status === 429 ? 'Ліміт або баланс OpenAI вичерпано. Спробуйте пізніше.'
      : response.status === 400 || response.status === 404 ? 'Модель недоступна або не підтримує Structured Outputs. Змініть model ID.'
      : response.status === 403 ? 'Цей ключ не має доступу до моделі.' : 'Помилка сервісу OpenAI. Спробуйте ще раз.';
    throw new GenerationError(message, response.status === 429 ? 429 : 502);
  }
  try {
    const body = await response.json();
    const choice = body.choices?.[0];
    if (choice?.finish_reason !== 'stop' || typeof choice.message?.content !== 'string' || choice.message.refusal) throw new Error();
    const json = JSON.parse(choice.message.content);
    if (payload.action === 'audience') return validateAudienceResult(json);
    if (payload.action === 'plan') return validatePlanResult(json);
    return validateDeckSpec(json, payload.slideCount!);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('OpenAI має повернути')) throw new GenerationError(error.message, 502);
    throw new GenerationError('OpenAI повернув неповний або некоректний результат. Дані проєкту не змінено.', 502);
  }
}
