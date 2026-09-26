# Wave Studio

Генератор багатошарових хвилястих фонів. Налаштуйте розмір полотна, основний колір і кожну хвилю окремо. Кожну хвилю можна зміщувати по X на ±100% ширини полотна; частота доступна до 80×. Результат можна завантажити як PNG або SVG. У шапці є перемикач світлої та темної теми.

## Запуск

У папці проєкту встановіть залежності та запустіть Next.js dev server:

```sh
npm install
npm run dev
```

Відкрийте `http://localhost:3000` у браузері. Налаштування автоматично зберігаються в браузері.

Розміри полотна: від 256 до 12 000 px на сторону. PNG підтримує полотна до 80 млн пікселів; для більших розмірів використовуйте SVG.

## Архітектура

Проєкт перенесено на Next.js App Router. Основна логіка розділена так:

- `app/` — Next.js layout, сторінка та глобальні стилі.
- `features/wave-studio/components/` — UI-компоненти редактора.
- `features/wave-studio/domain/` — типи, константи, генерація SVG і доменна математика.
- `features/wave-studio/hooks/` — стан редактора, тема, toast і підгонка превʼю.
- `features/wave-studio/services/` — експорт PNG/SVG.

## API

`POST /api` генерує файл із JSON-налаштувань і повертає `image/svg+xml` або `image/png`.

```json
{
  "format": "png",
  "width": 1920,
  "height": 640,
  "background": "#EAF5FF",
  "waves": [
    {
      "color": "random",
      "type": "fill",
      "position": 70,
      "amplitude": "random",
      "frequency": 2.2,
      "offset": 0,
      "opacity": 88,
      "seed": "random"
    }
  ]
}
```

Для властивостей хвилі `color`, `type`, `position`, `amplitude`, `frequency`, `offset`, `opacity`, `seed` можна передати `"random"`. `format` підтримує `svg` і `png`.
