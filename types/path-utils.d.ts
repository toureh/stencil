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
    posix: PlatformPath;
    win32: PlatformPath;
  }

  export const getPathUtils: (pathConfig: {
    isWindows: boolean;
    cwd: () => string;
    env: {
      get: (key: string) => string;
    };
  }) => {
    posix: PlatformPath;
    win32: PlatformPath;
    isGlob: (str: string) => boolean;
  };
}
