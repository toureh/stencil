import { createDenoLogger, createDenoSystem, run } from '../cli/deno/index.js';

if (import.meta.main) {
  run({
    Deno: Deno,
    logger: createDenoLogger(Deno),
    sys: createDenoSystem(Deno),
  });
}
