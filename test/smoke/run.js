const path = require('path');
const { runTests } = require('/workspace/vscode-extension-dev/hello-extension/node_modules/@vscode/test-electron');

async function main() {
  const extensionDevelopmentPath = path.resolve(__dirname, '../..');
  const extensionTestsPath = path.resolve(__dirname, './index');
  // Point at the Electron binary (not bin/code CLI wrapper) so extension host tests actually launch.
  const vscodeExecutablePath = '/workspace/vscode-extension-dev/hello-extension/.vscode-test/vscode-linux-x64-1.136.1/code';
  const sampleWorkspace = path.resolve(__dirname, '../markdown');

  await runTests({
    vscodeExecutablePath,
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: [
      sampleWorkspace,
      '--disable-extensions',
      '--disable-workspace-trust',
    ],
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
