import { run } from '../cli/index.js';
import { createDenoLogger, createDenoSystem } from '../sys/deno/index.js';

if (import.meta.main) {
  const args = Deno.args;
  const logger = createDenoLogger({ Deno });
  const sys = createDenoSystem({ Deno, logger });
  
  run({ args, logger, sys });
}
