declare module '@path-utils' {
  export interface PlatformPath {
    normalize(p: string): string;
    join(...paths: string[]): string;
    resolve(...pathSegments: string[]): string;
    isAbsolute(p: string): boolean;
    relative(from: string, to: string): string;
    dirname(p: string): string;
    basename(p: string, ext?: string): string;
    extname(p: string): string;
    sep: string;
    delimiter: string;
    posix: any;
    win32: any;
  }

  export interface GlobOptions {
    extended?: boolean;
    globstar?: boolean;
  }

  export interface GlobToRegExpOptions extends GlobOptions {
    flags?: string;
  }

  export const getPathUtils: (pathConfig: {
    isWindows: boolean;
    cwd: () => string;
    env: {
      get: (key: string) => string;
    };
  }) => {
    path: PlatformPath;
    posix: PlatformPath;
    win32: PlatformPath;
    globToRegExp: (glob: string, opts?: GlobToRegExpOptions) => RegExp;
    isGlob: (str: string) => boolean;
    normalizeGlob: (glob: string, opts?: GlobOptions) => string;
    joinGlobs: (globs: string[], opts?: GlobOptions) => void;
  };
}
