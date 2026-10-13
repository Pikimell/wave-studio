# Wave Studio

> Visual editor for layered wave backgrounds and App Store screenshot compositions, with PNG/SVG export and an image-generation API.

![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![SVG](https://img.shields.io/badge/SVG-FFB13B?logo=svg&logoColor=black)

**Live demo:** [wave-studio-beta.vercel.app](https://wave-studio-beta.vercel.app)

Configure the canvas, colors, wave geometry, themes, and export the result as PNG or SVG.

## Getting started

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. Settings are stored in the browser.

## Architecture

- `app/` — Next.js App Router, layout, page, and global styles.
- `features/wave-studio/components/` — editor UI.
- `features/wave-studio/domain/` — types, constants, SVG generation, and domain math.
- `features/wave-studio/hooks/` — editor state, theme, toast, and preview sizing.
- `features/wave-studio/services/` — PNG/SVG export.

## API

`POST /api` accepts JSON settings and returns `image/svg+xml` or `image/png`. The API supports canvas dimensions, background, wave type, position, amplitude, frequency, offset, opacity, and seed.

## ASO Screenshot Studio

Open `/aso-screenshot-studio` to create screenshot projects from blank documents, templates, or local copies. Projects are stored in browser `localStorage`; uploaded images and fonts use IndexedDB. JSON export does not contain images or API keys.

The editor supports platform groups, slides, text, images, shapes, devices, undo/redo, PNG export, ZIP export, and optional in-memory OpenAI localization.

## License

The code is available under the [PolyForm Noncommercial License 1.0.0](./LICENSE.md). Commercial use requires written permission.

Ukrainian documentation: [README-uk.md](README-uk.md).

## Author

**Volodymyr Pashchenko**, Full-stack Developer · [GitHub](https://github.com/Pikimell) · [LinkedIn](https://www.linkedin.com/in/pashchenko-v-r)
