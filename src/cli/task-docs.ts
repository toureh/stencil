import * as d from '../declarations';
import { isOutputTargetDocs } from '../compiler/output-targets/output-utils';
import { startupLog } from './startup-log';

export async function taskDocs(config: d.Config) {
  config.devServer = null;
  config.outputTargets = config.outputTargets.filter(isOutputTargetDocs);
  config.devMode = true;

  startupLog(config);

  const { createCompiler } = await import('@stencil/core/compiler');
  const compiler = await createCompiler(config);
  await compiler.build();

  await compiler.destroy();
}
