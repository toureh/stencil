import {
  CompilerSystem,
  CompilerFsStats,
  CompilerSystemRenameResults,
  CompilerSystemRemoveDirectoryResults,
  CompilerSystemUnlinkResults,
  CompilerSystemMakeDirectoryResults,
  CompilerSystemWriteFileResults,
  Logger,
} from '../../declarations';
import { basename, dirname, join } from 'path';
import { normalizePath } from '@utils';
import type { Deno as DenoTypes } from '../../../types/lib.deno';
import { denoCopyTasks } from './deno-copy-tasks';

export function createDenoSys(c: { Deno: any; logger: Logger }) {
  let tmpDir: string = null;
  const deno: typeof DenoTypes = c.Deno;
  const destroys = new Set<() => Promise<void> | void>();

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
    encodeToBase64(str) {
      return Buffer.from(str).toString('base64');
    },
    exit(exitCode) {
      deno.exit(exitCode);
    },
    getCurrentDirectory() {
      return normalizePath(deno.cwd());
    },
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
    getCompilerExecutingPath() {
      const current = new URL('../../compiler/stencil.js', import.meta.url);
      return normalizePath(current.pathname);
    },
    normalizePath,
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
    realpath(p) {
      try {
        return deno.realPath(p);
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
      const results: CompilerSystemRemoveDirectoryResults = { basename: basename(p), dirname: dirname(p), path: p, removedDirs: [], removedFiles: [], error: null };
      try {
        await deno.remove(p, opts);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    rmdirSync(p, opts) {
      const results: CompilerSystemRemoveDirectoryResults = { basename: basename(p), dirname: dirname(p), path: p, removedDirs: [], removedFiles: [], error: null };
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
        const results: CompilerFsStats = { isFile: () => stat.isFile, isDirectory: () => stat.isDirectory, isSymbolicLink: () => stat.isSymlink, size: stat.size };
        return results;
      } catch (e) {}
      return undefined;
    },
    statSync(p) {
      try {
        const stat = deno.statSync(p);
        const results: CompilerFsStats = { isFile: () => stat.isFile, isDirectory: () => stat.isDirectory, isSymbolicLink: () => stat.isSymlink, size: stat.size };
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
      cpuModel: deno.build.arch,
      cpus: 1,
      freemem() {
        return 0;
      },
      platform: deno.build.os,
      release: deno.build.vendor,
      runtime: 'deno',
      runtimeVersion: deno.version.deno,
      totalmem: 0,
    },
  };

  return sys;
}
