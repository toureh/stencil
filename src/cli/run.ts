import type { CliInitOptions } from '../declarations';
import { hasError, shouldIgnoreError } from '@utils';
import { loadCoreCompiler } from './load-compiler';
import { parseFlags } from './parse-flags';
import { taskBuild } from './task-build';
import { taskDocs } from './task-docs';
import { taskGenerate } from './task-generate';
import { taskHelp } from './task-help';
import { taskInfo } from './task-info';
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

    const coreCompiler = await loadCoreCompiler(sys);
    if (flags.task === 'version' || flags.version) {
      return taskVersion(coreCompiler);
    }

    if (flags.task === 'help' || flags.help) {
      return taskHelp(sys, logger);
    }

    if (flags.task === 'info') {
      return taskInfo(coreCompiler, sys, logger);
    }

    const validated = await coreCompiler.loadConfig({
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
        await taskBuild(coreCompiler, validated.config, checkVersion);
        break;

      case 'docs':
        await taskDocs(coreCompiler, validated.config);
        break;

      case 'generate':
      case 'g':
        await taskGenerate(coreCompiler, validated.config);
        break;

      case 'prerender':
        await taskPrerender(coreCompiler, validated.config);
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
