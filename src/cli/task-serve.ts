import { Config } from '../declarations';
import { isString } from '@utils';

export async function taskServe(config: Config) {
  config.suppressLogs = true;

  config.flags.serve = true;
  config.devServer.openBrowser = config.flags.open;
  config.devServer.reloadStrategy = null;
  config.devServer.initialLoadUrl = '/';
  config.devServer.websocket = false;
  config.maxConcurrentWorkers = 1;
  config.devServer.root = isString(config.flags.root) ? config.flags.root : config.sys.getCurrentDirectory();

  const devServerPath = config.sys.getDevServerExecutingPath();
  const { start }: typeof import('@stencil/core/dev-server') = await import(devServerPath);
  const devServer = await start(config.devServer, config.logger);

  console.log(`${config.logger.cyan('     Root:')} ${devServer.root}`);
  console.log(`${config.logger.cyan('  Address:')} ${devServer.address}`);
  console.log(`${config.logger.cyan('     Port:')} ${devServer.port}`);
  console.log(`${config.logger.cyan('   Server:')} ${devServer.browserUrl}`);
  console.log(``);

  config.sys.onProcessInterrupt(() => {
    devServer && devServer.close();
  });
}
