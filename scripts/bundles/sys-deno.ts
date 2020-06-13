import { join } from 'path';
import { aliasPlugin } from './plugins/alias-plugin';
import { BuildOptions } from '../utils/options';
import { RollupOptions, rollup } from 'rollup';
import { prettyMinifyPlugin } from './plugins/pretty-minify';
import { denoStdPlugin } from './plugins/deno-std-plugin';

export async function sysDeno(opts: BuildOptions) {
  const inputFile = join(opts.transpiledDir, 'sys', 'deno', 'index.js');
  const outputFile = join(opts.output.sysDenoDir, 'index.js');

  const sysNodeBundle: RollupOptions = {
    input: inputFile,
    plugins: [
      aliasPlugin(opts),
      prettyMinifyPlugin(opts),
      {
        name: 'denoPath',
        resolveId(id) {
          if (id === 'path') {
            return 'https://deno.land/std/path/mod.ts';
          }
          return null;
        },
      },
      denoStdPlugin(),
    ],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false,
    },
  };

  const build = await rollup(sysNodeBundle);
  await build.write({
    format: 'esm',
    file: outputFile,
    preferConst: true,
  });
}
