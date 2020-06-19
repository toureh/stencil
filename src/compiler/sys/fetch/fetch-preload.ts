import * as d from '../../../declarations';
import { dependencies, getRemoteDependencyUrl } from '../dependencies';
import { getNodeModulePath } from '../resolve/resolve-utils';
import { httpFetch, isExternalUrl } from './fetch-utils';
import { IS_BROWSER_ENV, IS_DENO_ENV, IS_FETCH_ENV } from '@utils';

export const fetchPreloadFs = async (config: d.Config, inMemoryFs: d.InMemoryFileSystem) => {
  if ((IS_BROWSER_ENV || IS_DENO_ENV) && IS_FETCH_ENV) {
    const timespace = config.logger.createTimeSpan(`fetchPreloadFs start`, true);
    const preloadUrls = getCoreFetchPreloadUrls(config, config.sys.getCompilerExecutingPath());

    await Promise.all(
      preloadUrls.map(async preload => {
        try {
          const fileExists = await inMemoryFs.access(preload.filePath);
          if (!fileExists) {
            const rsp = await httpFetch(config.sys, preload.url);
            if (rsp.ok) {
              const content = await rsp.clone().text();
              await inMemoryFs.writeFile(preload.filePath, content);
              config.logger.debug('fetchPreloadFs', preload.url, preload.filePath);
            } else {
              config.logger.warn('fetchPreloadFs', preload.url, rsp.status);
            }
          }
        } catch (e) {
          config.logger.error(e);
        }
      }),
    );

    await inMemoryFs.commit();
    timespace.finish(`fetchPreloadFs end`);
  }
};

const getCoreFetchPreloadUrls = (config: d.Config, compilerUrl: string) => {
  if (!isExternalUrl(compilerUrl)) {
    compilerUrl = getRemoteDependencyUrl(config.sys, '@stencil/core');
  }
  config.logger.debug('getCoreFetchPreloadUrls', compilerUrl);

  const stencilCoreBase = new URL('..', compilerUrl);
  const stencilResourcePaths = IS_BROWSER_ENV ? dependencies.find(dep => dep.name === '@stencil/core').resources : [];
  const tsLibBase = new URL('..', getRemoteDependencyUrl(config.sys, 'typescript'));
  const tsResourcePaths = dependencies.find(dep => dep.name === 'typescript').resources;

  return [
    ...stencilResourcePaths.map(p => {
      return {
        url: new URL(p, stencilCoreBase).href,
        filePath: getNodeModulePath(config.rootDir, '@stencil', 'core', p),
      };
    }),
    ...tsResourcePaths.map(p => {
      return {
        url: new URL(p, tsLibBase).href,
        filePath: getNodeModulePath(config.rootDir, 'typescript', p),
      };
    }),
  ];
};
