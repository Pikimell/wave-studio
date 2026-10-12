# Wave Studio

Демо: [wave-studio-beta.vercel.app](https://wave-studio-beta.vercel.app)

Wave Studio — візуальний редактор багатошарових хвилястих фонів і композицій для App Store screenshots. Можна налаштовувати полотно, кольори, геометрію хвиль, теми та експортувати PNG або SVG.

## Запуск

```sh
npm install
npm run dev
```

Відкрийте `http://localhost:3000`. Налаштування зберігаються у браузері.

## Архітектура та API

UI розташований у `features/wave-studio/components`, доменна логіка — у `domain`, стан — у `hooks`, експорт — у `services`. `POST /api` приймає JSON-налаштування і повертає SVG або PNG.

## ASO Screenshot Studio

Сторінка `/aso-screenshot-studio` підтримує проєкти, шаблони, слайди, текст, зображення, пристрої, undo/redo, PNG/ZIP-експорт та необов’язкову локалізацію через OpenAI. Дані зберігаються локально у браузері.

Ліцензія: [PolyForm Noncommercial License 1.0.0](./LICENSE.md). Англійська версія за замовчуванням: [README.md](README.md).
