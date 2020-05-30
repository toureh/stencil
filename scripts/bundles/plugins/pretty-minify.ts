import { BuildOptions } from '../../utils/options';
import { Plugin, OutputChunk } from 'rollup';
import terser from 'terser';

export function prettyMinifyPlugin(opts: BuildOptions): Plugin {
  if (opts.isProd) {
    return {
      name: 'prettyMinifyPlugin',
      generateBundle(_, bundles) {
        Object.keys(bundles).forEach(fileName => {
          const b = bundles[fileName] as OutputChunk;
          if (typeof b.code === 'string') {
            const minifyResults = terser.minify(b.code, {
              compress: { hoist_vars: true, hoist_funs: true, ecma: 2017, keep_fnames: true, keep_classnames: true },
              output: { ecma: 2017, indent_level: 2, beautify: true, comments: false },
            });
            if (minifyResults.error) {
              throw minifyResults.error;
            }
            b.code = minifyResults.code;
          }
        });
      },
    };
  }
}
