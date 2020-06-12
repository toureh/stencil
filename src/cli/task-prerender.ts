import * as d from '../declarations';
import { catchError } from '@utils';
import { startupLog } from './startup-log';

export async function taskPrerender(config: d.Config) {
  const compilerPath = config.sys.getCompilerExecutingPath();
  const coreCompiler: typeof import('@stencil/core/compiler') = await import(compilerPath);

  startupLog(config, coreCompiler);

  const hydrateAppFilePath = config.flags.unknownArgs[0];

  if (typeof hydrateAppFilePath !== 'string') {
    config.logger.error(`Missing hydrate app script path`);
    config.sys.exit(1);
  }

  const srcIndexHtmlPath = config.srcIndexHtml;

  const diagnostics = await runPrerenderTask(coreCompiler, config, hydrateAppFilePath, null, srcIndexHtmlPath);
  config.logger.printDiagnostics(diagnostics);

  if (diagnostics.some(d => d.level === 'error')) {
    config.sys.exit(1);
  }
}

export async function runPrerenderTask(
  coreCompiler: typeof import('@stencil/core/compiler'),
  config: d.Config,
  hydrateAppFilePath: string,
  componentGraph: d.BuildResultsComponentGraph,
  srcIndexHtmlPath: string,
) {
  const diagnostics: d.Diagnostic[] = [];

  try {
    const prerenderer = await coreCompiler.createPrerenderer(config);
    const results = await prerenderer.start({
      hydrateAppFilePath,
      componentGraph,
      srcIndexHtmlPath,
    });

    diagnostics.push(...results.diagnostics);
  } catch (e) {
    catchError(diagnostics, e);
  }

  return diagnostics;
}
