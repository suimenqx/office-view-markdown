const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');
const { runTests } = require('/workspace/_shared/vscode-extension-dev/hello-extension/node_modules/@vscode/test-electron');

const MINIMAL_SVG =
  '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="green"/></svg>';

function startMock() {
  const hits = [];
  const server = http.createServer((req, res) => {
    hits.push(req.url);
    if (/\/svg\/~1/i.test(req.url) || /\/png\/~1/i.test(req.url)) {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
      res.end(MINIMAL_SVG);
      return;
    }
    res.writeHead(404);
    res.end('nope');
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        server,
        hits,
        base: `http://127.0.0.1:${port}/plantuml`,
        port,
      });
    });
  });
}

async function main() {
  const mock = await startMock();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ovm-plantuml-ud-'));
  const userDir = path.join(userDataDir, 'User');
  fs.mkdirSync(userDir, { recursive: true });
  fs.writeFileSync(
    path.join(userDir, 'settings.json'),
    JSON.stringify(
      {
        'workbench.startupEditor': 'none',
        'telemetry.telemetryLevel': 'off',
        'security.workspace.trust.enabled': false,
        'office-view-markdown.plantuml.server': mock.base,
      },
      null,
      2,
    ),
  );

  const installedExt = '/home/box/.vscode/extensions/suimenqx.office-view-markdown-0.1.0';
  const vscodeExecutablePath =
    '/workspace/_shared/vscode-extension-dev/hello-extension/.vscode-test/vscode-linux-x64-1.136.1/code';
  const extensionTestsPath = path.resolve(__dirname, './index-plantuml');
  const sampleWorkspace = path.resolve(__dirname, '../markdown');

  console.log('mock plantuml base:', mock.base);
  console.log('userDataDir:', userDataDir);
  console.log('extensionDevelopmentPath (installed):', installedExt);

  try {
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath: installedExt,
      extensionTestsPath,
      launchArgs: [
        sampleWorkspace,
        '--disable-extensions',
        '--disable-workspace-trust',
        `--user-data-dir=${userDataDir}`,
      ],
    });
    console.log('smoke plantuml hits:', mock.hits);
    fs.writeFileSync(
      path.join(__dirname, '..', '..', 'test-results', 'plantuml-smoke-mock-hits.json'),
      JSON.stringify({ base: mock.base, hits: mock.hits }, null, 2),
    );
  } catch (err) {
    try {
      const writeHits = () => {
        fs.mkdirSync(path.join(__dirname, "..", "..", "test-results"), { recursive: true });
        fs.writeFileSync(
          path.join(__dirname, "..", "..", "test-results", "plantuml-smoke-mock-hits.json"),
          JSON.stringify({ base: mock.base, hits: mock.hits, error: String(err) }, null, 2),
        );
      };
      writeHits();
    } catch (_) {}
    throw err;
  } finally {
    await new Promise((r) => mock.server.close(r));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
