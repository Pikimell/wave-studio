// Transpile only the modules under test in memory; this does not run a Next build.
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
};
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createProject, createElement, createSlide, validateProject } = require('../domain/schema.ts');
const { createGroup } = require('../domain/presets.ts');
const { applyCommand } = require('../domain/commands.ts');
const { groupWidth, slideRect, intersectionArea, elementBounds, hitTest, resizeElement } = require('../domain/geometry.ts');
const { createScene } = require('../render/scene.ts');
const { renderSlideSvg, renderSlideContent } = require('../render/slide.ts');
const { elementSvg } = require('../render/svg.ts');
const { serializeProject, parseProjectJson } = require('../services/projectFiles.ts');
const { pushHistory, undoHistory, redoHistory } = require('../hooks/useHistory.ts');
const { resolveSelection } = require('../hooks/useSelection.ts');
const { imageDimensions, imageDimensionsWhenStandard } = require('../domain/imageDimensions.ts');
const { resizeWithAspectRatio } = require('../domain/aspectRatio.ts');
function fixture() {
  const project = createProject('Test');
  const group = createGroup('play-portrait');
  group.slides.push(createSlide());
  project.groups.push(group);
  return { project, group };
}
test('uploaded images use source dimensions and inspector ratio lock scales both fields', () => {
  assert.deepEqual(imageDimensions(1320, 2868), { width: 1320, height: 2868 });
  assert.deepEqual(imageDimensions(16000, 8000), { width: 12000, height: 6000 });
  assert.deepEqual(resizeWithAspectRatio(400, 800, 'width', 600), { width: 600, height: 1200 });
  assert.deepEqual(resizeWithAspectRatio(400, 800, 'height', 400), { width: 200, height: 400 });
});
test('upload replacement preserves manually resized image dimensions', () => {
  const { group } = fixture();
  const image = createElement('image', group);
  assert.deepEqual(imageDimensionsWhenStandard(image, 1320, 2868), { width: 1320, height: 2868 });
  assert.deepEqual(imageDimensionsWhenStandard({ ...image, width: image.width + 1 }, 1320, 2868), {});
  const svg = createElement('svg', group);
  assert.deepEqual(imageDimensionsWhenStandard(svg, 512, 256), { width: 512, height: 256 });
  assert.deepEqual(imageDimensionsWhenStandard({ ...svg, height: svg.height - 1 }, 512, 256), {});
});
test('decoration choices render distinct shapes', () => {
  const { group } = fixture();
  const decoration = createElement('decoration', group);
  const sparkle = elementSvg(decoration, 'preview');
  const star = elementSvg({ ...decoration, decorationId: 'star' }, 'preview');
  const ring = elementSvg({ ...decoration, decorationId: 'ring' }, 'preview');
  assert.notEqual(sparkle, star);
  assert.notEqual(star, ring);
  assert.match(ring, /<circle/);
});
test('all element variants and references round-trip without UI state or embedded assets', () => {
  const { project, group } = fixture();
  group.elements = ['text', 'shape', 'image', 'svg', 'device', 'decoration'].map(type => createElement(type, group));
  group.elements[2].asset = { assetId: 'local-image' };
  group.elements[2].asset.fileName = 'screen-shot.png';
  group.elements[3].asset = { assetId: 'local-svg', fileName: 'icon.svg' };
  group.elements[4].screenshot = { assetId: 'screenshot-1' };
  group.background = { type: 'gradient', from: '#ffffff', to: '#000000', angle: 45 };
  assert.deepEqual(parseProjectJson(serializeProject(project)), project);
  assert.equal(JSON.stringify(project).includes('base64'), false);
  assert.equal(parseProjectJson(serializeProject(project)).groups[0].elements[2].asset.fileName, 'screen-shot.png');
  assert.equal(parseProjectJson(serializeProject(project)).groups[0].elements[3].type, 'svg');
});
test('custom svg element renders original and tint modes', () => {
  const { group } = fixture();
  const svg = { ...createElement('svg', group), asset: { assetId: 'logo', fileName: 'logo.svg' } };
  const original = elementSvg(svg, 'preview', { logo: 'data:image/svg+xml;base64,PHN2Zy8+' });
  const tinted = elementSvg({ ...svg, colorMode: 'tint', tint: '#ff0000' }, 'preview', { logo: 'data:image/svg+xml;base64,PHN2Zy8+' });
  assert.match(original, /preserveAspectRatio="xMidYMid meet"/);
  assert.match(tinted, /<mask/);
  assert.match(tinted, /fill="#ff0000"/);
});
test('strict validation rejects malformed dimensions, duplicate nested IDs, unknown fields and versions', () => {
  for (const mutate of [
    p => { p.schemaVersion = 2; }, p => { p.groups[0].width = NaN; }, p => { p.groups[0].gap = -1; },
    p => { p.groups[0].height = 320.5; }, p => { p.groups[0].slides[0].id = p.id; },
    p => { p.apiKey = 'secret'; }, p => { p.groups[0].locale = 'invalid locale'; },
    p => { p.groups[0].elements = [{ ...createElement('text', p.groups[0]), width: Infinity }]; },
    p => { p.groups[0].background.color = 'url(javascript:alert(1))'; },
    p => { p.groups[0].slides[0].padding = null; }
  ]) {
    const { project } = fixture(); mutate(project); assert.throws(() => validateProject(project));
  }
  assert.throws(() => parseProjectJson('{'));
});
test('group geometry handles zero, one and many slides; gap exists only between slides', () => {
  const { group } = fixture();
  group.width = 500; group.gap = 30; group.slides = [];
  assert.equal(groupWidth(group), 0);
  group.slides.push(createSlide()); assert.equal(groupWidth(group), 500);
  for (let i = 0; i < 4; i++) group.slides.push(createSlide());
  assert.equal(groupWidth(group), 2620);
  assert.deepEqual(slideRect(group, 2), { x: 1060, y: 0, width: 500, height: 1920 });
});
test('cross-slide renderer clips group content separately and single SVG has exact dimensions', () => {
  const { group } = fixture();
  const shape = createElement('shape', group);
  shape.x = group.width - 100; shape.width = 400;
  group.elements.push(shape);
  const scene = createScene(group);
  assert.ok(intersectionArea(shape, slideRect(group, 0)) > 0);
  assert.ok(intersectionArea(shape, slideRect(group, 1)) > 0);
  const first = renderSlideContent(scene, 0, 'test'), second = renderSlideSvg(scene, 1);
  assert.match(first, /clip-path="url\(#test-/);
  assert.ok(second.includes(`viewBox="${group.width + group.gap} 0 ${group.width} ${group.height}"`));
  assert.ok(second.includes(`width="${group.width}" height="${group.height}"`));
  assert.ok(first.includes(`translate(${shape.x} ${shape.y})`));
  assert.throws(() => renderSlideSvg(scene, 50));
});
test('render escapes imported text and uses deterministic z-order', () => {
  const { group } = fixture();
  const text = createElement('text', group); text.wrap = false; text.segments[0].text = '<script>alert("x")</script> & hi';
  group.elements = [text, { ...createElement('shape', group), zIndex: -1 }];
  const scene = createScene(group), svg = renderSlideSvg(scene, 0);
  assert.equal(scene.elements[0].type, 'shape');
  assert.ok(!svg.includes('<script>')); assert.ok(svg.includes('&lt;script&gt;alert')); 
});
test('commands are immutable, validated and no-op aware; deleted group can be restored', () => {
  const { project, group } = fixture();
  const before = structuredClone(project);
  const changed = applyCommand(project, { type: 'group.update', groupId: group.id, patch: { name: 'Changed' } });
  assert.deepEqual(project, before);
  assert.equal(changed.groups[0].name, 'Changed');
  assert.equal(applyCommand(project, { type: 'project.rename', name: project.name }), project);
  assert.throws(() => applyCommand(project, { type: 'group.update', groupId: group.id, patch: { width: 0 } }));
  const history = pushHistory({ past: [], present: project, future: [] }, applyCommand(project, { type: 'group.delete', groupId: group.id }));
  assert.equal(history.present.groups.length, 0);
  assert.deepEqual(undoHistory(history).present, project);
});
test('history retains ten logical edits, redo and new-branch semantics', () => {
  let h = { past: [], present: 0, future: [] };
  for (let i = 1; i <= 12; i++) h = pushHistory(h, i);
  assert.equal(h.past.length, 10);
  assert.deepEqual(h.past, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.equal(redoHistory(undoHistory(h)).present, 12);
  assert.deepEqual(pushHistory(undoHistory(h), 42).future, []);
});
test('rotated hit testing excludes the empty parts of its AABB and respects z-index', () => {
  const { group } = fixture();
  const shape = createElement('shape', group); Object.assign(shape, { x: 0, y: 0, width: 200, height: 100, rotation: 90 });
  const bounds = elementBounds(shape);
  assert.ok(Math.abs(bounds.width - 100) < 0.0001);
  assert.ok(Math.abs(bounds.height - 200) < 0.0001);
  group.elements.push(shape);
  assert.equal(hitTest(group, 100, 50)?.id, shape.id);
  assert.equal(hitTest(group, 10, 10), undefined);
});
test('resizing a rotated element fixes the opposite corner and clamps positive dimensions', () => {
  const { group } = fixture();
  const element = { ...createElement('shape', group), x: 100, y: 100, width: 200, height: 100, rotation: 90 };
  const resized = resizeElement(element, -20, 40, 'se');
  assert.equal(resized.width, 240); assert.equal(resized.height, 120);
  function nw(e) { return { x: e.x + e.width / 2 + e.height / 2, y: e.y + e.height / 2 - e.width / 2 }; }
  assert.deepEqual(nw(resized), nw(element));
  assert.ok(resizeElement(element, 0, -10000, 'se').width >= 1);
});
test('side handles resize one axis and keep the opposite edge fixed, including rotation', () => {
  const element = { x: 100, y: 100, width: 200, height: 100, rotation: 0, zIndex: 0 };
  assert.deepEqual(resizeElement(element, 40, 25, 'e'), { ...element, width: 240 });
  assert.deepEqual(resizeElement(element, 40, 25, 'w'), { ...element, x: 140, width: 160 });
  assert.deepEqual(resizeElement(element, 40, 25, 's'), { ...element, height: 125 });
  assert.deepEqual(resizeElement(element, 40, 25, 'n'), { ...element, y: 125, height: 75 });
  assert.deepEqual(resizeElement(element, 40, 0, 'e', true), { ...element, y: 90, width: 240, height: 120 });
  const rotated = { ...element, rotation: 90 };
  const result = resizeElement(rotated, 0, 40, 'e');
  assert.equal(result.width, 240);
  assert.equal(result.height, 100);
  const westEdge = e => ({ x: e.x + e.width / 2, y: e.y + e.height / 2 - e.width / 2 });
  assert.deepEqual(westEdge(result), westEdge(rotated));
});
test('stale selection is normalized after deleting selected elements or groups', () => {
  const { project, group } = fixture();
  assert.deepEqual(resolveSelection(project, { kind: 'element', groupId: group.id, elementIds: ['missing'] }), { kind: 'group', groupId: group.id });
  assert.equal(resolveSelection(project, { kind: 'group', groupId: 'missing' }), null);
});
const { insertSlide, deleteSlide, reorderSlide, ownerIndex, duplicateGroup } = require('../domain/slides.ts');
const { copyElements, orderElements } = require('../domain/elements.ts');
const { snapTranslation } = require('../domain/snapping.ts');
const { layoutText } = require('../render/text.ts');
test('insert shifts right-hand elements and delete removes whole crossing objects', () => {
  const { group } = fixture(); const stride = group.width + group.gap;
  group.elements = [{ ...createElement('shape', group), x: stride + 10 }, { ...createElement('shape', group), x: group.width - 50 }];
  const inserted = insertSlide(group, 1, createSlide());
  assert.equal(inserted.elements[0].x, stride * 2 + 10);
  assert.equal(inserted.elements[1].x, group.width - 50);
  const deleted = deleteSlide(group, group.slides[0].id);
  assert.equal(deleted.elements.length, 1); assert.equal(deleted.elements[0].x, 10);
});
test('ownership and reorder respect intersection, deterministic ties and outside elements', () => {
  const { group } = fixture(); group.width = 500; group.gap = 0;
  const crossing = { ...createElement('shape', group), x: 400, y: 20, width: 200, height: 100 };
  const outside = { ...createElement('shape', group), x: -1000, y: -1000 };
  group.elements = [crossing, outside];
  assert.equal(ownerIndex(group, crossing), 0); assert.equal(ownerIndex(group, outside), -1);
  const moved = reorderSlide(group, group.slides[0].id, 1);
  assert.equal(moved.elements[0].x, 900); assert.equal(moved.elements[1].x, -1000);
  assert.equal(moved.slides[1].id, group.slides[0].id);
});
test('duplicates regenerate all nested IDs while retaining independent styles and screenshot references', () => {
  const { project, group } = fixture();
  group.elements = [createElement('text', group), { ...createElement('device', group), screenshot: { assetId: 'screen-1' } }];
  const copy = duplicateGroup(group); project.groups.push(copy); validateProject(project);
  assert.notEqual(copy.elements.find(e => e.type === 'text').segments[0].id, group.elements[0].segments[0].id);
  assert.deepEqual(copy.elements.find(e => e.type === 'device').screenshot, group.elements[1].screenshot);
  copy.elements.find(e => e.type === 'text').style.color = '#000000'; assert.equal(group.elements[0].style.color, '#ffffff');
  const pasted = copyElements(group.elements, 100, 200, 5);
  assert.equal(pasted.find(e => e.type === 'text').x, group.elements[0].x + 100); assert.equal(pasted[0].zIndex, 5);
});
test('z-order moves a selected block without reversing its relative order', () => {
  const { group } = fixture(); const elements = [0,1,2,3].map(zIndex => ({ ...createElement('shape', group), zIndex }));
  const result = orderElements(elements, [elements[0].id, elements[1].id], 'forward');
  assert.deepEqual(result.map(e => e.id), [elements[2].id, elements[0].id, elements[1].id, elements[3].id]);
  assert.deepEqual(result.map(e => e.zIndex), [0,1,2,3]);
});
test('snaps to padding and centers with zoom-derived tolerance and ignores moving elements', () => {
  const { group } = fixture(); const shape = { ...createElement('shape', group), x: 110, y: 200 };
  group.elements = [shape];
  const snapped = snapTranslation(group, [shape], -28, 0, 6);
  assert.equal(shape.x + snapped.dx, group.slides[0].padding.left);
  assert.ok(snapped.guides.length);
  const free = snapTranslation(group, [shape], 7, 3, 0.01);
  assert.equal(free.dx, 7); assert.equal(free.dy, 3);
});
test('equal-spacing snapping positions between neighboring objects', () => {
  const { group } = fixture(); group.slides = [];
  const shape = { ...createElement('shape', group), x: 151, y: 300, width: 100, height: 100 };
  group.elements = [shape, { ...createElement('shape', group), x: 0, y: 300, width: 100, height: 100 }, { ...createElement('shape', group), x: 300, y: 300, width: 100, height: 100 }];
  const snapped = snapTranslation(group, [shape], 0, 0, 6);
  assert.equal(shape.x + snapped.dx, 150);
  assert.ok(snapped.guides.some(g => g.kind === 'spacing'));
});
test('text sizing keeps explicit breaks separate from wrapping and preserves segment styles', () => {
  const { group } = fixture(); const text = createElement('text', group);
  text.width = 60; text.style.fontSize = 10; text.heightMode = 'auto'; text.padding = 0;
  text.segments[0].text = 'one two\nthree';
  const measure = value => Array.from(value).length * 10;
  const wrapped = layoutText(text, measure);
  assert.ok(wrapped.lines.length >= 3);
  assert.equal(text.segments[0].text, 'one two\nthree');
  text.widthMode = 'auto'; const auto = layoutText(text, measure);
  assert.equal(auto.lines.length, 2); assert.equal(auto.width, 70);
  text.widthMode = 'fixed'; text.heightMode = 'fixed'; text.height = 10; text.wrap = false;
  assert.equal(layoutText(text, measure).overflow, true);
});
test('batch commands produce one immutable change and reject the entire invalid batch', () => {
  const { project, group } = fixture(); const before = structuredClone(project);
  assert.throws(() => applyCommand(project, { type: 'batch', commands: [
    { type: 'group.update', groupId: group.id, patch: { name: 'Changed' } },
    { type: 'group.update', groupId: group.id, patch: { width: -1 } }
  ] })); assert.deepEqual(project, before);
});
const { crc32, createZip, zipFilename } = require('../services/exportZip.ts');
const { pngFilename } = require('../services/exportPng.ts');
const { inspectGroup } = require('../services/preflight.ts');
const { collectText, validatePayload, validateTranslations, translatedGroups } = require('../domain/localization.ts');
const { localize } = require('../server/localization.ts');
const { requestLocalization } = require('../services/localizationClient.ts');
const { LOCALIZATION_PROMPT } = require('../server/prompts.ts');
test('ZIP headers, UTF-8 names and CRC are accepted by Python zipfile', async () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
  const zip = await createZip([{ name: 'uk_01.png', blob: new Blob(['one']) }, { name: 'Україна_02.png', blob: new Blob(['two']) }]);
  const { spawnSync } = require('node:child_process');
  const result = spawnSync('python3', ['-c', 'import sys,io,zipfile,json; z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())); assert z.testzip() is None; print(json.dumps({n:z.read(n).decode() for n in z.namelist()},ensure_ascii=False))'], { input: Buffer.from(await zip.arrayBuffer()), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { 'uk_01.png': 'one', 'Україна_02.png': 'two' });
});
test('export names are safe and deterministic; preflight blocks missing images and warns on overflow', () => {
  const { group } = fixture(); group.prefix = 'A / test'; group.variant = 'B';
  assert.equal(pngFilename(group, 0), 'A-test_B_en_01.png');
  assert.ok(!zipFilename('../App', group).includes('/'));
  group.elements = [createElement('image', group), { ...createElement('text', group), height: 1 }];
  const issues = inspectGroup(group, new Set());
  assert.ok(issues.some(i => i.severity === 'error' && i.elementId === group.elements[0].id));
  assert.ok(issues.some(i => i.severity === 'warning' && i.elementId === group.elements[1].id));
});
test('real SVG raster crops cross-slide objects without exporting the gap', async () => {
  const sharp = require('sharp'); const { group } = fixture();
  group.width = 500; group.height = 500; group.gap = 40; group.background = { type: 'solid', color: '#000000' };
  group.elements = [{ ...createElement('shape', group), x: 450, y: 0, width: 200, height: 500, radius: 0, fill: '#ff0000' }];
  const scene = createScene(group);
  const first = await sharp(Buffer.from(renderSlideSvg(scene, 0))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const second = await sharp(Buffer.from(renderSlideSvg(scene, 1))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(first.info.width, 500); assert.equal(second.info.height, 500);
  const pixel = (image, x, y) => [...image.data.subarray((y * image.info.width + x) * 4, (y * image.info.width + x) * 4 + 4)];
  assert.deepEqual(pixel(first, 499, 100), [255,0,0,255]);
  assert.deepEqual(pixel(second, 0, 100), [255,0,0,255]);
  assert.deepEqual(pixel(second, 109, 100), [255,0,0,255]);
  assert.deepEqual(pixel(second, 110, 100), [0,0,0,255]);
});
function localizableFixture() {
  const { group } = fixture(); const text = createElement('text', group); group.elements.push(text);
  const payload = { sourceLocale: group.locale, targetLocales: ['uk', 'de'], segments: collectText(group) };
  const translations = payload.targetLocales.map(locale => ({ locale, segments: payload.segments.map(s => ({ id: s.id, lines: s.lines.map(line => `${locale}: ${line}`) })) }));
  return { group, text, payload, translations };
}
test('translation validates complete ID/locale/line correspondence and preserves layout/style', () => {
  const { group, payload, translations } = localizableFixture(); validatePayload(payload);
  const result = validateTranslations({ translations }, payload); const groups = translatedGroups(group, result);
  assert.equal(groups.length, 2); assert.equal(groups[0].locale, 'uk');
  assert.equal(groups[0].elements[0].width, group.elements[0].width);
  assert.deepEqual(groups[0].elements[0].style, group.elements[0].style);
  assert.notEqual(groups[0].elements[0].id, group.elements[0].id);
  assert.equal(groups[0].elements[0].segments[0].text.split('\n').length, group.elements[0].segments[0].text.split('\n').length);
  for (const change of [
    t => t.pop(), t => { t[0].segments[0].id = 'unknown'; }, t => { t[0].segments[0].lines.push('extra'); }, t => { t[1].locale = 'uk'; }
  ]) { const invalid = structuredClone(translations); change(invalid); assert.throws(() => validateTranslations({ translations: invalid }, payload)); }
});
test('localization sends only text to fixed OpenAI endpoint and never echoes credential errors', async () => {
  const { payload, translations } = localizableFixture(); const apiKey = 'test-only-key-never-sent-to-a-real-service';
  let request;
  const singleLocalePayload = { ...payload, targetLocales: ['uk'] };
  const fetcher = async (url, options) => { request = { url, options }; return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ translations: [translations[0]] }) } }] }); };
  const result = await localize({ apiKey, model: 'gpt-4.1-mini', payload: { ...singleLocalePayload, screenshot: 'private' } }, fetcher);
  assert.equal(result.length, 1); assert.equal(request.url, 'https://api.openai.com/v1/chat/completions');
  assert.ok(!request.options.body.includes(apiKey)); assert.ok(!request.options.body.includes('private'));
  assert.equal(JSON.parse(request.options.body).store, false);
  assert.match(LOCALIZATION_PROMPT, /Do not translate word for word/);
  await assert.rejects(localize({ apiKey, model: 'gpt-4.1-mini', payload }, fetcher), error => error.status === 400);
  await assert.rejects(localize({ apiKey, model: 'gpt-4.1-mini', payload: singleLocalePayload }, async () => Response.json({ error: { message: apiKey } }, { status: 401 })), error => !error.message.includes(apiKey) && error.message.includes('відхилив'));
});
test('localization requests each target locale separately and returns only complete results', async () => {
  const { payload, translations } = localizableFixture();
  const requested = [];
  const fetcher = async (_url, options) => {
    const sent = JSON.parse(options.body).payload;
    requested.push(sent.targetLocales);
    return Response.json({ translations: [translations.find(item => item.locale === sent.targetLocales[0])] });
  };
  const result = await requestLocalization(payload, 'test-key', 'test-model', new AbortController().signal, fetcher);
  assert.deepEqual(requested, [['uk'], ['de']]);
  assert.deepEqual(result, translations);
  await assert.rejects(requestLocalization(payload, 'test-key', 'test-model', new AbortController().signal, async (_url, options) => {
    const locale = JSON.parse(options.body).payload.targetLocales[0];
    return locale === 'uk' ? Response.json({ translations: [translations[0]] }) : Response.json({ error: 'Другий переклад не вдався.' }, { status: 502 });
  }), /Другий переклад не вдався/);
});
const { copyProject, deleteProject, getProject, listProjects, saveProject } = require('../services/projectStore.ts');
test('Shift resize preserves aspect ratio and the opposite corner', () => {
  const element = { x: 10, y: 20, width: 200, height: 100, rotation: 0, zIndex: 0 };
  const resized = resizeElement(element, 60, 5, 'se', true);
  assert.equal(resized.width / resized.height, 2);
  assert.equal(resized.x, element.x);
  assert.equal(resized.y, element.y);
  assert.equal(resized.width, 260);
  assert.equal(resized.height, 130);
});
test('project store keeps separate projects, copies IDs, deletes one, and migrates legacy data', () => {
  const previous = global.localStorage;
  const data = new Map();
  global.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  try {
    const original = fixture().project;
    data.set('aso-screenshot-studio.project.v1', serializeProject(original));
    assert.equal(listProjects().length, 1);
    const copy = copyProject(original, 'Copy');
    saveProject(copy);
    assert.equal(listProjects().length, 2);
    assert.notEqual(copy.id, original.id);
    assert.notEqual(copy.groups[0].id, original.groups[0].id);
    deleteProject(original.id);
    assert.equal(getProject(original.id), null);
    assert.equal(getProject(copy.id).name, 'Copy');
  } finally { global.localStorage = previous; }
});
test('bundled templates have three composed slides with title, subtitle and centered device', () => {
  const path = require('node:path');
  const root = path.join(__dirname, '../../../public/aso-screenshot-studio/templates');
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'));
  assert.ok(catalog.length >= 3);
  for (const entry of catalog) {
    const template = validateProject(JSON.parse(fs.readFileSync(path.join(root, entry.file), 'utf8')));
    const group = template.groups[0];
    assert.equal(group.slides.length, 3, entry.name);
    for (let index = 0; index < 3; index++) {
      const elements = group.elements.filter(element => intersectionArea(element, slideRect(group, index)) > 0);
      assert.equal(elements.filter(element => element.type === 'text').length, 2, `${entry.name} slide ${index + 1}`);
      const device = elements.find(element => element.type === 'device');
      assert.ok(device, `${entry.name} slide ${index + 1}`);
      assert.equal(device.x - index * (group.width + group.gap), (group.width - device.width) / 2);
    }
  }
});
test('three-color gradient presets validate and render a middle color stop', () => {
  const { GRADIENT_PRESETS } = require('../domain/gradientPresets.ts');
  const { backgroundSvg } = require('../render/svg.ts');
  assert.ok(GRADIENT_PRESETS.length >= 15);
  for (const preset of GRADIENT_PRESETS) {
    const { project, group } = fixture();
    group.background = preset.background;
    assert.deepEqual(validateProject(project).groups[0].background, preset.background);
    assert.match(backgroundSvg(preset.background, 100, 200, 'gradient'), /offset="\.5"/);
  }
  assert.match(backgroundSvg({ type: 'gradient', from: '#000000', to: '#ffffff', angle: 0 }, 100, 200, 'vertical'), /x1="0\.5" y1="1" x2="0\.5" y2="0"/);
});
test('angled device transforms frame and screenshot mask together', async () => {
  const sharp = require('sharp');
  const { elementSvg } = require('../render/svg.ts');
  const { group } = fixture();
  const red = await sharp({ create: { width: 8, height: 8, channels: 4, background: '#ff0000' } }).png().toBuffer();
  const device = { ...createElement('device', group), x: 0, y: 0, width: 1000, height: 2060, deviceId: 'phone-angled', screenshot: { assetId: 'red' } };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2060">${elementSvg(device, 'test', { red: `data:image/png;base64,${red.toString('base64')}` })}</svg>`;
  assert.match(svg, /transform="matrix\(0\.74 0\.06 -0\.08 0\.88 220 90\)"/);
  const image = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixel = (x, y) => [...image.data.subarray((y * image.info.width + x) * 4, (y * image.info.width + x) * 4 + 4)];
  assert.deepEqual(pixel(508, 1026), [255, 0, 0, 255]);
  assert.equal(pixel(20, 20)[3], 0);
});
test('licensed iPad artwork and screenshot render together in SVG export', async () => {
  const sharp = require('sharp');
  const { elementSvg } = require('../render/svg.ts');
  const { group } = fixture();
  const artwork = fs.readFileSync(require('node:path').join(__dirname, '../../../public/aso-screenshot-studio/devices/ipad-pro-12-9-space-gray.svg'));
  const red = await sharp({ create: { width: 8, height: 8, channels: 4, background: '#ff0000' } }).png().toBuffer();
  const device = { ...createElement('device', group), x: 0, y: 0, width: 224, height: 292.4, deviceId: 'ipad-pro-12-9', screenshot: { assetId: 'red' } };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="224" height="293">${elementSvg(device, 'test', { red: `data:image/png;base64,${red.toString('base64')}`, 'device-artwork:ipad-pro-12-9': `data:image/svg+xml;base64,${artwork.toString('base64')}` })}</svg>`;
  const image = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixel = (x, y) => [...image.data.subarray((y * image.info.width + x) * 4, (y * image.info.width + x) * 4 + 4)];
  assert.deepEqual(pixel(112, 146), [255, 0, 0, 255]);
  assert.equal(pixel(0, 0)[3], 0);
});
test('Pixel artwork overlays screenshot through its transparent screen', async () => {
  const sharp = require('sharp');
  const { elementSvg } = require('../render/svg.ts');
  const { group } = fixture();
  const artwork = fs.readFileSync(require('node:path').join(__dirname, '../../../public/aso-screenshot-studio/devices/pixel-9-pro.svg'));
  const red = await sharp({ create: { width: 8, height: 8, channels: 4, background: '#ff0000' } }).png().toBuffer();
  const device = { ...createElement('device', group), x: 0, y: 0, width: 353, height: 745, deviceId: 'pixel-9-pro', screenshot: { assetId: 'red' } };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="353" height="745">${elementSvg(device, 'test', { red: `data:image/png;base64,${red.toString('base64')}`, 'device-artwork:pixel-9-pro': `data:image/svg+xml;base64,${artwork.toString('base64')}` })}</svg>`;
  const image = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixel = (x, y) => [...image.data.subarray((y * image.info.width + x) * 4, (y * image.info.width + x) * 4 + 4)];
  assert.deepEqual(pixel(175, 380), [255, 0, 0, 255]);
  assert.equal(pixel(0, 0)[3], 0);
});
test('device frames leave screenshot status bars unobscured and show an upload hint when empty', async () => {
  const sharp = require('sharp');
  const path = require('node:path');
  const { group } = fixture();
  const red = await sharp({ create: { width: 8, height: 8, channels: 4, background: '#ff0000' } }).png().toBuffer();
  for (const [deviceId, width, height, statusPoints] of [
    ['iphone-16-max', 415, 843, [[78, 40], [345, 40]]],
    ['pixel-9-pro', 353, 745, [[50, 42], [305, 42]]],
  ]) {
    const artwork = fs.readFileSync(path.join(__dirname, '../../../public/aso-screenshot-studio/devices', `${deviceId}.svg`), 'utf8')
      .replace('</svg>', `<rect x="30" y="30" width="90" height="22" fill="black"/><rect x="275" y="30" width="80" height="22" fill="black"/></svg>`);
    const device = { ...createElement('device', group), x: 0, y: 0, width, height, deviceId, screenshot: { assetId: 'red' } };
    const assets = { red: `data:image/png;base64,${red.toString('base64')}`, [`device-artwork:${deviceId}`]: `data:image/svg+xml;base64,${Buffer.from(artwork).toString('base64')}` };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${elementSvg(device, 'status', assets)}</svg>`;
    const image = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (const [x, y] of statusPoints) {
      const offset = (y * image.info.width + x) * 4;
      assert.deepEqual([...image.data.subarray(offset, offset + 4)], [255, 0, 0, 255], `${deviceId} status area at ${x},${y}`);
    }
    const empty = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${elementSvg({ ...device, screenshot: null }, 'empty', assets)}</svg>`;
    assert.match(empty, /Двічі клацніть/);
    const emptyImage = await sharp(Buffer.from(empty)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (const [x, y] of statusPoints) {
      const offset = (y * emptyImage.info.width + x) * 4;
      assert.deepEqual([...emptyImage.data.subarray(offset, offset + 4)], [51, 65, 85, 255], `${deviceId} empty status area at ${x},${y}`);
    }
  }
});
test('bundled font is available for export and SVG accepts embedded face', async () => {
  const sharp = require('sharp');
  const font = fs.readFileSync(require('node:path').join(__dirname, '../../../public/aso-screenshot-studio/fonts/inter-latin.woff2'));
  const { group } = fixture();
  const text = createElement('text', group); text.style.fontFamily = 'Inter'; text.segments[0].text = 'Inter';
  group.elements = [text];
  assert.ok(!inspectGroup(group, new Set()).some(issue => issue.message.includes('Шрифт')));
  const scene = createScene(group);
  scene.fontCss = `@font-face{font-family:'Inter';src:url('data:font/woff2;base64,${font.toString('base64')}') format('woff2')}`;
  const svg = renderSlideSvg(scene, 0);
  assert.match(svg, /@font-face/);
  const image = await sharp(Buffer.from(svg)).png().toBuffer();
  assert.ok(image.length > 0);
});
test('expanded font catalog has licensed files and recognizes requested Latin-only families', async () => {
  const path = require('node:path');
  const { BUNDLED_FONTS, fontFiles, FONT_FAMILIES } = require('../domain/fontLibrary.ts');
  const { prepareFont } = require('../services/fontStore.ts');
  const root = path.join(__dirname, '../../../public/aso-screenshot-studio/fonts');
  assert.equal(BUNDLED_FONTS.length, 30);
  for (const font of BUNDLED_FONTS) {
    assert.ok(fs.existsSync(path.join(root, `${font.slug}-OFL.txt`)) || fs.existsSync(path.join(root, `${font.slug}-LICENSE.txt`)), font.name);
    for (const file of fontFiles(font)) assert.ok(fs.existsSync(path.join(__dirname, '../../../public', file.url)), file.url);
  }
  assert.ok(FONT_FAMILIES.includes('Kalam'));
  assert.ok(FONT_FAMILIES.includes('Fredoka One'));
  const bytes = fs.readFileSync(path.join(root, 'inter-latin.woff2'));
  const upload = Object.assign(new Blob([bytes]), { name: 'My Font.woff2' });
  const custom = await prepareFont(upload);
  assert.equal(custom.name, 'My Font');
  assert.match(custom.family, /^custom-font-/);
  const { group } = fixture();
  const text = createElement('text', group); text.style.fontFamily = custom.family; group.elements = [text];
  assert.ok(inspectGroup(group, new Set()).some(issue => issue.severity === 'error' && issue.message.includes('Власний шрифт')));
  assert.ok(!inspectGroup(group, new Set(), new Set([custom.family])).some(issue => issue.message.includes('Власний шрифт')));
  text.style.fontFamily = 'Kalam';
  text.segments[0].text = 'Привіт';
  assert.ok(inspectGroup(group, new Set()).some(issue => issue.severity === 'warning' && issue.message.includes('кирилиці')));
});

const { COMPOSITIONS, validateDeckSpec, deckSpecToGroup } = require('../domain/generation.ts');
const { PRESETS } = require('../domain/presets.ts');
function creativeDeck() {
  return {
    groupName: 'Reading habit', locale: 'en', artDirection: 'One continuous plum panorama with quiet orbs.',
    theme: { from: '#191329', mid: '#292046', to: '#36214C', accent: '#D6EB9A', text: '#FFFFFF', mutedText: '#DDD5E8', angle: 90, motif: 'orbs' },
    slides: COMPOSITIONS.map(composition => ({ strategicRole: 'Feature proof', userTakeaway: 'Track reading progress.',
      headlineBefore: 'Make ', emphasis: 'reading', headlineAfter: ' a habit', supportingText: '',
      screenshotBrief: 'Reading history with a populated week.', composition, compositionReason: 'Show the relevant UI clearly.' }))
  };
}
test('creative response validates supported layouts, optional copy and strict theme contract', () => {
  const deck = creativeDeck();
  assert.deepEqual(validateDeckSpec(deck, 6), deck);
  for (const change of [
    d => { d.slides[0].composition = 'arbitrary-html'; },
    d => { d.slides[0].background = '#FFFFFF'; },
    d => { d.theme.motif = 'external-image'; },
    d => { d.theme.angle = 181; },
    d => { delete d.artDirection; },
    d => { d.slides.pop(); }
  ]) {
    const invalid = structuredClone(deck); change(invalid);
    assert.throws(() => validateDeckSpec(invalid, 6));
  }
});
test('generated panorama uses adjacent crops of the same background and seam objects', () => {
  const group = deckSpecToGroup(creativeDeck(), 'iphone-69');
  assert.equal(group.gap, 0);
  assert.equal(group.backgroundScope, 'group');
  assert.ok(group.slides.every(slide => slide.background === null));
  const scene = createScene(group);
  assert.equal(scene.width, group.width * 6);
  const first = renderSlideContent(scene, 0, 'panorama');
  const second = renderSlideContent(scene, 1, 'panorama');
  for (const svg of [first, second]) {
    assert.ok(svg.includes(`width="${scene.width}"`));
    assert.ok(svg.includes('transform="translate(0 0)"'));
  }
  const seamShape = group.elements.find(element => element.type === 'shape');
  assert.ok(seamShape.x < group.width && seamShape.x + seamShape.width > group.width);
});
test('every composition fits each preset horizontally and persists as an editable project', () => {
  for (const preset of PRESETS) {
    const group = deckSpecToGroup(creativeDeck(), preset.id);
    assert.equal(group.elements.filter(e => e.type === 'device').length, 7);
    assert.equal(group.elements.filter(e => e.type === 'text').length, 6); // Empty supporting copy creates no element.
    for (const element of group.elements.filter(e => e.type === 'device' || e.type === 'text')) {
      const bounds = elementBounds(element);
      const index = Math.floor((element.x + element.width / 2) / group.width);
      assert.ok(bounds.x >= index * group.width - 0.01, `${preset.id}: left spill`);
      assert.ok(bounds.x + bounds.width <= (index + 1) * group.width + 0.01, `${preset.id}: right spill`);
      assert.ok(bounds.y >= 0, `${preset.id}: top spill`);
      if (index !== 5) assert.ok(bounds.y + bounds.height <= group.height + 0.01, `${preset.id}: bottom spill`);
    }
    const project = createProject(); project.groups = [group];
    assert.deepEqual(validateProject(project), project);
  }
});
test('composition choices move text and devices, preserve copy and allow a clean single slide', () => {
  const deck = creativeDeck();
  deck.slides[3].supportingText = 'See your progress each week.';
  const group = deckSpecToGroup(deck, 'play-landscape');
  const texts = group.elements.filter(e => e.type === 'text');
  assert.equal(texts[0].segments.map(s => s.text).join(''), 'Make reading a habit');
  assert.ok(texts.some(e => e.segments[0].text === 'See your progress each week.'));
  const left = texts.find(e => e.x >= group.width * 3 && e.x < group.width * 4);
  const right = texts.find(e => e.x >= group.width * 4 && e.x < group.width * 5);
  assert.ok(left.x - group.width * 3 < group.width / 2);
  assert.ok(right.x - group.width * 4 > group.width / 2);
  assert.ok(group.elements.some(e => e.type === 'device' && e.rotation !== 0));
  deck.slides = [deck.slides[0]]; deck.theme.motif = 'none';
  const single = deckSpecToGroup(validateDeckSpec(deck, 1), 'ipad-13');
  assert.equal(single.slides.length, 1);
  assert.equal(single.elements.length, 2);
});
