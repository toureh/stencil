import * as d from '../../../declarations';

export async function taskPrerender(config: d.Config) {
  config.logger.error(`"prerender" command not implemented (yet)`);
  config.sys.exit(1);
}
