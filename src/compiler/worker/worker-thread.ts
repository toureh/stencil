import * as d from '../../declarations';
import { optimizeCss } from '../optimize/optimize-css';
import { prepareModule } from '../optimize/optimize-module';
import { prerenderWorker } from '../prerender/prerender-worker';
import { transpile } from '../transpile';
import { transformCssToEsm } from '../style/css-to-esm';
import { transpileToEs5 } from '../transpile/transpile-to-es5';

export const createWorkerContext = (): d.CompilerWorkerContext => {
  return {
    transpile,
    transformCssToEsm,
    prepareModule,
    optimizeCss,
    transpileToEs5,
    prerenderWorker,
  };
};

export const createWorkerMessageHandler = (): d.WorkerMsgHandler => {
  const workerCtx = createWorkerContext();

  const handleMsg = async (msgToWorker: d.MsgToWorker) => {
    const fnName: string = msgToWorker.args[0];
    const fnArgs = msgToWorker.args.slice(1);
    const fn = (workerCtx as any)[fnName] as Function;
    if (typeof fn === 'function') {
      return fn.apply(null, fnArgs);
    }
  };

  return handleMsg;
};
