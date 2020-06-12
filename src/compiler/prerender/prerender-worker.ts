import * as d from '../../declarations';
import { addModulePreloads, excludeStaticComponents, minifyScriptElements, minifyStyleElements, removeModulePreloads, removeStencilScripts } from './prerender-optimize';
import { catchError, normalizePath, isPromise, requireFunc, IS_NODE_ENV, IS_DENO_ENV, isRootPath } from '@utils';
import { crawlAnchorsForNextUrls } from './crawl-urls';
import { getHydrateOptions } from './prerender-hydrate-options';
import { getPrerenderConfig } from './prerender-config';
import { patchNodeGlobal, patchWindowGlobal } from './prerender-global-patch';
import { dirname } from 'path';
import type { Deno as DenoType } from '../../../types/lib.deno';

const prerenderCtx = {
  componentGraph: null as Map<string, string[]>,
  prerenderConfig: null as d.PrerenderConfig,
  ensuredDirs: new Set<string>(),
  templateHtml: null as string,
};

export const prerenderWorker = async (prerenderRequest: d.PrerenderUrlRequest) => {
  // worker thread!
  const results: d.PrerenderUrlResults = {
    diagnostics: [],
    anchorUrls: [],
    filePath: prerenderRequest.writeToFilePath,
  };

  try {
    const url = new URL(prerenderRequest.url, prerenderRequest.devServerHostUrl);
    const componentGraph = getComponentGraph(prerenderRequest.componentGraphPath);

    // webpack work-around/hack
    const hydrateApp = requireFunc(prerenderRequest.hydrateAppFilePath);

    if (prerenderCtx.templateHtml == null) {
      // cache template html in this process
      prerenderCtx.templateHtml = prerenderReadFileSync(prerenderRequest.templateId);
    }

    // create a new window by cloning the cached parsed window
    const win = hydrateApp.createWindowFromHtml(prerenderCtx.templateHtml, prerenderRequest.templateId);
    const doc = win.document;

    // patch this new window
    patchNodeGlobal(globalThis, prerenderRequest.devServerHostUrl);
    patchWindowGlobal(globalThis, win);

    if (prerenderCtx.prerenderConfig == null) {
      prerenderCtx.prerenderConfig = getPrerenderConfig(results.diagnostics, prerenderRequest.prerenderConfigPath);
    }
    const prerenderConfig = prerenderCtx.prerenderConfig;

    const hydrateOpts = getHydrateOptions(prerenderConfig, url, results.diagnostics);

    if (prerenderRequest.staticSite || hydrateOpts.staticDocument) {
      hydrateOpts.addModulePreloads = false;
      hydrateOpts.clientHydrateAnnotations = false;
    }

    if (typeof prerenderConfig.beforeHydrate === 'function') {
      try {
        const rtn = prerenderConfig.beforeHydrate(doc, url);
        if (isPromise(rtn)) {
          await rtn;
        }
      } catch (e) {
        catchError(results.diagnostics, e);
      }
    }

    // parse the html to dom nodes, hydrate the components, then
    // serialize the hydrated dom nodes back to into html
    const hydrateResults = (await hydrateApp.hydrateDocument(doc, hydrateOpts)) as d.HydrateResults;
    results.diagnostics.push(...hydrateResults.diagnostics);

    if (hydrateOpts.staticDocument) {
      removeStencilScripts(doc);
      removeModulePreloads(doc);
    } else {
      if (Array.isArray(hydrateOpts.staticComponents)) {
        excludeStaticComponents(doc, hydrateOpts, hydrateResults);
      }

      if (hydrateOpts.addModulePreloads) {
        if (!prerenderRequest.isDebug) {
          addModulePreloads(doc, hydrateOpts, hydrateResults, componentGraph);
        }
      } else {
        // remove module preloads
        removeModulePreloads(doc);
      }
    }

    const minifyPromises: Promise<any>[] = [];
    if (hydrateOpts.minifyStyleElements && !prerenderRequest.isDebug) {
      minifyPromises.push(minifyStyleElements(doc, false));
    }

    if (hydrateOpts.minifyScriptElements && !prerenderRequest.isDebug) {
      minifyPromises.push(minifyScriptElements(doc, false));
    }

    if (minifyPromises.length > 0) {
      await Promise.all(minifyPromises);
    }

    if (typeof prerenderConfig.afterHydrate === 'function') {
      try {
        const rtn = prerenderConfig.afterHydrate(doc, url);
        if (isPromise(rtn)) {
          await rtn;
        }
      } catch (e) {
        catchError(results.diagnostics, e);
      }
    }

    if (typeof hydrateResults.httpStatus === 'number' && hydrateResults.httpStatus >= 400) {
      try {
        win.close();
      } catch (e) {}
      return results;
    }

    const html = hydrateApp.serializeDocumentToString(doc, hydrateOpts);

    if (prerenderConfig.crawlUrls !== false) {
      const baseUrl = new URL(prerenderRequest.baseUrl);
      results.anchorUrls = crawlAnchorsForNextUrls(prerenderConfig, results.diagnostics, baseUrl, url, hydrateResults.anchors);
    }

    if (typeof prerenderConfig.filePath === 'function') {
      try {
        const userWriteToFilePath = prerenderConfig.filePath(url, results.filePath);
        if (typeof userWriteToFilePath === 'string') {
          results.filePath = userWriteToFilePath;
        }
      } catch (e) {
        catchError(results.diagnostics, e);
      }
    }

    await writePrerenderedHtml(results, html);

    try {
      win.close();
    } catch (e) {}
  } catch (e) {
    // ahh man! what happened!
    catchError(results.diagnostics, e);
  }

  return results;
};

