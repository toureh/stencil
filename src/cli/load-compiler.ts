import type { CompilerSystem } from '../declarations';

export async function loadCoreCompiler(sys: CompilerSystem): Promise<CoreCompiler> {
  if (typeof globalThis === 'undefined') {
    if (typeof self !== 'undefined') {
      (self as any).globalThis = self;
    } else if (typeof window !== 'undefined') {
      (window as any).globalThis = window;
    } else if (typeof global !== 'undefined') {
      (global as any).globalThis = global;
    }
  }

  await sys.dynamicImport(sys.getCompilerExecutingPath());

  return (globalThis as any).stencil;
}

export type CoreCompiler = typeof import('@stencil/core/compiler');
