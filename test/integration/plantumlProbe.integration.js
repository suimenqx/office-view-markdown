/**
 * Integration: mock PlantUML HTTP server + probePlantumlServer / URL helpers.
 * Also asserts installed extension packaging privacy defaults.
 */
const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { buildSync } = require('esbuild');

const MINIMAL_SVG = '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="green"/></svg>';
const INSTALLED_EXT_GLOB = '/home/box/.vscode/extensions/suimenqx.office-view-markdown-0.1.0';

function loadPlantumlServerModule() {
  const entry = path.join(__dirname, '..', '..', 'src', 'common', 'plantumlServer.ts');
  const outfile = path.join(os.tmpdir(), `plantumlServer-integ-${process.pid}.cjs`);
  buildSync({
    entryPoints: [entry],
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

function startMockServer() {
  const hits = [];
  const server = http.createServer((req, res) => {
    hits.push({ method: req.method, url: req.url, headers: { ...req.headers } });
    // Accept any path that looks like PlantUML render (/svg/~1... or ending with plantuml render)
    if (/\/svg\/~1/i.test(req.url) || /\/png\/~1/i.test(req.url) || /plantuml/i.test(req.url)) {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
      res.end(MINIMAL_SVG);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port, hits, base: `http://127.0.0.1:${port}/plantuml` });
    });
  });
}

async function main() {
  const {
    normalizePlantumlServerBase,
    isPlantumlServerConfigured,
    buildPlantumlRenderUrl,
    buildPlantumlTestUrl,
    probePlantumlServer,
    PLANTUML_TEST_ENCODED,
    PLANTUML_SERVER_SETTING_KEY,
  } = loadPlantumlServerModule();

  // --- Installed extension packaging checks ---
  assert.ok(fs.existsSync(INSTALLED_EXT_GLOB), `installed extension missing: ${INSTALLED_EXT_GLOB}`);
  const pkg = JSON.parse(fs.readFileSync(path.join(INSTALLED_EXT_GLOB, 'package.json'), 'utf8'));
  assert.strictEqual(pkg.name, 'office-view-markdown');
  assert.ok(
    (pkg.contributes.commands || []).some((c) => c.command === 'office-view-markdown.plantuml.testServer'),
    'testServer command must be packaged',
  );
  const sections = Array.isArray(pkg.contributes.configuration)
    ? pkg.contributes.configuration
    : [pkg.contributes.configuration];
  const setting = sections
    .map((s) => s.properties && s.properties['office-view-markdown.plantuml.server'])
    .find(Boolean);
  assert.ok(setting, 'Settings key office-view-markdown.plantuml.server must be present');
  assert.strictEqual(setting.default, '', 'unconfigured default must be empty string');
  assert.strictEqual(PLANTUML_SERVER_SETTING_KEY, 'office-view-markdown.plantuml.server');

  const minJs = fs.readFileSync(path.join(INSTALLED_EXT_GLOB, 'resource/markdown/dist/index.min.js'), 'utf8');
  assert.ok(!/https?:\/\/(www\.)?plantuml\.com/i.test(minJs), 'packaged vditor must not hardcode plantuml.com URL');
  assert.ok(/vditor-actionable-empty-state/.test(minJs), 'actionable state class must exist in packaged bundle');
  assert.ok(/PlantUML Server is not configured/.test(minJs), 'actionable state title must exist');
  assert.ok(/Open Settings/.test(minJs), 'Open Settings action must exist');
  assert.ok(/onOpenPlantumlSettings/.test(minJs), 'open-settings callback path must exist');

  const extJs = fs.readFileSync(path.join(INSTALLED_EXT_GLOB, 'out/extension.js'), 'utf8');
  assert.ok(/plantuml\.testServer/.test(extJs), 'extension host registers testServer');
  assert.ok(/openSettings/.test(extJs) || /workbench\.action\.openSettings/.test(extJs), 'settings open path present');
  assert.ok(!/Authorization|Bearer /.test(extJs.match(/plantuml[\s\S]{0,800}/gi)?.join('\n') || ''), 'no auth in plantuml vicinity');

  // Unconfigured helpers
  assert.strictEqual(isPlantumlServerConfigured(''), false);
  assert.throws(() => buildPlantumlRenderUrl('', 'ABC'), /not configured/);

  const mock = await startMockServer();
  try {
    const testUrl = buildPlantumlTestUrl(mock.base);
    assert.ok(testUrl.includes(`/svg/~1${PLANTUML_TEST_ENCODED}`), `unexpected test url: ${testUrl}`);
    assert.strictEqual(
      buildPlantumlRenderUrl(mock.base, 'XYZ'),
      `http://127.0.0.1:${mock.port}/plantuml/svg/~1XYZ`,
    );

    const unconfigured = await probePlantumlServer('');
    assert.strictEqual(unconfigured.ok, false);
    assert.match(unconfigured.reason, /not configured/i);

    const ok = await probePlantumlServer(mock.base);
    assert.strictEqual(ok.ok, true, `probe should succeed: ${JSON.stringify(ok)}`);
    assert.strictEqual(ok.status, 200);
    assert.ok(ok.contentType && /svg|image/i.test(ok.contentType), `content-type: ${ok.contentType}`);

    assert.ok(mock.hits.length >= 1, 'mock server should have received at least one request');
    assert.ok(mock.hits.every((h) => !/plantuml\.com/i.test(h.url)), 'must not call plantuml.com');
    const authHeader = mock.hits.some((h) => h.headers.authorization);
    assert.strictEqual(authHeader, false, 'must not send Authorization header');

    // Bad content-type path
    const badServer = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('hello');
    });
    await new Promise((r) => badServer.listen(0, '127.0.0.1', r));
    const badPort = badServer.address().port;
    try {
      const bad = await probePlantumlServer(`http://127.0.0.1:${badPort}/plantuml`);
      assert.strictEqual(bad.ok, false);
      assert.match(bad.reason, /not an image/i);
    } finally {
      await new Promise((r) => badServer.close(r));
    }

    console.log(JSON.stringify({
      ok: true,
      installedExt: INSTALLED_EXT_GLOB,
      mockBase: mock.base,
      testUrl,
      probe: ok,
      hits: mock.hits.map((h) => ({ method: h.method, url: h.url })),
      checks: {
        unconfiguredPrivacy: true,
        settingsKeyPresent: true,
        testServerCommandRegistered: true,
        configuredUrlBuild: true,
        probeAgainstMock: true,
      },
    }, null, 2));
    console.log('plantumlProbe integration passed');
  } finally {
    await new Promise((r) => mock.server.close(r));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
