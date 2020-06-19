import fs from 'fs-extra';
import { join } from 'path';
import { aliasPlugin } from './plugins/alias-plugin';
import { BuildOptions } from '../utils/options';
import { RollupOptions } from 'rollup';
import { prettyMinifyPlugin } from './plugins/pretty-minify';
import { denoStdPlugin } from './plugins/deno-std-plugin';

export async function sysDeno(opts: BuildOptions) {
  const inputFile = join(opts.transpiledDir, 'sys', 'deno', 'index.js');
  const outputFile = join(opts.output.sysDenoDir, 'index.js');

  const sysDenoBundle: RollupOptions = {
    input: inputFile,
    output: {
      format: 'esm',
      file: outputFile,
      preferConst: true,
    },
    plugins: [aliasPlugin(opts), prettyMinifyPlugin(opts), denoStdPlugin()],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false,
    },
  };

  const inputWorkerFile = join(opts.transpiledDir, 'sys', 'deno', 'worker.js');
  const outputWorkerFile = join(opts.output.sysDenoDir, 'worker.js');
  const sysDenoWorkerBundle: RollupOptions = {
    input: inputWorkerFile,
    output: {
      format: 'esm',
      file: outputWorkerFile,
      preferConst: true,
    },
    plugins: [
      prettyMinifyPlugin(opts),
      {
        name: 'sysDenoWorkerAlias',
        resolveId(id) {
          if (id === '@stencil/core/compiler') {
            return {
              id: '../../compiler/stencil.js',
              external: true,
            };
          }
        },
      },
    ],
  };

  return [sysDenoBundle, sysDenoWorkerBundle];
}
