import fs from 'fs-extra';
import { join } from 'path';
import rollupCommonjs from '@rollup/plugin-commonjs';
import rollupResolve from '@rollup/plugin-node-resolve';
import { aliasPlugin } from './plugins/alias-plugin';
import { relativePathPlugin } from './plugins/relative-path-plugin';
import { replacePlugin } from './plugins/replace-plugin';
import { writePkgJson } from '../utils/write-pkg-json';
import { BuildOptions } from '../utils/options';
import { RollupOptions } from 'rollup';
import { prettyMinifyPlugin } from './plugins/pretty-minify';

export async function cliDeno(opts: BuildOptions) {
  const inputDir = join(opts.transpiledDir, 'sys', 'deno', 'cli');

  const outDir = join(opts.output.cliDir, 'node');
  await fs.emptyDir(outDir);

  // create public d.ts
  let dts = await fs.readFile(join(inputDir, 'public.d.ts'), 'utf8');
  dts = dts.replace('@stencil/core/internal', '../../internal/index');
  await fs.writeFile(join(outDir, 'index.d.ts'), dts);

  const cliBundle: RollupOptions = {
    input: join(inputDir, 'index.js'),
    output: {
      format: 'es',
      file: join(outDir, 'index.js'),
      esModule: false,
      preferConst: true,
    },
    plugins: [
      relativePathPlugin('@stencil/core/compiler', '../../compiler/stencil.js'),
      relativePathPlugin('@stencil/core/dev-server', '../../dev-server/index.js'),
      relativePathPlugin('@stencil/core/mock-doc', '../../mock-doc/index.mjs'),
      aliasPlugin(opts),
      replacePlugin(opts),
      rollupResolve({
        preferBuiltins: true,
      }),
      rollupCommonjs(),
      prettyMinifyPlugin(opts),
    ],
    treeshake: {
      moduleSideEffects: false,
    },
  };

  const cliWorkerBundle: RollupOptions = {
    input: join(inputDir, 'worker.js'),
    output: {
      format: 'es',
      file: join(outDir, 'worker.js'),
      esModule: false,
      preferConst: true,
    },
    plugins: [
      relativePathPlugin('@stencil/core/compiler', '../../compiler/stencil.js'),
      relativePathPlugin('@stencil/core/mock-doc', '../../mock-doc/index.mjs'),
      aliasPlugin(opts),
      replacePlugin(opts),
      rollupResolve({
        preferBuiltins: true,
      }),
      rollupCommonjs(),
    ],
    treeshake: {
      moduleSideEffects: false,
    },
  };

  return [cliBundle, cliWorkerBundle];
}
