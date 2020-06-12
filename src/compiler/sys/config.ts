import * as d from '../../declarations';
import { createBrowserLogger } from './logger/browser-logger';
import { createSystem } from './stencil-sys';

export const getConfig = (userConfig: d.Config) => {
  const config = { ...userConfig };

  if (!config.logger) {
    config.logger = createBrowserLogger();
  }

  if (!config.sys) {
    config.sys = createSystem();
  }

  config.flags = config.flags || {};
  if (config.flags.debug || config.flags.verbose) {
    config.logLevel = 'debug';
  } else if (config.flags.logLevel) {
    config.logLevel = config.flags.logLevel;
  } else if (typeof config.logLevel !== 'string') {
    config.logLevel = 'info';
  }
  config.logger.setLevel(config.logLevel);

  return config;
};
