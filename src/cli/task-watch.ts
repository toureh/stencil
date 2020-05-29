import * as d from '../declarations';
import { checkVersion } from './task-version';
import { runPrerenderTask } from './task-prerender';
import { startupLog } from './startup-log';

export async function taskWatch(config: d.Config) {
  startupLog(config);

  let devServer: d.DevServer = null;
  let exitCode = 0;

  try {
    const { createCompiler, version } = await import('@stencil/core/compiler');
    const checkVersionPromise = checkVersion(config, version);

    const compiler = await createCompiler(config);
    const watcher = await compiler.createWatcher();

    if (config.flags.serve) {
      const { startServer } = await import('@stencil/core/dev-server');
      devServer = await startServer(config.devServer, config.logger, watcher);
    }

    config.sys.onProcessInterrupt(() => {
      compiler.destroy();
    });

    const checkVersionResults = await checkVersionPromise;
    checkVersionResults();

    if (devServer) {
      const rmDevServerLog = watcher.on('buildFinish', () => {
        // log the dev server url one time
        config.logger.info(`${config.logger.cyan(devServer.browserUrl)}\n`);
        rmDevServerLog();
      });
    }

    if (config.flags.prerender) {
      watcher.on('buildFinish', async results => {
        if (!results.hasError) {
          const prerenderDiagnostics = await runPrerenderTask(config, devServer, results.hydrateAppFilePath, results.componentGraph, null);
          config.logger.printDiagnostics(prerenderDiagnostics);
        }
      });
    }

    const closeResults = await watcher.start();
    if (closeResults.exitCode > 0) {
      exitCode = closeResults.exitCode;
    }
  } catch (e) {
    exitCode = 1;
    config.logger.error(e);
  }

  if (devServer) {
    await devServer.close();
  }

  if (exitCode > 0) {
    config.sys.exit(exitCode);
  }
}
