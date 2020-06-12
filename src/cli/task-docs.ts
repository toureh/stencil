import * as d from '../declarations';
import { isOutputTargetDocs } from '../compiler/output-targets/output-utils';
import { startupLog } from './startup-log';

export async function taskDocs(config: d.Config) {
  config.devServer = null;
  config.outputTargets = config.outputTargets.filter(isOutputTargetDocs);
  config.devMode = true;

  const compilerPath = config.sys.getCompilerExecutingPath();
  const coreCompiler: typeof import('@stencil/core/compiler') = await import(compilerPath);

  startupLog(config, coreCompiler);

  const compiler = await coreCompiler.createCompiler(config);
  await compiler.build();

  await compiler.destroy();
}
