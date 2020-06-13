import * as d from '../declarations';
import { getPathUtils } from '@path-utils';
import { IS_WINDOWS_ENV, IS_NODE_ENV, IS_DENO_ENV } from './environment';
import type { Deno as DenoType } from '../../types/lib.deno';

export * from './constants';
export * from './environment';
export * from './format-component-runtime-meta';
export * from './helpers';
export * from './is-root-path';
export * from './logger/logger-minify-js';
export * from './logger/logger-rollup';
export * from './logger/logger-typescript';
export * from './logger/logger-utils';
export * from './message-utils';
export * from './normalize-path';
export * from './util';
export * from './validation';

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
