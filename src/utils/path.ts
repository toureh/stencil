import * as d from '../declarations';
import { getPathUtils } from '@path-utils';
import { IS_DENO_ENV, IS_NODE_ENV, IS_WINDOWS_ENV } from './environment';
import { normalizePath } from './normalize-path';
import type { Deno as DenoType } from '../../types/lib.deno';

const pathUtils = /*@__PURE__*/ getPathUtils({
  isWindows: IS_WINDOWS_ENV,
  cwd: IS_NODE_ENV ? process.cwd : IS_DENO_ENV ? Deno.cwd : () => '/',
  env: {
    get: key => (IS_NODE_ENV ? process.env[key] : IS_DENO_ENV ? Deno.env.get(key) : null),
  },
});

export const posix: d.PlatformPath = pathUtils.posix;
export const win32: d.PlatformPath = pathUtils.win32;
export const isGlob = pathUtils.isGlob;

export const path: d.PlatformPath = IS_WINDOWS_ENV ? win32 : posix;

if (IS_WINDOWS_ENV) {
  path.normalize = (...args: string[]) => normalizePath(path.normalize.apply(path, args));
  path.join = (...args: string[]) => normalizePath(path.join.apply(path, args));
  path.relative = (...args: string[]) => normalizePath(path.relative.apply(path, args));
  path.resolve = (...args: string[]) => normalizePath(path.resolve.apply(path, args));
}

export const basename = path.basename;
export const dirname = path.dirname;
export const extname = path.extname;
export const isAbsolute = path.isAbsolute;
export const join = path.join;
export const normalize = path.normalize;
export const parse = path.parse;
export const relative = path.relative;
export const resolve = path.resolve;
export const sep = path.sep;
export const delimiter = path.delimiter;

declare const Deno: typeof DenoType;
