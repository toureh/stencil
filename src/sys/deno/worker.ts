import '@stencil/core/compiler';
import { initDenoWorkerThread } from './deno-worker-thread';

initDenoWorkerThread(globalThis, ((globalThis as any).stencil as typeof import('@stencil/core/compiler')).createWorkerMessageHandler());
