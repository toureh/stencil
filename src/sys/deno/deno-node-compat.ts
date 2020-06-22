import { createRequire } from 'https://deno.land/std/node/module.ts';
import { join } from 'https://deno.land/std/path/mod.ts';

export const applyNodeCompat = (opts: { fromDir: string }) => {
  // node globals such as "process" and "Buffer"
  // will already been added to globalThis
  // because of the "https://deno.land/std/node/module.ts" import
  const nodeRequire = createRequire(join(opts.fromDir, 'noop.js'));
  (globalThis as any).require = nodeRequire;
};
