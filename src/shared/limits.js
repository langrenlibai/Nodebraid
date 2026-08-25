'use strict';

class LimitedBuffer {
  constructor(maxBytes) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
      throw new TypeError('maxBytes must be a non-negative safe integer');
    }
    this.maxBytes = maxBytes;
    this.length = 0;
    this.chunks = [];
    this.truncated = false;
  }

  append(value) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
    const remaining = this.maxBytes - this.length;
    if (remaining <= 0) {
      if (chunk.length) this.truncated = true;
      return;
    }

    if (chunk.length > remaining) {
      this.chunks.push(chunk.subarray(0, remaining));
      this.length += remaining;
      this.truncated = true;
      return;
    }

    this.chunks.push(chunk);
    this.length += chunk.length;
  }

  toBuffer() {
    return Buffer.concat(this.chunks, this.length);
  }

  toString(encoding = 'utf8') {
    return this.toBuffer().toString(encoding);
  }
}

module.exports = { LimitedBuffer };
