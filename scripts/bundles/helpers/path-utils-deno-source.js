import { globToRegExp, isGlob, normalizeGlob, joinGlobs } from 'https://deno.land/std/path/glob.ts';
import * as posix from 'https://deno.land/std/path/posix.ts';
import * as win32 from 'https://deno.land/std/path/win32.ts';

export const path = ctx.isWindows ? win32 : posix;
path.win32 = win32;
path.posix = posix;

export { posix, win32, globToRegExp, isGlob, normalizeGlob, joinGlobs };
