'use strict';

class OperationBusyError extends Error {
  constructor(activeOperation) {
    super(`“${activeOperation}” is still running. Wait for it to finish before starting another operation.`);
    this.name = 'OperationBusyError';
    this.code = 'OPERATION_BUSY';
  }
}

class OperationGate {
  constructor() {
    this.activeOperation = '';
  }

  async run(label, operation) {
    if (this.activeOperation) throw new OperationBusyError(this.activeOperation);
    this.activeOperation = label;
    try {
      return await operation();
    } finally {
      this.activeOperation = '';
    }
  }
}

module.exports = { OperationGate, OperationBusyError };
