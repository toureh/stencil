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

declare module 'https://deno.land/std/fmt/colors.ts' {
  export function bgRed(str: string): string;
  export function blue(str: string): string;
  export function bold(str: string): string;
  export function cyan(str: string): string;
  export function dim(str: string): string;
  export function gray(str: string): string;
  export function green(str: string): string;
  export function magenta(str: string): string;
  export function red(str: string): string;
  export function yellow(str: string): string;
}
