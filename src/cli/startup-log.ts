import type { Config } from '../declarations';
import type { CoreCompiler } from './load-compiler';

export function startupLog(coreCompiler: CoreCompiler, config: Config) {
  if (config.suppressLogs === true) {
    return;
  }

  const { logger, sys } = config;
  const sysDetails = sys.details;
  const isDebug = logger.getLevel() === 'debug';
  const isPrerelease = coreCompiler.version.includes('-');
  const isDevBuild = coreCompiler.version.includes('-dev.');

  let startupMsg = logger.cyan(`@stencil/core`);

  if (isDevBuild) {
    startupMsg += ' ' + logger.yellow('[DEV]');
  } else {
    startupMsg += ' ' + logger.cyan(`v${coreCompiler.version}`);
  }
  startupMsg += logger.emoji(' ' + coreCompiler.vermoji);

  logger.info(startupMsg);

  if (isPrerelease && !isDevBuild) {
    logger.warn(
      logger.yellow(
        `This is a prerelease build, undocumented changes might happen at any time. Technical support is not available for prereleases, but any assistance testing is appreciated.`,
      ),
    );
  }

  if (config.devMode && !isDebug) {
    if (config.buildEs5) {
      logger.warn(
        `Generating ES5 during development is a very task expensive, initial and incremental builds will be much slower. Drop the '--es5' flag and use a modern browser for development.`,
      );
    }

    if (!config.enableCache) {
      logger.warn(`Disabling cache during development will slow down incremental builds.`);
    }
  }

  const runtimeInfo = `${sysDetails.runtime} ${sysDetails.runtimeVersion}`;
  const platformInfo = `${sysDetails.platform}, ${sysDetails.cpuModel}`;
  const statsInfo = `cpus: ${sysDetails.cpus}, freemem: ${Math.round(sysDetails.freemem() / 1000000)}MB, totalmem: ${Math.round(sysDetails.totalmem / 1000000)}MB`;

  if (isDebug) {
    logger.debug(runtimeInfo);
    logger.debug(platformInfo);
    logger.debug(statsInfo);
    logger.debug(`compiler: ${config.sys.getCompilerExecutingPath()}`);
    logger.debug(`build: ${coreCompiler.buildId}`);
  } else if (config.flags && config.flags.ci) {
    logger.info(runtimeInfo);
    logger.info(platformInfo);
    logger.info(statsInfo);
  }
}
