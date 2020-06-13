import * as d from '../declarations';
import { getPathUtils } from '@path-utils';
import { IS_DENO_ENV, IS_NODE_ENV, IS_WINDOWS_ENV } from './environment';
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

declare const Deno: typeof DenoType;
