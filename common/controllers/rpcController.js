// common/controllers/rpcController.js
// A lightweight base for RPC-style endpoints where each method is an async handler
// Express 5 will handle async errors

export default class RpcController {
  constructor(methods = {}) {
    Object.entries(methods).forEach(([name, handler]) => {
      if (typeof handler !== 'function') return;
      this[name] = handler.bind(this);
    });
  }
}


