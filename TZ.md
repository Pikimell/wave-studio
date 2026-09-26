# ASO Screenshot Studio --- Product Description / Technical Specification

> Робоча назва документа: **Description.md**\
> Статус: детально зафіксована концепція після продуктового
> обговорення.\
> Основна аудиторія: indie-розробники, vibe-coders та невеликі команди,
> яким потрібно швидко створювати ASO-скріншоти для App Store / Google
> Play без Figma, Photoshop та складного 3D-процесу.

---

## 1. Ідея продукту

Продукт --- це вебзастосунок або macOS-застосунок для створення серій
ASO-скріншотів.

Основна проблема, яку він вирішує: сьогодні для створення якісних App
Store / Google Play скріншотів розробнику часто потрібно:

- знати актуальні розміри скріншотів;
- створювати правильні фрейми у Figma;
- шукати mockup потрібного пристрою;
- вставляти screenshot застосунку в mockup;
- окремо готувати композицію;
- вручну адаптувати дизайн під інші розміри;
- вручну перекладати тексти для інших локалізацій;
- вручну експортувати кожен слайд.

Продукт має перетворити цей процес на спеціалізований редактор,
орієнтований саме на ASO.

Редактор концептуально нагадує спрощену Figma, але не намагається бути
універсальним графічним редактором.

---

## 2. Ключові принципи

1.  **ASO-first.** Усі сутності, пресети, експорт і workflow
    оптимізовані для store screenshots.
2.  **Простота.** Значно менше інструментів, ніж у Figma.
3.  **Групова композиція.** Елементи належать не окремим слайдам, а
    групі й можуть одночасно перетинати декілька слайдів.
4.  **Структурованість.** Увесь дизайн повинен мати чітку object model і
    бути серіалізованим у JSON.
5.  **AI/MCP-ready.** У майбутньому проєктом має бути можливо керувати
    через MCP, ChatGPT, Codex або інший агент.
6.  **Localization-first.** Готову композицію можна швидко дублювати на
    інші мови.
7.  **Pixel-accurate export.** Незалежно від zoom у редакторі, експорт
    відбувається у фактичному розмірі групи.

---

# 3. Основні сутності

## 3.1 Project

Project --- найвищий рівень структури.

Приклад:

```text
Wave Studio
```

Проєкт містить:

- `id`;
- `name`;
- набір `groups`;
- метадані;
- версію формату JSON;
- за потреби глобальні налаштування.

Назва проєкту використовується під час експорту.

---

## 3.2 Group

Group --- окремий набір ASO-слайдів однакового розміру та однієї
локалізації.

Наприклад:

```text
Wave Studio
├── iPhone / English / A
├── iPhone / Ukrainian / A
├── iPhone / English / B
├── Google Play / English
└── ...
```

Група повинна містити щонайменше:

- `id`;
- `name`;
- platform/preset;
- ширину слайда;
- висоту слайда;
- locale;
- optional prefix/version/variant;
- gap між слайдами;
- кількість та порядок слайдів;
- список елементів;
- налаштування групового background;
- локальні backgrounds слайдів;
- інші group-level settings.

### Важливий принцип

**Елементи не належать окремим слайдам. Вони належать групі.**

Слайди визначають області, які:

- відображають частини композиції;
- використовуються для snapping;
- використовуються для експорту.

Це дозволяє одному mockup або іншому елементу починатися на першому
слайді та продовжуватися на другому чи третьому.

---

## 3.3 Slide

Slide --- окрема експортована область усередині групи.

Усі слайди однієї групи мають однаковий розмір.

Слайд має:

- `id`;
- `order`;
- локальний background;
- padding top/right/bottom/left;
- інші slide-level properties.

Кількість слайдів не обмежена штучним лімітом.

---

## 3.4 Element

Element --- об'єкт, розташований у координатному просторі групи.

Базові властивості:

```json
{
  "id": "element-id",
  "type": "text",
  "x": 120,
  "y": 240,
  "width": 800,
  "height": 300,
  "rotation": 0,
  "zIndex": 5
}
```

