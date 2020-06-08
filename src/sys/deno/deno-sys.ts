import {
  CompilerSystem,
  CompilerFsStats,
  SystemDetails,
  CompilerSystemRenameResults,
  CompilerSystemRemoveDirectoryResults,
  CompilerSystemUnlinkResults,
  CompilerSystemMakeDirectoryResults,
  CompilerSystemWriteFileResults,
} from '../../declarations';
import { basename, dirname, join } from 'path';
import { normalizePath } from '@utils';

export function createDenoSystem(d: any) {
  let tmpDir: string = null;
  const deno: typeof Deno = d;
  const destroys = new Set<() => Promise<void> | void>();

  const osPlatform = deno.build.os;
  const details: SystemDetails = {
    cpuModel: deno.build.arch,
    cpus: 1,
    freemem() {
      return 0;
    },
    platform: osPlatform === 'darwin' || osPlatform === 'linux' || osPlatform === 'windows' ? osPlatform : '',
    release: deno.build.vendor,
    runtime: 'deno',
    runtimeVersion: deno.version.deno,
    totalmem: 0,
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
    getCompilerExecutingPath: null,
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
    async generateContentHash(content, length) {
      crypto.subtle;
      const arrayBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
      const hashArray = Array.from(new Uint8Array(arrayBuffer)); // convert buffer to byte array
      let hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
      if (typeof length === 'number') {
        hashHex = hashHex.substr(0, length);
      }
      return hashHex;
    },
    copy: nodeCopyTasks,
    details: details,
  };

  return sys;
}
