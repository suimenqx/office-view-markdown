const path = require('path');
const Mocha = require(path.join(
  '/workspace/vscode-extension-dev/hello-extension/node_modules/mocha'
));

function run() {
  const mocha = new Mocha({ ui: 'tdd', color: true, timeout: 60000 });
  mocha.addFile(path.join(__dirname, 'suite.js'));
  return new Promise((resolve, reject) => {
    try {
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { run };