Координати зберігаються у фактичних пікселях, а не у координатах zoomed
UI.

---

# 4. Створення проєкту

Користувач натискає **Create Project**.

Після створення він одразу потрапляє в основний workspace.

Не потрібно примушувати його перед входом у редактор проходити довгий
wizard з вибором App Store / Google Play.

Групи створюються вже безпосередньо у workspace.

---

# 5. Workspace

Основний екран складається приблизно з:

```text
┌──────────────────────────────────────────────────────┐
│ Top toolbar                                          │
├────────────┬─────────────────────────────┬───────────┤
│ Elements   │                             │ Inspector │
│ / Assets   │          Workspace          │           │
│ sidebar    │                             │           │
│            │                             │           │
├────────────┴─────────────────────────────┴───────────┤
│ Collapsible Group Preview Panel                      │
└──────────────────────────────────────────────────────┘
```

### Центральна область

Центральний workspace:

- вертикально містить багато груп;
- може скролитися вниз;
- кожна група горизонтально містить необмежену кількість слайдів;
- група може мати горизонтальний scroll.

Таким чином користувач бачить:

```text
GROUP 1
[slide 1] gap [slide 2] gap [slide 3] ...

GROUP 2
[slide 1] gap [slide 2] gap [slide 3] ...

GROUP 3
...
```

---

# 6. Створення групи

У workspace є команда **Add Group**.

Користувач обирає preset/розмір.

Пресети повинні бути згруповані за платформою, щоб список залишався
зрозумілим:

- App Store;
- Google Play;
- надалі інші store/platform presets.

Preset визначає width/height слайда.

Група також отримує:

- locale;
- optional prefix;
- gap;
- назву/ідентифікатор.

---

# 7. Gap між слайдами

Між фізичними слайдами у редакторі існує порожній gap.

Наприклад:

```text
slide width = 500 px
gap = 30 px
slides = 5
```

Ширина розташування:

```text
5 × 500 + 4 × 30 = 2620 px
```

Тобто gap існує тільки **між** сусідніми слайдами.

Gap:

- не є частиною жодного слайда;
- не експортується;
- візуально є порожнім простором;
- не показує контент, що проходить через нього.

Приклад:

```text
┌────────────┐       ┌────────────┐
│  slide 1   │ GAP   │  slide 2   │
└────────────┘       └────────────┘
```

Якщо великий елемент перетинає обидва слайди, частина елемента в gap не
рендериться.

Візуально це схоже на одну композицію, яку видно через окремі "вікна"
слайдів.

---

# 8. Coordinate system

Усі елементи мають координати в просторі групи.

X/Y можна редагувати:

- drag-and-drop на canvas;
- числовими полями в Inspector.

Обидва способи синхронізовані.

При переміщенні мишкою Inspector оновлюється.

При зміні X/Y у Inspector елемент одразу рухається.

Елемент дозволено частково або повністю винести за межі слайдів.

Позаслайдова область може використовуватись як робоча зона.

---

# 9. Selection

При виборі елемента:

- навколо нього показується selection frame;
- елемент можна рухати;
- resize handles дозволяють змінювати розмір;
- у правому Inspector відображаються його властивості.

---

# 10. Multi-selection

Потрібно підтримувати вибір декількох елементів.

При multi-select:

- **не створюється одна спільна рамка**;
- кожен вибраний елемент має власну selection frame;
- Inspector показує спільні властивості.

Наприклад, якщо вибрано три text elements, користувач може одночасно
змінити:

- font;
- font size;
- color;
- інші властивості, які підтримують усі вибрані елементи.

Якщо значення різні, Inspector повинен відображати mixed state.

---

# 11. Copy / Paste / Duplicate

Підтримуються:

```text
Cmd + C
Cmd + V
```

При paste:

1.  якщо курсор миші знаходиться над валідною canvas/slide area ---
    елемент вставляється біля позиції курсора;
2.  якщо курсор поза canvas --- копія вставляється поруч з оригіналом.

Копія отримує новий ID.

Для device mockup копіюється також прив'язаний screenshot.

