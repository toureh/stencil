import { CompilerSystem, Config, ConfigFlags, Logger, TaskCommand } from '@stencil/core/internal';

/**
 * Creates a "logger", based off of Deno APIs, that will be used by the compiler and dev-server.
 * By default the CLI uses this method to create the Deno logger. The Deno "process"
 * object should be provided as the first argument.
 */
export declare function createDenoLogger(Deno: any): Logger;

/**
 * Creates the "system", based off of Deno APIs, used by the compiler. This includes any and
 * all file system reads and writes using Deno. The compiler itself is unaware of Node's
 * `fs` module. Other system APIs include any use of `crypto` to hash content. The Deno "process"
 * object should be provided as the first argument.
 */
export declare function createDenoSystem(Deno: any): CompilerSystem;

/**
 * Used by the CLI to parse command-line arguments into a typed `ConfigFlags` object.
 * This is an example of how it's used internally: `parseFlags(Deno.args)`.
 */
export declare function parseFlags(args: string[]): ConfigFlags;

/**
 * Runs the CLI with the given options. This is used as the default main entry for the cli.
 */
export declare function run(init: CliInitOptions): Promise<void>;
export interface CliInitOptions {
  /**
   * `Deno` instance.
   * https://doc.deno.land/https/github.com/denoland/deno/releases/latest/download/lib.deno.d.ts
   */
  Deno?: any;
  /**
   * Stencil Logger.
   */
  logger?: Logger;
  /**
   * Stencil System.
   */
  sys?: CompilerSystem;
}

/**
 * Runs individual task commands.
 */
export declare function runTask(config: Config, task: TaskCommand): Promise<void>;
export { CompilerSystem, Config, ConfigFlags, Logger, TaskCommand };
