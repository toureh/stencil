import type {
  CompilerSystem,
  CompilerFsStats,
  CompilerSystemRenameResults,
  CompilerSystemRemoveDirectoryResults,
  CompilerSystemUnlinkResults,
  CompilerSystemMakeDirectoryResults,
  CompilerSystemWriteFileResults,
  Logger,
  PackageJsonData,
} from '../../declarations';
import { basename, delimiter, dirname, extname, isAbsolute, join, normalize, parse, relative, resolve, sep, win32, posix } from './deps';
import { createDenoWorkerMainController } from './deno-worker-main';
import { denoCopyTasks } from './deno-copy-tasks';
import { normalizePath, noop } from '@utils';
import type { Deno as DenoTypes } from '../../../types/lib.deno';
import type TypeScript from 'typescript';

export function createDenoSys(c: { Deno: any; logger: Logger }) {
  let tmpDir: string = null;
  const deno: typeof DenoTypes = c.Deno;
  const destroys = new Set<() => Promise<void> | void>();

  const getRemoteModuleUrl = (module: { moduleId: string; path: string; version?: string }) => {
    const npmBaseUrl = 'https://cdn.jsdelivr.net/npm/';
    const path = `${module.moduleId}${module.version ? '@' + module.version : ''}/${module.path}`;
    return new URL(path, npmBaseUrl).href;
  };

  const getModulePath = (rootDir: string, moduleId: string, path: string) => join(rootDir, 'node_modules', moduleId, path);

  const fetchAndWrite = async (opts: { url: string; filePath: string }) => {
    try {
      await deno.stat(opts.filePath);
      return;
    } catch (e) {}

    try {
      const rsp = await fetch(opts.url);
      if (rsp.ok) {
        const content = await rsp.clone().text();
        const encoder = new TextEncoder();
        await deno.writeFile(opts.filePath, encoder.encode(content));
        c.logger.debug('fetch', opts.url, opts.filePath);
      } else {
        c.logger.warn('fetch', opts.url, rsp.status);
      }
    } catch (e) {
      c.logger.error(e);
    }
  };

  const sys: CompilerSystem = {
    async access(p) {
      try {
        await deno.stat(p);
        return true;
      } catch (e) {
        return false;
      }
    },
    accessSync(p) {
      try {
        deno.statSync(p);
        return true;
      } catch (e) {
        return false;
      }
    },
    addDestory(cb) {
      destroys.add(cb);
    },
    removeDestory(cb) {
      destroys.delete(cb);
    },
    async copyFile(src, dst) {
      try {
        await deno.copyFile(src, dst);
        return true;
      } catch (e) {
        return false;
      }
    },
    createWorkerController: maxConcurrentWorkers => createDenoWorkerMainController(deno, sys, maxConcurrentWorkers),
    async destroy() {
      const waits: Promise<void>[] = [];
      destroys.forEach(cb => {
        try {
          const rtn = cb();
          if (rtn && rtn.then) {
            waits.push(rtn);
          }
        } catch (e) {
          console.error(`node sys destroy: ${e}`);
        }
      });
      await Promise.all(waits);
      destroys.clear();
    },
    dynamicImport(p) {
      return import(p);
    },
    encodeToBase64(str) {
      return Buffer.from(str).toString('base64');
    },
    exit(exitCode) {
      deno.exit(exitCode);
    },
    getCompilerExecutingPath() {
      const current = new URL('../../compiler/stencil.js', import.meta.url);
      return normalizePath(current.pathname);
    },
    getCurrentDirectory() {
      return normalizePath(deno.cwd());
    },
    getRemoteModuleUrl,
    glob(_pattern, _opts) {
      return null;
    },
    async isSymbolicLink(p) {
      try {
        const stat = await deno.stat(p);
        return stat.isSymlink;
      } catch (e) {
        return false;
      }
    },
    async loadTypeScript(opts) {
      const tsDep = opts.dependencies.find(dep => dep.name === 'typescript');

      let tsFilePath = opts.typeScriptPath;
      if (!tsFilePath) {
        tsFilePath = getModulePath(opts.rootDir, tsDep.name, tsDep.main);
        await fetchAndWrite({
          url: getRemoteModuleUrl({ moduleId: tsDep.name, version: tsDep.version, path: tsDep.main }),
          filePath: tsFilePath,
        });
      }

      // ensure typescript compiler doesn't think it's nodejs
      (globalThis as any).process.browser = true;

      const orgModule = (globalThis as any).module;
      (globalThis as any).module = { exports: {} };
      await import(tsFilePath);
      const importedTs = (globalThis as any).module.exports;

      delete (globalThis as any).process.browser;
      if (orgModule) {
        (globalThis as any).module = orgModule;
      } else {
        delete (globalThis as any).module;
      }

      // create half-baked sys just to get us going
      // later on we'll wire up ts sys w/ the actual stencil sys
      const tsSys: TypeScript.System = {
        args: [],
        createDirectory: noop,
        directoryExists: p => {
          try {
            const s = deno.statSync(p);
            return s.isDirectory;
          } catch (e) {}
          return false;
        },
        exit: deno.exit,
        fileExists: p => {
          try {
            const s = deno.statSync(p);
            return s.isFile;
          } catch (e) {}
          return false;
        },
        getCurrentDirectory: deno.cwd,
        getDirectories: () => [],
        getExecutingFilePath: () => tsFilePath,
        newLine: '\n',
        readDirectory: () => [],
        readFile: (p, encoding) => {
          try {
            const decoder = new TextDecoder(encoding);
            const data = deno.readFileSync(p);
            return decoder.decode(data);
          } catch (e) {}
          return undefined;
        },
        resolvePath: p => resolve(p),
        useCaseSensitiveFileNames: deno.build.os !== 'windows',
        write: noop,
        writeFile: noop,
      };
      importedTs.sys = tsSys;

      return importedTs;
    },
    async preloadDependencies(opts) {
      const tsDep = opts.dependencies.find(dep => dep.name === 'typescript');

      try {
        const decoder = new TextDecoder('utf-8');
        const pkgContent = await deno.readFile(getModulePath(opts.rootDir, tsDep.name, tsDep.main));
        const pkgData: PackageJsonData = JSON.parse(decoder.decode(pkgContent));
        if (pkgData.version === tsDep.version) {
          return;
        }
      } catch (e) {}

      const timespace = c.logger.createTimeSpan(`preloadDependencies start`, true);

      const preloadUrls = tsDep.resources.map(p => ({
        url: getRemoteModuleUrl({ moduleId: tsDep.name, version: tsDep.version, path: p }),
        filePath: join(opts.rootDir, tsDep.name, p),
      }));

      await Promise.all(preloadUrls.map(fetchAndWrite));

      timespace.finish(`preloadDependencies end`);
    },
    async mkdir(p, opts) {
      const results: CompilerSystemMakeDirectoryResults = {
        basename: basename(p),
        dirname: dirname(p),
        path: p,
        newDirs: [],
        error: null,
      };
      try {
        await deno.mkdir(p, opts);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    mkdirSync(p, opts) {
      const results: CompilerSystemMakeDirectoryResults = {
        basename: basename(p),
        dirname: dirname(p),
        path: p,
        newDirs: [],
        error: null,
      };
      try {
        deno.mkdirSync(p, opts);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    nextTick(cb) {
      // https://doc.deno.land/https/github.com/denoland/deno/releases/latest/download/lib.deno.d.ts#queueMicrotask
      queueMicrotask(cb);
    },
    normalizePath,
    platformPath: {
      basename,
      dirname,
      extname,
      isAbsolute,
      join,
      normalize,
      parse,
      relative,
      resolve,
      sep,
      delimiter,
      posix,
      win32,
    },
    async readdir(p) {
      const dirEntries: string[] = [];
      try {
        for await (const dirEntry of deno.readDir(p)) {
          dirEntries.push(normalizePath(join(p, dirEntry.name)));
        }
      } catch (e) {}
      return dirEntries;
    },
    readdirSync(p) {
      const dirEntries: string[] = [];
      try {
        for (const dirEntry of deno.readDirSync(p)) {
          dirEntries.push(normalizePath(join(p, dirEntry.name)));
        }
      } catch (e) {}
      return dirEntries;
    },
    async readFile(p) {
      try {
        const decoder = new TextDecoder('utf-8');
        const data = await deno.readFile(p);
        return decoder.decode(data);
      } catch (e) {}
      return undefined;
    },
    readFileSync(p) {
      try {
        const decoder = new TextDecoder('utf-8');
        const data = deno.readFileSync(p);
        return decoder.decode(data);
      } catch (e) {}
      return undefined;
    },
    async realpath(p) {
      try {
        return await deno.realPath(p);
      } catch (e) {}
      return undefined;
    },
    realpathSync(p) {
      try {
        return deno.realPathSync(p);
      } catch (e) {}
      return undefined;
    },
    async rename(oldPath, newPath) {
      const results: CompilerSystemRenameResults = {
        oldPath,
        newPath,
        error: null,
        oldDirs: [],
        oldFiles: [],
        newDirs: [],
        newFiles: [],
        renamed: [],
        isFile: false,
        isDirectory: false,
      };
      try {
        await deno.rename(oldPath, newPath);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    resolvePath(p) {
      return normalizePath(p);
    },
    async rmdir(p, opts) {
      const results: CompilerSystemRemoveDirectoryResults = {
        basename: basename(p),
        dirname: dirname(p),
        path: p,
        removedDirs: [],
        removedFiles: [],
        error: null,
      };
      try {
        await deno.remove(p, opts);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    rmdirSync(p, opts) {
      const results: CompilerSystemRemoveDirectoryResults = {
        basename: basename(p),
        dirname: dirname(p),
        path: p,
        removedDirs: [],
        removedFiles: [],
        error: null,
      };
      try {
        deno.removeSync(p, opts);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    async stat(p) {
      try {
        const stat = await deno.stat(p);
        const results: CompilerFsStats = {
          isFile: () => stat.isFile,
          isDirectory: () => stat.isDirectory,
          isSymbolicLink: () => stat.isSymlink,
          size: stat.size,
        };
        return results;
      } catch (e) {}
      return undefined;
    },
    statSync(p) {
      try {
        const stat = deno.statSync(p);
        const results: CompilerFsStats = {
          isFile: () => stat.isFile,
          isDirectory: () => stat.isDirectory,
          isSymbolicLink: () => stat.isSymlink,
          size: stat.size,
        };
        return results;
      } catch (e) {}
      return undefined;
    },
    tmpdir() {
      if (tmpDir == null) {
        tmpDir = deno.makeTempDirSync();
      }
      return tmpDir;
    },
    async unlink(p) {
      const results: CompilerSystemUnlinkResults = {
        basename: basename(p),
        dirname: dirname(p),
        path: p,
        error: null,
      };
      try {
        await deno.remove(p);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    unlinkSync(p) {
      const results: CompilerSystemUnlinkResults = {
        basename: basename(p),
        dirname: dirname(p),
        path: p,
        error: null,
      };
      try {
        deno.removeSync(p);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    async writeFile(p, content) {
      const results: CompilerSystemWriteFileResults = {
        path: p,
        error: null,
      };
      try {
        const encoder = new TextEncoder();
        await deno.writeFile(p, encoder.encode(content));
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    writeFileSync(p, content) {
      const results: CompilerSystemWriteFileResults = {
        path: p,
        error: null,
      };
      try {
        const encoder = new TextEncoder();
        deno.writeFileSync(p, encoder.encode(content));
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    watchDirectory(p, callback, recursive) {
      const fsWatcher = deno.watchFs(p, { recursive });

      const dirWatcher = async () => {
        try {
          for await (const fsEvent of fsWatcher) {
            for (const fsPath of fsEvent.paths) {
              const fileName = normalizePath(fsPath);

              if (fsEvent.kind === 'create') {
                callback(fileName, 'dirAdd');
                sys.events.emit('dirAdd', fileName);
              } else if (fsEvent.kind === 'modify') {
                callback(fileName, 'fileUpdate');
                sys.events.emit('fileUpdate', fileName);
              } else if (fsEvent.kind === 'remove') {
                callback(fileName, 'dirDelete');
                sys.events.emit('dirDelete', fileName);
              }
            }
          }
        } catch (e) {
          // todo
          // swallows "BadResource: Bad resource ID at unwrapResponse"??
        }
      };
      dirWatcher();

      const close = async () => {
        try {
          await fsWatcher.return();
        } catch (e) {
          // todo
          // swallows "BadResource: Bad resource ID at unwrapResponse"??
        }
      };
      sys.addDestory(close);

      return {
        close,
      };
    },
    watchFile(p, callback) {
      const fsWatcher = deno.watchFs(p, { recursive: false });

      const fileWatcher = async () => {
        try {
          for await (const fsEvent of fsWatcher) {
            for (const fsPath of fsEvent.paths) {
              const fileName = normalizePath(fsPath);

              if (fsEvent.kind === 'create') {
                callback(fileName, 'fileAdd');
                sys.events.emit('fileAdd', fileName);
              } else if (fsEvent.kind === 'modify') {
                callback(fileName, 'fileUpdate');
                sys.events.emit('fileUpdate', fileName);
              } else if (fsEvent.kind === 'remove') {
                callback(fileName, 'fileDelete');
                sys.events.emit('fileDelete', fileName);
              }
            }
          }
        } catch (e) {
          // todo
          // swallows "BadResource: Bad resource ID at unwrapResponse"??
        }
      };
      fileWatcher();

      const close = async () => {
        try {
          await fsWatcher.return();
        } catch (e) {
          // todo
          // swallows "BadResource: Bad resource ID at unwrapResponse"??
        }
      };
      sys.addDestory(close);

      return {
        close,
      };
    },
    async generateContentHash(content) {
      // https://github.com/denoland/deno/issues/1891
      // https://jsperf.com/hashcodelordvlad/121
      const len = content.length;
      if (len === 0) return '';
      let hash = 0;
      for (let i = 0; i < len; i++) {
        hash = (hash << 5) - hash + content.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      if (hash < 0) {
        hash = hash * -1;
      }
      return hash + '';
    },
    copy: (copyTasks, srcDir) => denoCopyTasks(deno, copyTasks, srcDir),
    details: {
      // https://github.com/denoland/deno/issues/3802
      cpuModel: 'cpu-model',
      cpus: 8,
      freemem: () => 0,
      platform: deno.build.os,
      release: deno.build.vendor,
      runtime: 'deno',
      runtimeVersion: deno.version.deno,
      totalmem: 0,
    },
    applyGlobalPatch: async fromDir => {
      const { applyNodeCompat } = await import('@deno-node-compat');
      applyNodeCompat({ fromDir });
    },
  };

  return sys;
}
