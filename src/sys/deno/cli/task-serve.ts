import * as d from '../../../declarations';

export async function taskServe(config: d.Config) {
  config.logger.error(`"serve" command not implemented (yet)`);
  config.sys.exit(1);
}
