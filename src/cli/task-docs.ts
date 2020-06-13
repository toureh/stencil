import type { Config } from '../declarations';
import type { CoreCompiler } from './load-compiler';
import { isOutputTargetDocs } from '../compiler/output-targets/output-utils';
import { startupLog } from './startup-log';

export async function taskDocs(coreCompiler: CoreCompiler, config: Config) {
  config.devServer = null;
  config.outputTargets = config.outputTargets.filter(isOutputTargetDocs);
  config.devMode = true;

  startupLog(coreCompiler, config);

  const compiler = await coreCompiler.createCompiler(config);
  await compiler.build();

  await compiler.destroy();
}
