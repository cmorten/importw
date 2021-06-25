/**
 * Port of message-port-polyfill (https://github.com/rocwind/message-port-polyfill) for Deno.
 *
 * message-port-polyfill originally licensed as follows:
 *
 * MIT License
 *
 * Copyright (c) 2019 Roc
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// polyfill MessagePort and MessageChannel
export class MessagePortPolyfill {
  onmessage = null;
  onmessageerror = null;

  otherPort = null;
  onmessageListeners = [];

  constructor() {}

  dispatchEvent(event) {
    if (this.onmessage) {
      this.onmessage(event);
    }

    this.onmessageListeners.forEach((listener) => listener(event));

    return true;
  }

  postMessage(message) {
    if (!this.otherPort) {
      return;
    }

    this.otherPort.dispatchEvent({ data: message });
  }

  addEventListener(type, listener) {
    if (type !== "message") {
      return;
    }

    if (
      typeof listener !== "function" ||
      this.onmessageListeners.indexOf(listener) !== -1
    ) {
      return;
    }

    this.onmessageListeners.push(listener);
  }

  removeEventListener(type, listener) {
    if (type !== "message") {
      return;
    }

    const index = this.onmessageListeners.indexOf(listener);

    if (index === -1) {
      return;
    }

    this.onmessageListeners.splice(index, 1);
  }

  start() {
    // do nothing at this moment
  }

  close() {
    // do nothing at this moment
  }
}

export class MessageChannelPolyfill {
  port1;
  port2;

  constructor() {
    this.port1 = new MessagePortPolyfill();
    this.port2 = new MessagePortPolyfill();
    this.port1.otherPort = this.port2;
    this.port2.otherPort = this.port1;
  }
}

/**
 * https://github.com/zloirock/core-js/blob/master/packages/core-js/internals/global.js
 */
const globalObj = typeof window !== "undefined" && window.Math === Math
  ? window
  : typeof self !== "undefined" && self.Math === Math
  ? self
  : Function("return this")();

export function applyPolyfill() {
  globalObj.MessagePort = MessagePortPolyfill;
  globalObj.MessageChannel = MessageChannelPolyfill;
}

if (!globalObj.MessagePort || !globalObj.MessageChannel) {
  applyPolyfill();
}
