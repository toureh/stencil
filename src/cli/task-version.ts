import type { CoreCompiler } from './load-compiler';

export function taskVersion(coreCompiler: CoreCompiler) {
  console.log(coreCompiler.version);
}
