declare module 'https://deno.land/std/fs/mod.ts' {
  export interface WalkEntry {
    name: string;
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
    path: string;
  }
  export function expandGlob(
    glob: string,
    opts?: {
      root?: string;
      exclude?: string[];
      includeDirs?: boolean;
      extended?: boolean;
      globstar?: boolean;
    },
  ): AsyncIterableIterator<WalkEntry>;
}

declare module 'https://deno.land/std/path/mod.ts' {
  export function isGlob(p: string): boolean;
}
