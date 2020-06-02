declare module '@path-utils' {
  export const getPathUtils: (pathConfig: { isWindows: boolean }) => { path: any; globToRegExp: any; isGlob: any; normalizeGlob: any; joinGlobs: any };
}