Можна також передбачити `Cmd + D` як shortcut duplicate.

---

# 12. Z-order

Повноцінна Layers panel у першій версії не потрібна.

Для вибраного елемента достатньо команд:

- Bring Forward;
- Send Backward;
- за потреби Bring to Front;
- Send to Back.

У JSON порядок повинен бути детермінований через `zIndex` або порядок у
render stack.

---

# 13. Snapping

Потрібен snapping до:

- лівого/правого краю слайда;
- верхнього/нижнього краю;
- горизонтального центру слайда;
- вертикального центру;
- padding/safe-area guides;
- країв інших елементів;
- центрів інших елементів.

Під час snapping показуються тонкі smart guides.

Також потрібні guides для однакових відступів між елементами.

---

# 14. Slide padding / safe area

Кожен слайд має:

- top;
- right;
- bottom;
- left padding.

Значення задаються вручну.

В Inspector можна додати link/unlink control:

- linked → одне значення для всіх сторін;
- unlinked → кожна сторона незалежна.

Автоматичні platform-safe-area presets на цьому етапі не потрібні.

Padding використовується для guides/snapping.

---

# 15. Zoom

Не потрібен довільний плавний zoom.

Підтримуються presets:

- 25%;
- 50%;
- 75%;
- 100%;
- 125%;
- 150%;
- 200%.

Zoom застосовується до workspace, але не змінює фактичні координати чи
export resolution.

Опорна точка zoom --- центр поточної видимої області.

Pan через Space + Drag не потрібен.

Навігація:

- вертикальний scroll;
- горизонтальний scroll.

---

# 16. Preview Panel

У нижній частині workspace знаходиться collapsible preview panel.

Вона:

- має фіксовану висоту;
- може бути collapsed/expanded;
- показує тільки **поточну вибрану групу**;
- показує всі слайди групи поруч у маленькому масштабі.

Приклад:

```text
[01] [02] [03] [04] [05] [06] ...
```

Це дозволяє побачити всю композицію, навіть коли основний workspace
показує лише її частину.

### Оновлення preview

Preview не потрібно перерендерювати на кожен mouse move.

Використовується debounce приблизно **5 секунд**.

Поки користувач активно працює --- відображається попереднє preview.

Після \~5 секунд без змін система генерує нове.

Бажано дозволити click на thumbnail, щоб перейти до відповідного слайда.

---

# 17. Типи елементів

На поточному етапі заплановано щонайменше:

1.  Text;
2.  Device Mockup;
3.  Image;
4.  Shape;
5.  Decorative Asset.

---

# 18. Text Element

Text --- один з найважливіших елементів.

Основні властивості:

- content;
- x;
- y;
- width;
- height;
- rotation;
- font family;
- font size;
- font weight;
- font style;
- text color;
- horizontal alignment;
- vertical alignment;
- line height;
- letter spacing;
- background (опційно);
- padding (за потреби);
- z-index;
- wrap/no-wrap;
- width sizing mode;
- height sizing mode.

---

# 19. Text sizing

Width і Height мають незалежні режими.

Наприклад:

```text
Width:  Fixed / Auto
Height: Fixed / Auto
```

Це дозволяє:

### Auto / Auto

Блок повністю адаптується до контенту.

### Fixed width / Auto height

Ширина незмінна.

Текст переноситься, а блок росте вниз.

### Fixed width / Fixed height

Текст обмежений заданою областю.

Overflow обрізається.

### No-wrap

Окрема опція.

При `no-wrap` текст не переноситься автоматично.

---

# 20. Manual line breaks

Ручні переноси рядків, задані користувачем, повинні зберігатися.

Автоматичний wrapping може існувати через width constraint, але explicit
newline має залишатися explicit newline.

Це особливо важливо при localization.

---

# 21. Rich Text

Один text element повинен підтримувати різне форматування всередині
одного блоку.

Наприклад:

```text
Track your reading
LIKE NEVER BEFORE
```

Окремий fragment може мати:

- color;
- font family;
- font weight;
- italic;
- інші text style overrides.

