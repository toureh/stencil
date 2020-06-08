import { getPathUtils } from '@path-utils';
import { IS_WINDOWS_ENV, IS_NODE_ENV, IS_DENO_ENV } from './environment';

export const pathUtils = getPathUtils({
  isWindows: IS_WINDOWS_ENV,
  cwd: IS_NODE_ENV ? process.cwd : IS_DENO_ENV ? Deno.cwd : () => '/',
  env: {
    get: key => (IS_NODE_ENV ? process.env[key] : IS_DENO_ENV ? Deno.env.get(key) : null),
  },
});

declare const Deno: any;
