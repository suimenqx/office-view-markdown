const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const pkg = require(path.join(root, 'package.json'));
assert.deepStrictEqual(pkg.galleryBanner, { color: '#0d1117', theme: 'dark' });
for (const command of pkg.contributes.commands) {
  assert.strictEqual(command.category, 'Office View Markdown', `${command.command} category`);
}
const css = fs.readFileSync(path.join(root, 'vditor/src/assets/less/_reset.less'), 'utf8');
assert.ok(css.includes('text-underline-offset: 2px'));
assert.ok(css.includes('height: 1px'));
assert.ok(css.includes('box-shadow: inset 0 -1px 0'));
console.log('marketplace polish unit tests passed');
