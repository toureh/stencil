import * as d from '../../../declarations';
import { posix, win32, normalizePath, IS_WINDOWS_ENV } from '@utils';

const path: d.PlatformPath = IS_WINDOWS_ENV ? win32 : posix;

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
export const relative = path.relative;
export const resolve = path.resolve;
export const sep = path.sep;
export const delimiter = path.delimiter;
export { posix, win32 } from '@utils';

export default path;
