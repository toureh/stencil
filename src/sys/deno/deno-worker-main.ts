import type * as d from '../../declarations';
import type { Deno as DenoTypes } from '../../../types/lib.deno';
import { TASK_CANCELED_MSG } from '@utils';

export const createDenoWorkerMainController = (_deno: typeof DenoTypes, sys: d.CompilerSystem, maxConcurrentWorkers: number): d.WorkerMainController => {
  let msgIds = 0;
  let isDestroyed = false;
  let isQueued = false;
  let workerIds = 0;
  const tasks = new Map<number, d.CompilerWorkerTask>();
  const queuedSendMsgs: d.MsgToWorker[] = [];
  const workers: WorkerChild[] = [];
  const totalWorkers = Math.max(Math.min(maxConcurrentWorkers, sys.details.cpus), 2) - 1;
  const tick = Promise.resolve();

  const onMsgsFromWorker = (worker: WorkerChild, ev: MessageEvent) => {
    if (!isDestroyed) {
      const msgsFromWorker: d.MsgFromWorker[] = ev.data;
      if (Array.isArray(msgsFromWorker)) {
        for (const msgFromWorker of msgsFromWorker) {
          if (msgFromWorker) {
            const task = tasks.get(msgFromWorker.stencilId);
            if (task) {
              tasks.delete(msgFromWorker.stencilId);
              if (msgFromWorker.stencilRtnError) {
                task.reject(msgFromWorker.stencilRtnError);
              } else {
                task.resolve(msgFromWorker.stencilRtnValue);
              }

              worker.activeTasks--;
              if (worker.activeTasks < 0 || worker.activeTasks > 50) {
                worker.activeTasks = 0;
              }
            } else if (msgFromWorker.stencilRtnError) {
              console.error(msgFromWorker.stencilRtnError);
            }
          }
        }
      }
    }
  };

  const onWorkerError = (e: ErrorEvent) => console.error(e);

  const createWorkerMain = () => {
    const workerUrl = new URL('./worker.js', import.meta.url).href;
    const workerOpts: WorkerOptions = {
      name: `stencil.worker.${workerIds++}`,
      type: `module`,
    };

    const worker = new Worker(workerUrl, workerOpts);

    const workerChild: WorkerChild = {
      worker,
      activeTasks: 0,
      sendQueue: [],
    };
    worker.onerror = onWorkerError;
    worker.onmessage = ev => onMsgsFromWorker(workerChild, ev);

    return workerChild;
  };

  const sendMsgsToWorkers = (w: WorkerChild) => {
    if (w.sendQueue.length > 0) {
      w.worker.postMessage(w.sendQueue);
      w.sendQueue.length = 0;
    }
  };

  const queueMsgToWorker = (msg: d.MsgToWorker) => {
    let theChosenOne: WorkerChild;

    if (workers.length > 0) {
      theChosenOne = workers[0];

      if (totalWorkers > 1) {
        for (const worker of workers) {
          if (worker.activeTasks < theChosenOne.activeTasks) {
            theChosenOne = worker;
          }
        }

        if (theChosenOne.activeTasks > 0 && workers.length < totalWorkers) {
          theChosenOne = createWorkerMain();
          workers.push(theChosenOne);
        }
      }
    } else {
      theChosenOne = createWorkerMain();
      workers.push(theChosenOne);
    }

    theChosenOne.activeTasks++;
    theChosenOne.sendQueue.push(msg);
  };

  const flushSendQueue = () => {
    isQueued = false;
    queuedSendMsgs.forEach(queueMsgToWorker);
    queuedSendMsgs.length = 0;
    workers.forEach(sendMsgsToWorkers);
  };

  const send = (...args: any[]) =>
    new Promise<any>((resolve, reject) => {
      if (isDestroyed) {
        reject(TASK_CANCELED_MSG);
      } else {
        const msg: d.MsgToWorker = {
          stencilId: msgIds++,
          args,
        };
        queuedSendMsgs.push(msg);

        tasks.set(msg.stencilId, {
          resolve,
          reject,
        });

        if (!isQueued) {
          isQueued = true;
          tick.then(flushSendQueue);
        }
      }
    });

  const destroy = () => {
    isDestroyed = true;
    tasks.forEach(t => t.reject(TASK_CANCELED_MSG));
    tasks.clear();
    workers.forEach(w => w.worker.terminate());
    workers.length = 0;
  };

  const handler = (name: string) => {
    return function (...args: any[]) {
      return send(name, ...args);
    };
  };

  return {
    send,
    destroy,
    handler,
  };
};

interface WorkerChild {
  worker: Worker;
  activeTasks: number;
  sendQueue: d.MsgToWorker[];
}
