import { basename, dirname, extname, isAbsolute, join, normalize, relative, resolve, sep, delimiter } from 'https://deno.land/std/path/posix.ts';
import {
  basename as basenameWin,
  dirname as dirnameWin,
  extname as extnameWin,
  isAbsolute as isAbsoluteWin,
  join as joinWin,
  normalize as normalizeWin,
  relative as relativeWin,
  resolve as resolveWin,
  sep as sepWin,
  delimiter as delimiterWin,
} from 'https://deno.land/std/path/win32.ts';

export const posix = { basename, dirname, extname, isAbsolute, join, normalize, relative, resolve, sep, delimiter };

export const win32 = {
  basename: basenameWin,
  dirname: dirnameWin,
  extname: extnameWin,
  isAbsolute: isAbsoluteWin,
  join: joinWin,
  normalize: normalizeWin,
  relative: relativeWin,
  resolve: resolveWin,
  sep: sepWin,
  delimiter: delimiterWin,
};

win32.posix = posix.posix = posix;
win32.win32 = posix.win32 = win32;

export { isGlob } from 'https://deno.land/std/path/glob.ts';
