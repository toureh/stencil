import type * as d from '../../../declarations';
import { catchError, isFunction, isPromise } from '@utils';
import { dependencies } from '../dependencies';
import ts from 'typescript';

export const loadTypescript = (
  sys: d.CompilerSystem,
  diagnostics: d.Diagnostic[],
  rootDir: string,
  typeScriptPath: string,
  sync: boolean,
): TypeScriptModule | Promise<TypeScriptModule> => {
  if ((ts as TypeScriptModule).__loaded) {
    // already loaded
    return ts as TypeScriptModule;
  }

  const loadedTs = sys.loadTypeScript({
    typeScriptPath,
    sync,
    dependencies,
    rootDir,
  });
  if (loadedTs) {
    if (isPromise(loadedTs)) {
      return loadedTs
        .then(resolvedTs => {
          return setLoadedTs(resolvedTs);
        })
        .catch(e => {
          catchError(diagnostics, e);
          return null;
        });
    }
    return setLoadedTs(loadedTs);
  }

  return null;
};

const setLoadedTs = (loadedTs: TypeScriptModule) => {
  if (loadedTs != null && isFunction(loadedTs.transpileModule)) {
    loadedTs.__loaded = true;
    Object.assign(ts, loadedTs);
    return loadedTs;
  }
  return null;
};

type TypeScript = typeof ts;

export interface TypeScriptModule extends TypeScript {
  __loaded: boolean;
}
