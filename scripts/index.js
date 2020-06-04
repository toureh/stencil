const fs = require('fs');
const path = require('path');

function main() {
  const scriptsDir = __dirname;
  const rootDir = path.join(scriptsDir, '..');
  const scriptsBuildDir = path.join(scriptsDir, 'build');
  const scriptsNodeModulesDir = path.join(scriptsDir, 'node_modules');
  const scriptsBuildJs = path.join(scriptsBuildDir, 'build.js');
  const args = process.argv.slice(2);

  if (args.includes('--prepare') || !fs.existsSync(scriptsNodeModulesDir)) {
    console.log('💾  installing build scripts node_modules');
    const execa = require('execa');
    execa.sync('npm', ['i'], { cwd: scriptsDir });
  }

  if (args.includes('--prepare') || !fs.existsSync(scriptsBuildJs)) {
    // ensure we've transpiled the build scripts first
    console.log('🧩  transpiling build scripts');
    const tscPath = path.join(rootDir, 'node_modules', '.bin', 'tsc');
    const tsconfig = path.join(scriptsDir, 'tsconfig.json');
    const execa = require('execa');
    execa.sync(tscPath, ['-p', tsconfig], { cwd: scriptsDir });
  }

  const build = require(scriptsBuildJs);
  build.run(rootDir, args);
}

main();
