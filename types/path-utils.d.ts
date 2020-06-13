declare module '@path-utils' {
  export const getPathUtils: (pathConfig: {
    isWindows: boolean;
    cwd: () => string;
    env: {
      get: (key: string) => string;
    };
  }) => {
    posix: any;
    win32: any;
    isGlob: (str: string) => boolean;
  };
}