Тобто не потрібно створювати окремий element лише через інший колір
одного слова.

---

# 22. Rich Text data model

Рекомендована модель:

```json
{
  "type": "text",
  "content": "Track your reading like never before",
  "runs": [
    {
      "id": "run-1",
      "start": 0,
      "end": 19,
      "style": {
        "fontWeight": 400,
        "color": "#FFFFFF"
      }
    },
    {
      "id": "run-2",
      "start": 19,
      "end": 36,
      "style": {
        "fontWeight": 700,
        "color": "#55A7FF"
      }
    }
  ]
}
```

Реальна реалізація може використовувати spans/segments замість
start/end, якщо це спростить localization.

---

# 23. Device Mockup

Device Mockup --- спеціалізований елемент, а не звичайне зображення.

Властивості:

- device/model;
- mockup variant/angle;
- x/y;
- width/height;
- rotation;
- z-index;
- screenshot reference.

Не потрібно будувати повноцінний 3D editor.

Краще мати набір заздалегідь підготовлених device variants/angles.

Користувач:

1.  додає Device Mockup;
2.  вибирає його;
3.  у Inspector натискає **Upload Screenshot**;
4.  screenshot автоматично вставляється в область екрану пристрою.

---

# 24. Screenshot behaviour

Screenshot:

- прив'язаний до конкретного device element;
- автоматично підганяється під screen mask;
- не потребує ручного crop/pan editor;
- при копіюванні device element копіюється разом з ним.

Кожен device element має власний screenshot.

---

# 25. Shapes і Decorative Assets

Ліва панель може містити бібліотеку підготовлених assets:

- shapes;
- decorative elements;
- blobs;
- gradients/images;
- інші reusable graphics.

Ці assets готуються власником сервісу й доступні користувачу як
бібліотека.

Після додавання asset стає звичайним element з позицією, розміром,
rotation і z-order.

---

# 26. Background architecture

Існує два рівні background:

1.  Group Background;
2.  Slide Background.

## Group Background

Фон застосовується до композиції всієї групи.

## Slide Background

Конкретний слайд може мати власний background.

Правило:

> Slide Background завжди перекриває Group Background.

Прозорий overlay між ними як основний сценарій не потрібен.

---

# 27. Background scope

Для background потрібні два режими:

### Whole Group

Background розраховується як одна композиція через всю групу.

Наприклад, gradient може починатися на першому слайді та завершуватися
на останньому.

### Repeat Per Slide

Один і той самий background окремо рендериться для кожного слайда.

Наприклад, gradient:

```text
slide 1: blue → cyan
slide 2: blue → cyan
slide 3: blue → cyan
```

замість одного довгого gradient на всі три.

---

# 28. Background types

Потрібно підтримати:

- solid color;
- gradient;
- predefined image;
- user-uploaded image.

Для image background достатньо двох scaling modes:

### Stretch

Зображення непропорційно розтягується точно до потрібної області.

### Cover

Зберігається aspect ratio, область повністю заповнюється, зайві частини
обрізаються.

Ручний pan/zoom background не потрібен.

---

# 29. Add / Insert Slide

Користувач може додавати необмежену кількість слайдів.

Якщо новий slide вставляється **посередині** групи:

- усі елементи, що знаходяться праворуч від insertion point,
  зміщуються вправо;
- offset дорівнює `slideWidth + gap`.

Це зберігає існуючу композицію правої частини.

---

# 30. Delete Slide

При видаленні:

- контент, що належить видаленій області, видаляється;
- усі елементи після неї зсуваються вліво на `slideWidth + gap`.

Для елементів, що перетинають видалений slide, погоджено просте
прогнозоване правило:

> якщо element заходить у видалений slide, видаляється весь element.

Ця дія повинна підтримувати Undo.

---

# 31. Reorder Slides

Слайди можна переставляти.

При reorder слайд переноситься разом з контентом, який логічно йому
належить.

Через те, що element може перетинати кілька слайдів, потрібен алгоритм
ownership.

---

# 32. Element ownership algorithm

