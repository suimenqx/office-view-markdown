const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const root = path.join(__dirname, '..', '..');

function loadModule(entryPoint, name) {
  const outfile = path.join(os.tmpdir(), `${name}-test-${process.pid}.cjs`);
  buildSync({
    entryPoints: [path.join(root, entryPoint)],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile,
    logLevel: 'silent',
  });
  try {
    delete require.cache[require.resolve(outfile)];
    return require(outfile);
  } finally {
    try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
  }
}

function source(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function main() {
  const position = loadModule('vditor/src/ts/util/documentPosition.ts', 'document-position');
  const target = loadModule('vditor/src/ts/util/documentTarget.ts', 'document-target');

  const kinds = ['link', 'link-ref', 'wikilink', 'wikilink-embed', 'image', 'html-inline', 'html-block'];
  for (const kind of kinds) {
    const focus = target.createDocumentTargetFocusAnchor(
      position.createDocumentPosition({
        mode: 'wysiwyg',
        surface: 'prose',
        blockKey: 'prose:0',
        anchor: 4,
        head: 4,
        presentation: 'edit',
      }),
      kind === 'html-block' ? 'content' : 'after',
    );
    const created = target.createDocumentTarget({
      kind,
      source: {
        display: 'Shown',
        destination: kind.startsWith('wiki') ? 'Page#frag' : 'https://example.com',
        source: kind.startsWith('html') ? '<span>x</span>' : 'https://example.com',
        displayRange: { start: 0, end: 5 },
        destinationRange: { start: 0, end: 18 },
        sourceRange: { start: 0, end: 18 },
      },
      editableFields: [
        { name: kind.startsWith('html') ? 'source' : 'destination', value: 'v' },
      ],
      hostOpen: kind.startsWith('html')
        ? null
        : {
            kind: kind.startsWith('wiki') ? 'wiki' : 'external',
            uri: kind.startsWith('wiki') ? 'wiki:Page#frag' : 'https://example.com',
          },
      focusAnchor: focus,
    });

    assert.strictEqual(created.version, 1);
    assert.strictEqual(created.kind, kind);
    assert.ok(created.identity.includes(kind));
    assert.strictEqual(created.source.display, 'Shown');
    assert.ok(created.source.displayRange);
    assert.ok(created.source.destinationRange || created.source.sourceRange);
    assert.strictEqual(created.activation.click, 'edit');
    assert.strictEqual(created.activation['alt-enter'], 'edit');
    if (created.hostOpen) {
      assert.strictEqual(created.activation['modified-click'], 'host-open');
      assert.strictEqual(created.activation.dblclick, 'host-open');
      assert.strictEqual(created.activation.auxclick, 'host-open');
    } else {
      assert.strictEqual(created.activation['modified-click'], 'edit');
    }
    assert.ok(created.focusAnchor);
    assert.strictEqual(created.focusAnchor.position.blockKey, 'prose:0');

    // Identity survives a re-render that keeps the same ADR 0010 position.
    const refreshed = target.createDocumentTarget({
      kind,
      source: created.source,
      editableFields: created.editableFields,
      hostOpen: created.hostOpen,
      focusAnchor: target.createDocumentTargetFocusAnchor(
        position.roundTripDocumentPosition(created.focusAnchor.position, 40),
        created.focusAnchor.edge,
      ),
    });
    assert.strictEqual(refreshed.identity, created.identity);
    assert.strictEqual(
      target.getDocumentTargetActivation(refreshed, 'click'),
      'edit',
    );
  }

  // Unified gesture grammar: no kind-specific divergence in the pure table.
  const withOpen = target.createDocumentTargetActivation({ kind: 'wiki', uri: 'wiki:Home' });
  const linkOpen = target.createDocumentTargetActivation({ kind: 'external', uri: 'https://example.com' });
  assert.deepStrictEqual(withOpen, linkOpen);

  // Source-policy: adapters consume document-target + ADR 0009/0010.
  const linkClick = source('vditor/src/ts/util/linkClick.ts');
  assert.match(linkClick, /createDocumentTarget/);
  assert.match(linkClick, /getDocumentTargetActivation/);
  assert.match(linkClick, /restoreDocumentTargetFocus/);
  assert.match(linkClick, /setSessionDocumentPosition/);

  const toolbar = source('vditor/src/ts/wysiwyg/highlightToolbarWYSIWYG.ts');
  assert.match(toolbar, /createDocumentTargetForElement/);
  assert.match(toolbar, /restoreDocumentTargetFocus/);
  assert.match(toolbar, /commitAuthoredEdit\(vditor, \{ intent: "linkHtml" \}\)/);
  assert.match(toolbar, /genWikiPopover/);

  // Continuous GUI save/cancel path: mutate once, hide once, restore once.
  const closePopover = toolbar.slice(
    toolbar.indexOf('const closeLinkPopover'),
    toolbar.indexOf('const focusEditorWithoutScroll'),
  );
  assert.match(closePopover, /mutate\(\);[\s\S]*hideLinkPopoverOnly\(vditor\);[\s\S]*restoreDocumentTargetFocus\(vditor, target, element\)/);
  for (const [start, end] of [
    ['export const genLinkRefPopover', 'const linkHotkey'],
    ['export const genAPopover', 'export const genImagePopoverForElement'],
    ['export const genImagePopoverForElement', 'export const genImagePopover ='],
    ['export const genWikiPopover', 'const linkRefFromSibling'],
  ]) {
    const adapter = toolbar.slice(toolbar.indexOf(start), toolbar.indexOf(end));
    assert.match(adapter, /function save[\s\S]*closeLinkPopover/);
    assert.match(adapter, /commitAuthoredEdit\(vditor, \{ intent: "linkHtml" \}\)/);
  }

  const html = source('vditor/src/ts/htmlInline/htmlInlineEditor.ts');
  assert.match(html, /restoreDocumentTargetFocus/);
  assert.match(html, /shouldEditDocumentTarget/);
  assert.match(html, /commitAuthoredEdit\(vditor, \{ intent: "linkHtml" \}\)/);
  const htmlSave = html.slice(html.indexOf('const save = () =>'), html.indexOf('const cancel = () =>'));
  assert.match(htmlSave, /notifyAfterHtmlEditorChange\(vditor\)/);
  assert.match(html, /closeHtmlEditorPopover\(vditor, focusElement\)/);
  assert.match(html, /restoreDocumentTargetFocus\(vditor, documentTarget, focusElement\)/);

  const wysiwyg = source('vditor/src/ts/wysiwyg/index.ts');
  assert.match(wysiwyg, /shouldEditDocumentTarget/);
  assert.match(wysiwyg, /genWikiPopover/);

  const host = source('resource/markdown/index.js');
  assert.match(host, /target\?\.hostOpen/);
  assert.match(host, /payload\.target\?\.activation/);

  const packageJson = JSON.parse(source('package.json'));
  const customEditor = packageJson.contributes.customEditors.find(
    (editor) => editor.viewType === 'office-view-markdown.markdownViewer',
  );
  assert.ok(customEditor, 'acceptance surface must remain markdownViewer');
  assert.ok(fs.existsSync(path.join(root, '.scratch/inline-object-activation/SMOKE.md')));

  console.log('document-target unit tests passed');
}

main();
