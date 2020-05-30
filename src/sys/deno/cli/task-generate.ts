import * as d from '../../../declarations';

export async function taskGenerate(config: d.Config) {
  config.logger.error(`"generate" command not implemented (yet)`);
  config.sys.exit(1);
}
