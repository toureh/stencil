import * as d from '../../../declarations';
import { buildId, vermoji, version } from '../../../version';

export function startupLog(config: d.Config) {
  if (config.suppressLogs === true) {
    return;
  }

  const { logger, sys } = config;
  const sysDetails = sys.details;
  const isDebug = logger.getLevel() === 'debug';
  const isPrerelease = version.includes('-');
  const isDevBuild = version.includes('-dev.');

  let startupMsg = logger.cyan(`@stencil/core`);

  if (isDevBuild) {
    startupMsg += ' ' + logger.yellow('[DEV]');
  } else {
    startupMsg += ' ' + logger.cyan(`v${version}`);
  }
  startupMsg += logger.emoji(' ' + vermoji);

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

  try {
    const platformInfo = `${sysDetails.platform}, ${sysDetails.cpuModel}`;
    const statsInfo = `cpus: ${sysDetails.cpus}, freemem: ${Math.round(sysDetails.freemem() / 1000000)}MB, totalmem: ${Math.round(sysDetails.totalmem / 1000000)}MB`;

    if (isDebug) {
      logger.debug(platformInfo);
      logger.debug(statsInfo);
    } else if (config.flags && config.flags.ci) {
      logger.info(platformInfo);
      logger.info(statsInfo);
    }

    logger.debug(`runtime: ${sysDetails.runtime} ${sysDetails.runtimeVersion}`);
    logger.debug(`compiler: ${config.sys.getCompilerExecutingPath()}`);
    logger.debug(`build: ${buildId}`);
  } catch (e) {
    logger.warn(e);
  }
}