Для кожного element обчислюється площа його перетину з кожним slide.

Наприклад:

```text
slide 2 → 70%
slide 3 → 30%
```

Element належить slide 2.

При reorder він рухається разом зі slide 2.

Якщо площа:

```text
50% / 50%
```

tie-break визначається за позицією центру element.

Елементи, які повністю знаходяться поза всіма слайдами, під час reorder
залишаються на місці.

---

# 33. Background при reorder

- Group Background не переміщується.
- Slide Background переміщується разом зі slide.

---

# 34. Undo / Redo

Повноцінна history panel не потрібна.

Потрібно підтримувати приблизно **10 останніх логічних операцій**.

Shortcuts:

```text
Cmd + Z
Cmd + Shift + Z
```

Кожна логічна дія --- один history step.

Наприклад:

- move;
- resize;
- delete;
- add;
- paste;
- change property;
- reorder slide.

При drag не потрібно записувати сотні проміжних координат --- у history
зберігається завершена операція.

---

# 35. Deleted assets та history

Якщо element видалено, його дані/asset не можна одразу фізично
знищувати, якщо дія ще доступна через Undo.

Потрібно:

1.  тримати потрібний state/resource у history;
2.  коли operation випадає з history limit --- ресурс можна очистити,
    якщо він більше ніде не використовується.

---

# 36. Project persistence

Основний переносний формат проєкту --- JSON.

Користувач може:

- Save Project → отримати `.json`;
- Open/Import Project → вибрати JSON і відновити проєкт.

JSON повністю описує:

- project;
- groups;
- slides;
- positions;
- dimensions;
- text;
- styling;
- backgrounds, якщо це не binary user asset;
- device definitions;
- locale;
- prefix;
- z-order;
- усі інші serializable settings.

---

# 37. User screenshots у JSON

Користувацькі screenshots **не потрібно embed-ити як binary/base64 у
JSON**.

JSON повинен містити структуру та reference/placeholder.

Після import, якщо локальний asset відсутній, device може показати
placeholder:

```text
Screenshot missing
[ Upload Screenshot ]
```

Після натискання користувач заново підставляє потрібний screenshot.

Це дозволяє JSON залишатися:

- маленьким;
- читабельним;
- зручним для version control;
- придатним для AI/MCP.

---

# 38. Localization

Localization --- одна з ключових функцій.

Group має конкретну locale.

Наприклад:

```text
iPhone / English
```

Користувач натискає **Localize**.

Відкривається modal із мовами:

```text
☑ Ukrainian
☑ Czech
☑ Polish
☐ German
...
```

Після підтвердження система:

1.  збирає всі text elements групи;
2.  зберігає структуру/IDs;
3.  відправляє тексти AI translation layer;
4.  отримує переклад;
5.  створює копію group для кожної target locale;
6.  зберігає весь дизайн;
7.  замінює лише text content.

---

# 39. Localization і layout

Після localization система **не повинна автоматично**:

- зменшувати font size;
- змінювати width;
- перебудовувати layout;
- намагатися "виправити" overflow.

Користувач сам переглядає локалізовану групу й адаптує дизайн.

Це робить поведінку прогнозованою.

---

# 40. Localization Rich Text

Rich Text formatting потрібно зберігати.

Якщо source має виділений fragment, переклад повинен зберегти логічне
виділення.

Наприклад:

```text
Read MORE
```

після localization потрібне не форматування символів 5--9, а
форматування семантично відповідного перекладеного fragment.

Тому для AI translation бажано використовувати stable markers / segment
IDs.

Наприклад:

```json
{
  "segments": [
    {
      "id": "segment-normal",
      "text": "Read "
    },
    {
      "id": "segment-highlight",
      "text": "MORE"
    }
  ]
}
```

AI перекладає текст кожного segment, але ID не змінює.

Це дозволяє повторно застосувати styling.

---

# 41. Localization і line breaks

Explicit manual line breaks потрібно максимально зберігати.

Їх бажано передавати як структурні markers, а не покладатися лише на
`\n` у plain text.

