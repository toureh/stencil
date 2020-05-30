import * as d from '../../../declarations';
import { catchError } from '@utils';
import { runPrerender } from '../../../prerender/prerender-main';
import { startupLog } from '../../shared/cli/startup-log';
import path from 'path';

export async function taskPrerender(config: d.Config) {
  startupLog(config);

  let hydrateAppFilePath = config.flags.unknownArgs[0];

  if (typeof hydrateAppFilePath !== 'string') {
    config.logger.error(`Missing hydrate app script path`);
    config.sys.exit(1);
  }

  if (!path.isAbsolute(hydrateAppFilePath)) {
    hydrateAppFilePath = path.join(config.cwd, hydrateAppFilePath);
  }

  const srcIndexHtmlPath = config.srcIndexHtml;

  const diagnostics = await runPrerenderTask(config, null, hydrateAppFilePath, null, srcIndexHtmlPath);
  config.logger.printDiagnostics(diagnostics);

  if (diagnostics.some(d => d.level === 'error')) {
    config.sys.exit(1);
  }
}

export async function runPrerenderTask(
  config: d.Config,
  devServer: d.DevServer,
  hydrateAppFilePath: string,
  componentGraph: d.BuildResultsComponentGraph,
  srcIndexHtmlPath: string,
) {
  const devServerConfig = { ...config.devServer };
  devServerConfig.openBrowser = false;
  devServerConfig.gzip = false;
  devServerConfig.logRequests = false;
  devServerConfig.reloadStrategy = null;

  let closeDevServer = false;
  if (!devServer) {
    const { startServer } = await import('@stencil/core/dev-server');
    devServer = await startServer(devServerConfig, config.logger);
    closeDevServer = true;
  }

  const diagnostics: d.Diagnostic[] = [];

  try {
    const prerenderDiagnostics = await runPrerender(__dirname, config, devServer, hydrateAppFilePath, componentGraph, srcIndexHtmlPath);
    diagnostics.push(...prerenderDiagnostics);
  } catch (e) {
    catchError(diagnostics, e);
  }

  if (devServer && closeDevServer) {
    await devServer.close();
  }

  return diagnostics;
}
