import { createRequire } from 'https://deno.land/std/node/module.ts';
import { join } from 'https://deno.land/std/path/mod.ts';
import process from './deno-node-process';

export const applyNodeCompat = (opts: { fromDir: string }) => {
  (globalThis as any).process = process;

  const nodeRequire = createRequire(join(opts.fromDir, 'noop.js'));
  (globalThis as any).require = nodeRequire;
};