Auto-wrap визначається layout engine.

---

# 42. Group duplication

Потрібна команда **Duplicate Group**.

Вона копіює:

- slides;
- elements;
- text;
- styles;
- backgrounds;
- device mockups;
- screenshot references/assets, якщо доступні;
- locale;
- settings.

Нова група отримує нові IDs.

---

# 43. A/B Tests

Group duplication потрібен, зокрема, для A/B testing.

Група має optional prefix/variant.

Наприклад:

```text
A
B
Test-21
Version-21
Concept-A
```

Таким чином можна мати:

```text
Wave Studio / iPhone / EN / A
Wave Studio / iPhone / EN / B
```

---

# 44. Export Group

На рівні Group є кнопка **Export**.

Для основного workflow не потрібен додатковий dialog.

Один клік:

1.  render кожного slide у фактичній resolution;
2.  створення PNG;
3.  пакування всіх PNG у ZIP;
4.  download ZIP.

Формат для MVP:

```text
PNG
```

Без вибору JPEG/quality.

---

# 45. Export Single Slide

Якщо вибрано конкретний slide, у його Inspector внизу є:

**Export Slide**

Результат:

```text
single PNG
```

---

# 46. Export naming

Повна інформація краще зберігається в назві ZIP.

Наприклад:

```text
Wave-Studio_A_iPhone_EN.zip
```

або:

```text
Wave-Studio_v21_iPhone_UK.zip
```

PNG всередині можуть мати короткі імена:

```text
A_EN_01.png
A_EN_02.png
A_EN_03.png
```

Якщо prefix відсутній:

```text
EN_01.png
EN_02.png
EN_03.png
```

Нумерація завжди автоматична відповідно до порядку слайдів.

Ручні назви слайдів не потрібні.

---

# 47. Inspector architecture

Правий Inspector залежить від selection.

## Нічого не вибрано

Можна показувати group settings або neutral state.

## Вибрана Group

Показати:

- group name;
- preset;
- dimensions;
- locale;
- prefix;
- gap;
- background;
- duplicate;
- localize;
- export.

## Вибраний Slide

Показати:

- width/height read-only;
- padding;
- local background;
- export slide;
- delete slide;
- інші slide settings.

## Вибраний Text

Показати text properties.

## Вибраний Device

Показати:

- model;
- variant;
- x/y;
- size;
- rotation;
- screenshot upload/change;
- z-order.

## Multi-selection

Показати common properties та mixed values.

---

# 48. Left Sidebar

Ліва панель --- джерело елементів/assets.

Можливі секції:

```text
Text
Devices
Images
Shapes
Decorations
Uploads
```

Звідси element додається до активної group.

---

# 49. Group actions

Біля/у header кожної Group потрібні щонайменше:

- locale indicator;
- dimensions/preset;
- prefix/variant;
- Add Slide;
- Duplicate Group;
- Localize;
- Export;
- group settings;
- за потреби Delete Group.

---

# 50. Slide interactions

Slide повинен підтримувати:

- select;
- add before/after;
- delete;
- reorder;
- local background;
- padding;
- single export.

---

# 51. Suggested JSON architecture

Чернеткова структура:

```json
{
  "schemaVersion": 1,
  "project": {
    "id": "project-1",
    "name": "Wave Studio",
    "groups": [
      {
        "id": "group-en-a",
        "name": "iPhone English A",
        "platform": "app-store",
        "presetId": "iphone-preset-id",
        "locale": "en",
        "prefix": "A",
        "slide": {
          "width": 1284,
          "height": 2778,
          "gap": 30
        },
        "background": {
          "type": "gradient",
          "scope": "group",
          "scaling": "cover"
        },
        "slides": [
          {
            "id": "slide-1",
            "order": 0,
            "padding": {
              "top": 100,
              "right": 100,
              "bottom": 100,
              "left": 100
            },
            "background": null
          }
        ],
        "elements": [
          {
            "id": "title-1",
            "type": "text",
            "x": 100,
            "y": 150,
            "width": 900,
            "height": 250,
            "rotation": 0,
            "zIndex": 10,
            "content": "Track every book you read",
            "widthMode": "fixed",
            "heightMode": "auto",
            "wrap": true,
            "style": {
              "fontFamily": "Inter",
              "fontSize": 72,
              "fontWeight": 700,
              "color": "#FFFFFF",
              "textAlign": "center"
            },
            "runs": []
          },
          {
            "id": "device-1",
            "type": "device",
            "deviceId": "iphone-variant-1",
            "x": 300,
            "y": 600,
            "width": 800,
            "height": 1600,
            "rotation": -8,
            "zIndex": 5,
            "screenshot": {
              "assetId": "local-screenshot-1",
              "embedded": false
            }
          }
        ]
      }
    ]
  }
}
```

