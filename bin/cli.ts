// deno install -n stencil --allow-read --allow-write ./bin/cli.ts
import { run } from '../cli/index.js';
import { createDenoLogger, createDenoSys } from '../sys/deno/index.js';

if (import.meta.main) {
  const args = Deno.args;
  const logger = createDenoLogger({ Deno });
  const sys = createDenoSys({ Deno, logger });

  run({ args, logger, sys });
}
