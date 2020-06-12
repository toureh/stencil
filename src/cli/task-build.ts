import { Config, CheckVersion } from '../declarations';
import { runPrerenderTask } from './task-prerender';
import { startupLog } from './startup-log';
import { taskWatch } from './task-watch';

export async function taskBuild(config: Config, checkVersion: CheckVersion) {
  if (config.flags.watch) {
    // watch build
    await taskWatch(config, checkVersion);
    return;
  }

  // one-time build
  let exitCode = 0;

  try {
    const compilerPath = config.sys.getCompilerExecutingPath();
    const coreCompiler: typeof import('@stencil/core/compiler') = await import(compilerPath);
    startupLog(config, coreCompiler);

    const checkVersionPromise = checkVersion ? checkVersion(config, coreCompiler.version) : null;
    const compiler = await coreCompiler.createCompiler(config);
    const results = await compiler.build();

    await compiler.destroy();

    if (results.hasError) {
      exitCode = 1;
    } else if (config.flags.prerender) {
      const prerenderDiagnostics = await runPrerenderTask(coreCompiler, config, results.hydrateAppFilePath, results.componentGraph, null);
      config.logger.printDiagnostics(prerenderDiagnostics);

      if (prerenderDiagnostics.some(d => d.level === 'error')) {
        exitCode = 1;
      }
    }

    if (checkVersionPromise != null) {
      const checkVersionResults = await checkVersionPromise;
      checkVersionResults();
    }
  } catch (e) {
    exitCode = 1;
    config.logger.error(e);
  }

  if (exitCode > 0) {
    config.sys.exit(exitCode);
  }
}