const getComponentGraph = (componentGraphPath: string) => {
  if (componentGraphPath == null) {
    return undefined;
  }
  if (prerenderCtx.componentGraph == null) {
    const componentGraphJson = JSON.parse(prerenderReadFileSync(componentGraphPath));
    prerenderCtx.componentGraph = new Map<string, string[]>(Object.entries(componentGraphJson));
  }
  return prerenderCtx.componentGraph;
};

const writePrerenderedHtml = async (results: d.PrerenderUrlResults, html: string) => {
  prerenderEnsureDir(results.filePath);

  if (IS_NODE_ENV) {
    const fs: typeof import('fs') = requireFunc('fs');
    await new Promise(resolve => {
      fs.writeFile(results.filePath, html, (err: any) => {
        if (err != null) {
          results.filePath = null;
          catchError(results.diagnostics, err);
        }
        resolve();
      });
    });
  } else if (IS_DENO_ENV) {
    const encoder = new TextEncoder();
    const data = encoder.encode(html);
    await Deno.writeFile(results.filePath, data);
  }
};

const prerenderEnsureDir = (p: string) => {
  const allDirs: string[] = [];

  while (true) {
    p = normalizePath(dirname(p));
    if (typeof p === 'string' && p.length > 0 && !isRootPath(p)) {
      allDirs.push(p);
    } else {
      break;
    }
  }

  allDirs.reverse();

  for (let i = 0; i < allDirs.length; i++) {
    const dir = allDirs[i];
    if (!prerenderCtx.ensuredDirs.has(dir)) {
      prerenderCtx.ensuredDirs.add(dir);
      prerenderMkDirSync(dir);
    }
  }
};

const prerenderReadFileSync = (p: string) => {
  if (IS_NODE_ENV) {
    const fs: typeof import('fs') = requireFunc('fs');
    return fs.readFileSync(p, 'utf8');
  }
  if (IS_DENO_ENV) {
    const decoder = new TextDecoder('utf-8');
    const data = Deno.readFileSync(p);
    return decoder.decode(data);
  }
  return null;
};

const prerenderMkDirSync = (dir: string) => {
  try {
    if (IS_NODE_ENV) {
      const fs: typeof import('fs') = requireFunc('fs');
      fs.mkdirSync(dir);
    } else if (IS_DENO_ENV) {
      Deno.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {}
};

declare const Deno: typeof DenoType;