Це лише концептуальна схема; фінальна schema буде уточнюватися під час
технічного дизайну.

---

# 52. AI / MCP readiness

Архітектуру потрібно одразу будувати так, щоб будь-яку операцію UI можна
було представити як структуровану команду.

Наприклад:

```json
{
  "action": "updateElement",
  "elementId": "title-1",
  "patch": {
    "x": 240,
    "fontSize": 84,
    "textAlign": "center"
  }
}
```

У майбутньому MCP/AI зможе:

- створити group;
- додати slides;
- додати text;
- змінити text;
- розташувати device;
- встановити screenshot reference;
- змінити background;
- змінити typography;
- локалізувати;
- експортувати.

Критично: UI не повинен мати "магічний" state, який неможливо описати
JSON.

---

# 53. Renderer

Бажано мати єдину render model для:

- editor canvas;
- preview;
- PNG export.

Це зменшує ризик, що export відрізнятиметься від editor.

При zoom змінюється тільки display transform.

Render coordinates залишаються фактичними.

---

# 54. Gap rendering model

Хоча елементи живуть у координатному просторі групи, кожен slide
рендериться як окрема clipping region.

Умовно:

```text
for each slide:
    clip(slideRect)
    render(groupBackground)
    render(slideBackground)
    render(elements)
```

Gap не має clipping region і тому нічого не показує.

Ця модель також природно підходить для PNG export.

---

# 55. Slide ownership calculation

Для reorder можна використовувати:

```text
intersectionArea(elementBounds, slideBounds)
```

Для кожного slide.

Потім:

```text
owner = slide with max intersection area
```

При однаковій площі:

```text
owner = slide containing element center
```

Для складніших rotated objects у першій версії можна використовувати
axis-aligned bounding box, якщо polygon intersection надто ускладнює
реалізацію. Пізніше алгоритм можна зробити точнішим.

---

# 56. Keyboard shortcuts

Поточний погоджений набір:

```text
Cmd + C         Copy
Cmd + V         Paste
Cmd + Z         Undo
Cmd + Shift + Z Redo
```

Доцільно також додати:

```text
Delete/Backspace Delete selected
Cmd + D          Duplicate
Arrow keys       Move 1 px
Shift + Arrow    Move larger step
```

Останні shortcuts є логічними рекомендаціями і можуть бути підтверджені
окремо.

---

# 57. Що свідомо НЕ потрібно у першій версії

На основі обговорення не потрібно:

- повноцінний Figma-like Layers panel;
- справжній 3D device editor;
- ручний crop/pan screenshot всередині device;
- pan workspace через Space + Drag;
- real-time preview thumbnails при кожній зміні;
- автоматичне виправлення localization overflow;
- JPEG export settings;
- ручні назви кожного slide;
- складна visual history panel;
- автоматичні safe-area presets;
- manual background pan/zoom;
- embed user screenshots у JSON.

---

# 58. Попередній MVP

## Projects

- create project;
- project name;
- save JSON;
- import JSON.

## Groups

- add group;
- select size preset;
- locale;
- prefix;
- gap;
- duplicate;
- delete;
- localize;
- export ZIP.

## Slides

- add;
- insert;
- delete;
- reorder;
- padding;
- background;
- export PNG.

## Elements

