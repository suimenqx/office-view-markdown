const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const fixturePath = path.join(root, 'test', 'markdown', 'UxPolish.md');
const fixture = fs.existsSync(fixturePath) ? fs.readFileSync(fixturePath, 'utf8') : '';

assert.ok(fs.existsSync(fixturePath), 'UX polish smoke fixture should exist');
for (const fragment of [
  'title:',
  '> [!NOTE]',
  '| Surface | Treatment |',
  '- [ ]',
  '![Reading Surface sample]',
  '```typescript',
  '```plantuml',
]) {
  assert.ok(fixture.includes(fragment), `fixture should include ${fragment}`);
}

const pkg = require(path.join(root, 'package.json'));
const markdownSection = pkg.contributes.configuration.find((section) => section.title === 'Markdown');
assert.ok(markdownSection, 'Markdown configuration section should exist');
assert.match(
  markdownSection.properties['office-view-markdown.editorFontSize'].markdownDescription,
  /^%config\.editorFontSize%$/,
);
assert.match(
  markdownSection.properties['office-view-markdown.frontMatterPresentation'].markdownDescription,
  /^%config\.frontMatterPresentation%$/,
);

for (const locale of ['', '.de', '.es', '.fr', '.ja', '.ko', '.pt-br', '.ru', '.zh-cn', '.zh-tw']) {
  const file = path.join(root, `package.nls${locale}.json`);
  const nls = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.ok(nls['config.editorFontSize'], `${file} should localize editorFontSize`);
  assert.ok(nls['config.frontMatterPresentation'], `${file} should localize frontMatterPresentation`);
}

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
assert.ok(readme.includes('office-view-markdown.editorFontSize'));
assert.ok(readme.includes('office-view-markdown.frontMatterPresentation'));
assert.ok(readme.includes('UxPolish.md'));

const context = fs.readFileSync(path.join(root, 'CONTEXT.md'), 'utf8');
assert.ok(context.includes('office-view-markdown.editorFontSize'));
assert.ok(context.includes('office-view-markdown.frontMatterPresentation'));

const smoke = fs.readFileSync(path.join(root, 'test', 'smoke', 'suite.js'), 'utf8');
assert.ok(smoke.includes("path.join(__dirname, '..', 'markdown', 'UxPolish.md')"));
assert.ok(smoke.includes('vditor-actionable-empty-state'));

console.log('smoke pack unit tests passed');
