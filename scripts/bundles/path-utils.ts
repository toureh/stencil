import fs from 'fs-extra';
import { join } from 'path';
import { BuildOptions } from '../utils/options';
import { RollupOptions, rollup } from 'rollup';
import { denoStdPlugin } from './plugins/deno-std-plugin';
import terser from 'terser';

export async function pathUtils(opts: BuildOptions) {
  const pathUtilsDir = join(opts.bundleHelpersDir, 'path-utils');
  const inputFile = join(pathUtilsDir, 'deno-source.js');
  const esmFile = join(pathUtilsDir, 'path-utils.js');
  const cjsFile = join(pathUtilsDir, 'path-utils.cjs.js');

  if (!opts.isProd) {
    const exists = fs.existsSync(esmFile);
    if (exists) {
      return;
    }
  }

  const denoBundle: RollupOptions = {
    input: inputFile,
    plugins: [denoStdPlugin()],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false,
    },
  };

  const build = await rollup(denoBundle);
  const esmOutput = await build.generate({
    format: 'cjs',
    file: esmFile,
    preferConst: true,
    esModule: false,
    strict: false,
    intro: esmIntro,
    outro,
  });

  let esmCode = esmOutput.output[0].code;
  esmCode = esmCode.replace(/Deno/g, 'ctx');

  const esmMinifyResults = terser.minify(esmCode, {
    ecma: 2018,
    compress: {
      passes: 2,
      ecma: 2018,
      module: true,
    },
    output: {
      ecma: 2018,
    },
  });

  if (esmMinifyResults.error) {
    throw esmMinifyResults.error;
  }

  await fs.writeFile(esmFile, esmMinifyResults.code);

  const cjsOutput = await build.generate({
    format: 'cjs',
    file: cjsFile,
    preferConst: true,
    esModule: false,
    strict: false,
    intro: cjsIntro,
    outro,
  });

  let cjsCode = esmOutput.output[0].code;
  cjsCode = cjsCode.replace(/Deno/g, 'ctx');

  const cjsMinifyResults = terser.minify(cjsCode, {
    ecma: 2018,
    compress: {
      passes: 2,
      ecma: 2018,
      module: true,
    },
    output: {
      ecma: 2018,
    },
  });

  if (cjsMinifyResults.error) {
    throw cjsMinifyResults.error;
  }

  await fs.writeFile(cjsFile, cjsMinifyResults.code);
}

const esmIntro = `
export const getPathUtils = (pathConfig) => {
  const exports = {};
  const ctx = {
    cwd: pathConfig.cwd,
    env: pathConfig.env,
    isWindows: !!pathConfig.isWindows
  };
`;

const cjsIntro = `
exports.getPathUtils = (pathConfig) => {
  const exports = {};
  const ctx = {
    cwd: pathConfig.cwd,
    env: pathConfig.env,
    isWindows: !!pathConfig.isWindows
  };
`;

const outro = `
  return exports;
};
`;
