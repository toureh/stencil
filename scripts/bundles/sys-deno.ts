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

  const sysNodeBundle: RollupOptions = {
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

  const srcWorker = join(opts.bundleHelpersDir, 'deno-init-worker.js');
  const destWorker = join(opts.output.sysDenoDir, 'init-worker.js');

  return [sysNodeBundle];
}
