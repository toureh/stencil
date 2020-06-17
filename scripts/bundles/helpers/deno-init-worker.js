async function denoInitWorker() {
  globalThis.stencilWorker = true;
  import('../../compiler/stencil.js');
}
denoInitWorker();
