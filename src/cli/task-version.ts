import { CompilerSystem } from '../declarations';

export async function taskVersion(sys: CompilerSystem) {
  const compilerPath = sys.getCompilerExecutingPath();
  const { version }: typeof import('@stencil/core/compiler') = await import(compilerPath);
  console.log(version);
}
