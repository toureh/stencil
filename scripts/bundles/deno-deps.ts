import fs from 'fs-extra';
import { join } from 'path';
import { BuildOptions } from '../utils/options';
import { RollupOptions, rollup } from 'rollup';
import fetch from 'node-fetch';
import ts from 'typescript';

export async function denoDeps(opts: BuildOptions) {
  const input = join(opts.bundleHelpersDir, 'path-utils-deno-source.js');
  const output = join(opts.transpiledDir, 'path-utils.js');

  if (!opts.isProd) {
    const exists = fs.existsSync(output);
    if (exists) {
      return;
    }
  }

  const denoBundle: RollupOptions = {
    input,
    plugins: [
      {
        name: 'denoDeps',
        resolveId(id, importer) {
          if (id.startsWith('http')) {
            return id;
          }
          if (importer && importer.startsWith('http')) {
            const url = new URL(id, importer);
            return url.href;
          }
          return null;
        },
        async load(id) {
          if (id.startsWith('http')) {
            const rsp = await fetch(id);
            return rsp.text();
          }
          return null;
        },
        transform(code, id) {
          if (id.endsWith('.ts')) {
            const output = ts.transpileModule(code, {
              compilerOptions: {
                target: ts.ScriptTarget.ES2018,
                module: ts.ModuleKind.ESNext,
              },
            });
            let outputText = output.outputText;
            outputText = outputText.replace(/Deno/g, 'pathCtx');
            return outputText;
          }
          return null;
        },
      },
    ],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false,
    },
  };

  const build = await rollup(denoBundle);
  await build.write({
    format: 'cjs',
    file: output,
    preferConst: true,
    esModule: false,
    strict: false,
    intro,
    outro,
    banner,
  });
}

const intro = `
export const getPathUtils = (pathConfig) => {

const exports = {};
const pathCtx = {
  build: { os: pathConfig.isWindows ? 'windows' : '' },
  cwd: () => '/',
  env: { get: () => null }
};

if (typeof process !== 'undefined') {
  pathCtx.cwd = () => process.cwd();
} else if (typeof Deno !== 'undefined') {
  pathCtx.cwd = () => Deno.cwd();
}
`;

const outro = `return exports;
};
`;

const banner = `/*! Copyright the Browserify authors, ported from Deno source.. MIT License. */`;
