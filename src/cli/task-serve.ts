import * as d from '../declarations';
import { normalizePath } from '@utils';
import path from 'path';

export async function taskServe(config: d.Config) {
  config.suppressLogs = true;

  config.flags.serve = true;
  config.devServer.openBrowser = config.flags.open;
  config.devServer.reloadStrategy = null;
  config.devServer.initialLoadUrl = '/';
  config.devServer.websocket = false;
  config.maxConcurrentWorkers = 1;

  config.devServer.root = config.cwd;

  if (typeof config.flags.root === 'string') {
    if (!path.isAbsolute(config.flags.root)) {
      config.devServer.root = path.relative(config.cwd, config.flags.root);
    }
  }
  config.devServer.root = normalizePath(config.devServer.root);
  const absRoot = path.join(config.cwd, config.devServer.root);

  const { startServer } = await import('@stencil/core/dev-server');
  const devServer = await startServer(config.devServer, config.logger);

  console.log(`${config.logger.cyan('     Root:')} ${absRoot}`);
  console.log(`${config.logger.cyan('  Address:')} ${devServer.address}`);
  console.log(`${config.logger.cyan('     Port:')} ${devServer.port}`);
  console.log(`${config.logger.cyan('   Server:')} ${devServer.browserUrl}`);
  console.log(``);

  config.sys.onProcessInterrupt(() => {
    devServer && devServer.close();
  });
}