- text;
- device mockup;
- image;
- basic shape/decorative asset;
- select;
- multi-select;
- move;
- resize;
- rotate;
- z-order;
- copy/paste;
- delete.

## Text

- typography;
- color;
- alignment;
- auto/fixed dimensions;
- wrap/no-wrap;
- rich text;
- manual line breaks.

## Device

- predefined model/variant;
- screenshot upload;
- auto-fit into device mask.

## Canvas

- scroll;
- zoom presets;
- snapping;
- smart guides;
- equal-spacing guides.

## Background

- group/slide;
- solid;
- gradient;
- image;
- stretch/cover;
- whole-group/repeat-per-slide.

## History

- Undo/Redo;
- \~10 steps.

## Preview

- collapsible bottom panel;
- current group;
- 5-second debounce regeneration.

## Export

- PNG;
- ZIP group export;
- automatic filenames.

---

# 59. Потенційні наступні етапи

Після MVP можна розглядати:

- MCP server;
- ChatGPT/Codex integration;
- AI-generated ASO layouts;
- automatic ASO copy generation;
- template marketplace/library;
- reusable brand styles;
- custom fonts;
- batch localization;
- automatic resizing between App Store device formats;
- Google Play adaptation;
- cloud projects;
- collaboration;
- project versioning;
- export directly into Fastlane metadata structure;
- template import/export;
- shared assets;
- design tokens.

Це поки не є затвердженим MVP.

---

# 60. Відкриті питання

Під час наступного обговорення потрібно окремо визначити:

1.  Lock/unlock елементів.
2.  Hide/show елементів.
3.  Точну структуру toolbar.
4.  Точний UX додавання нового element.
5.  Чи потрібні rulers.
6.  Чи потрібні keyboard nudging settings.
7.  Які саме App Store / Google Play presets входять у першу версію.
8.  Device library та формат device masks.
9.  Підтримка custom fonts.
10. Image element properties.
11. Shape properties.
12. Group deletion behaviour.
13. Autosave/localStorage strategy.
14. Чи JSON save є єдиним persistence-механізмом MVP, чи буде локальне
    autosave.
15. Asset persistence між reload браузера.
16. Максимальні технічні розміри canvas.
17. Export performance для великих груп.
18. Точна поведінка drag-and-drop між групами.
19. Чи можна copy/paste між групами.
20. Чи можна copy/paste між різними проєктами.
21. Responsive поведінка самого editor UI.
22. Web vs macOS як перша платформа.
23. Account/auth/cloud storage.
24. Exact AI provider/API strategy для localization.
25. Localization glossary/context.
26. Pricing/limits.
27. Template system.
28. App Store / Google Play preset update mechanism.

---

# 61. Головний user flow

```text
Create Project
      ↓
Open Workspace
      ↓
Add Group
      ↓
Choose Store / Size / Locale / Prefix
      ↓
Add Slides
      ↓
Choose Group Background
      ↓
Add Text / Device / Decorations
      ↓
Upload screenshots into devices
      ↓
Build cross-slide composition
      ↓
Preview group
      ↓
Duplicate / Localize
      ↓
Adjust translated layouts
      ↓
Export group
      ↓
ZIP with production-ready PNG screenshots
```

---

# 62. Product positioning

Продукт не повинен позиціонуватися як "ще один графічний редактор".

Його сильна сторона:

> **спеціалізований редактор для швидкого створення, локалізації та
> експорту App Store / Google Play screenshot sets.**

Ключова відмінність від Figma --- користувач працює не з абстрактними
frames, а з поняттями:

- Project;
- Store preset;
- Group;
- Locale;
- Slide;
- Device;
- Screenshot;
- Localization;
- Export.

Саме ці обмеження мають зробити продукт значно швидшим для
indie-розробника.

Для локалізації будемо використовувати open-ai ключ який надає розробник. Повинно бути модальне вікно де користувач може змінювати свій ключ а також обирати модель за допомогою якої буде відбуватись локалізація. Також у нас повинні бути прописані промпти англійською в яких ми будемо описувати що і для чого ми перекладаємо.
