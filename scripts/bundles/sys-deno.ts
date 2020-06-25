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
      aliasPlugin(opts),
      prettyMinifyPlugin(opts),
    ],
  };

  const inputNodeCompatFile = join(opts.transpiledDir, 'sys', 'deno', 'deno-node-compat.js');
  const outputNodeCompatFile = join(opts.output.sysDenoDir, 'node-compat.js');
  const sysDenoNodeCompatBundle: RollupOptions = {
    input: inputNodeCompatFile,
    output: {
      format: 'esm',
      file: outputNodeCompatFile,
      preferConst: true,
    },
    plugins: [
      {
        name: 'denoNodeCompatPlugin',
        resolveId(importee) {
          if (importee.endsWith('process.ts')) {
            return join(opts.transpiledDir, 'sys', 'deno', 'deno-node-process.js');
          }
          return null;
        },
      },
      aliasPlugin(opts),
      denoStdPlugin(),
      prettyMinifyPlugin(opts),
    ],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false,
    },
  };

  return [sysDenoBundle, sysDenoWorkerBundle, sysDenoNodeCompatBundle];
}
