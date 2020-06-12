import { CliInitOptions } from '../declarations';
import { hasError, shouldIgnoreError } from '@utils';
import { parseFlags } from './parse-flags';
import { taskBuild } from './task-build';
import { taskDocs } from './task-docs';
import { taskGenerate } from './task-generate';
import { taskHelp } from './task-help';
import { taskPrerender } from './task-prerender';
import { taskServe } from './task-serve';
import { taskTest } from './task-test';
import { taskVersion } from './task-version';

export async function run(init: CliInitOptions) {
  const { args, logger, sys, checkVersion } = init;

  try {
    const flags = parseFlags(args);

    if (flags.ci) {
      logger.enableColors(false);
    }

    if (flags.task === 'version' || flags.version) {
      return taskVersion(sys);
    }

    if (flags.task === 'help' || flags.help) {
      return taskHelp(sys, logger);
    }

    const compilerPath = sys.getCompilerExecutingPath();
    const { loadConfig }: typeof import('@stencil/core/compiler') = await import(compilerPath);

    const validated = await loadConfig({
      config: {
        flags,
      },
      configPath: flags.config,
      logger,
      sys,
    });

    if (validated.diagnostics.length > 0) {
      logger.printDiagnostics(validated.diagnostics);
      if (hasError(validated.diagnostics)) {
        sys.exit(1);
      }
    }

    switch (flags.task) {
      case 'build':
        await taskBuild(validated.config, checkVersion);
        break;

      case 'docs':
        await taskDocs(validated.config);
        break;

      case 'generate':
      case 'g':
        await taskGenerate(validated.config);
        break;

      case 'prerender':
        await taskPrerender(validated.config);
        break;

      case 'serve':
        await taskServe(validated.config);
        break;

      case 'test':
        await taskTest(validated.config);
        break;

      default:
        logger.error(`${logger.emoji('❌ ')}Invalid stencil command, please see the options below:`);
        taskHelp(sys, logger);
        sys.exit(1);
    }
  } catch (e) {
    if (!shouldIgnoreError(e)) {
      logger.error(`uncaught cli error: ${e}${logger.getLevel() === 'debug' ? e.stack : ''}`);
      sys.exit(1);
    }
  }
}
