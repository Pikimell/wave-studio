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
const { serializeProject, parseProjectJson } = require('../services/projectFiles.ts');
const { pushHistory, undoHistory, redoHistory } = require('../hooks/useHistory.ts');
const { resolveSelection } = require('../hooks/useSelection.ts');
function fixture() {
  const project = createProject('Test');
  const group = createGroup('play-portrait');
  group.slides.push(createSlide());
  project.groups.push(group);
  return { project, group };
}
test('all element variants and references round-trip without UI state or embedded assets', () => {
  const { project, group } = fixture();
  group.elements = ['text', 'shape', 'image', 'device', 'decoration'].map(type => createElement(type, group));
  group.elements[2].asset = { assetId: 'local-image' };
  group.elements[3].screenshot = { assetId: 'screenshot-1' };
  group.background = { type: 'gradient', from: '#ffffff', to: '#000000', angle: 45 };
  assert.deepEqual(parseProjectJson(serializeProject(project)), project);
  assert.equal(JSON.stringify(project).includes('base64'), false);
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
  const fetcher = async (url, options) => { request = { url, options }; return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ translations }) } }] }); };
  const result = await localize({ apiKey, model: 'gpt-4.1-mini', payload: { ...payload, screenshot: 'private' } }, fetcher);
  assert.equal(result.length, 2); assert.equal(request.url, 'https://api.openai.com/v1/chat/completions');
  assert.ok(!request.options.body.includes(apiKey)); assert.ok(!request.options.body.includes('private'));
  assert.equal(JSON.parse(request.options.body).store, false);
  await assert.rejects(localize({ apiKey, model: 'gpt-4.1-mini', payload }, async () => Response.json({ error: { message: apiKey } }, { status: 401 })), error => !error.message.includes(apiKey) && error.message.includes('відхилив'));
});
