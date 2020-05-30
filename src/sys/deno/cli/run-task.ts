import { Config, TaskCommand } from '../../../declarations';
import { taskBuild } from './task-build';
import { taskDocs } from '../../shared/cli/task-docs';
import { taskGenerate } from './task-generate';
import { taskHelp } from '../../shared/cli/task-help';
import { taskPrerender } from './task-prerender';
import { taskServe } from './task-serve';
import { taskTest } from '../../shared/cli/task-test';
import { taskVersion } from '../../shared/cli/task-version';

export async function runTask(config: Config, task: TaskCommand) {
  switch (task) {
    case 'build':
      await taskBuild(config);
      break;

    case 'docs':
      await taskDocs(config);
      break;

    case 'generate':
    case 'g':
      await taskGenerate(config);
      break;

    case 'help':
      taskHelp(config);
      break;

    case 'prerender':
      await taskPrerender(config);
      break;

    case 'serve':
      await taskServe(config);
      break;

    case 'test':
      await taskTest(config);
      break;

    case 'version':
      await taskVersion();
      break;

    default:
      config.logger.error(`${config.sys.details.platform !== 'windows' ? '❌ ' : ''} Invalid stencil command, please see the options below:`);
      taskHelp(config);
      config.sys.exit(1);
  }
}
