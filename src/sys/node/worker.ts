import '@stencil/core/compiler';
import { initNodeWorkerThread } from './worker/worker-thread';

initNodeWorkerThread(process, ((global as any).stencil as typeof import('@stencil/core/compiler')).createWorkerMessageHandler());
