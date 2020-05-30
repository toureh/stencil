import * as d from '../../../declarations';
import { checkVersion } from '../../shared/cli/task-version';
import { startupLog } from '../../shared/cli/startup-log';
import { taskWatch } from './task-watch';

export async function taskBuild(config: d.Config) {
  if (config.flags.watch) {
    // watch build
    await taskWatch(config);
    return;
  }

  // one-time build
  startupLog(config);
  let exitCode = 0;

  try {
    const { createCompiler, version } = await import('@stencil/core/compiler');
    const checkVersionPromise = checkVersion(config, version);
    const compiler = await createCompiler(config);
    const results = await compiler.build();

    await compiler.destroy();

    if (results.hasError) {
      exitCode = 1;
    } else if (config.flags.prerender) {
      config.logger.error(`"--prerender" command not implemented (yet)`);
      config.sys.exit(1);
    }

    const checkVersionResults = await checkVersionPromise;
    checkVersionResults();
  } catch (e) {
    exitCode = 1;
    config.logger.error(e);
  }

  if (exitCode > 0) {
    config.sys.exit(exitCode);
  }
}
