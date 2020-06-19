import { createRequire, join } from './deps';
import type { Deno as DenoTypes } from '../../../types/lib.deno';

export const applyNodeRequire = (fromDir: string) => {
  // node globals such as "process" and "Buffer"
  // will already been added to globalThis
  // because of the "https://deno.land/std/node/module.ts" import
  const nodeRequire = createRequire(join(fromDir, 'noop.js'));

  (globalThis as any).require = (id: string) => {
    // not everything is implemented yet
    // https://deno.land/std/node#deno-node-compatibility
    if (fakeModules.has(id)) {
      return {};
    }
    return nodeRequire(id);
  };
};

const fakeModules = new Set(['readline']);

export const applyNodeCompat = (deno: typeof DenoTypes, glb: any) => {
  // prevent need for --allow-env
  delete glb.process.env;
  delete glb.process.argv;
  glb.process.env = {};
  glb.process.env = ['deno', ...deno.args];
};
