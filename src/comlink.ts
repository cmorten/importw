/**
 * This is a limited port of comlink
 * (https://github.com/GoogleChromeLabs/comlink) for Deno.
 * 
 * comlink originally licensed as follows:
 * 
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "./messagePortPolyfill.js";
import { notImplemented } from "./notImplemented.ts";
import { ESSerializer } from "./serializer.js";

import { MessageMap, WireValueMap } from "./protocol.ts";

import type {
  Endpoint,
  HandlerWireValue,
  Message,
  WireValue,
} from "./protocol.ts";

export type { Endpoint };

export const proxyMarker = Symbol("Comlink.proxy");
export const releaseProxy = Symbol("Comlink.releaseProxy");

const throwMarker = Symbol("Comlink.thrown");
(self as any).throwMarker = throwMarker;

/**
 * Interface of values that were marked to be proxied with `comlink.proxy()`.
 * Can also be implemented by classes.
 */
export interface ProxyMarked {
  [proxyMarker]: true;
}

/**
 * Takes a type and wraps it in a Promise, if it not already is one.
 * This is to avoid `Promise<Promise<T>>`.
 *
 * This is the inverse of `Unpromisify<T>`.
 */
type Promisify<T> = T extends Promise<unknown> ? T : Promise<T>;
/**
 * Takes a type that may be Promise and unwraps the Promise type.
 * If `P` is not a Promise, it returns `P`.
 *
 * This is the inverse of `Promisify<T>`.
 */
type Unpromisify<P> = P extends Promise<infer T> ? T : P;

/**
 * Takes the raw type of a remote property and returns the type that is visible to the local thread on the proxy.
 *
 * Note: This needs to be its own type alias, otherwise it will not distribute over unions.
 * See https://www.typescriptlang.org/docs/handbook/advanced-types.html#distributive-conditional-types
 */
type RemoteProperty<T> =
  // If the value is a method, comlink will proxy it automatically.
  // Objects are only proxied if they are marked to be proxied.
  // Otherwise, the property is converted to a Promise that resolves the cloned value.
  T extends Function | ProxyMarked ? Remote<T> : Promisify<T>;

/**
 * Takes the raw type of a property as a remote thread would see it through a proxy (e.g. when passed in as a function
 * argument) and returns the type that the local thread has to supply.
 *
 * This is the inverse of `RemoteProperty<T>`.
 *
 * Note: This needs to be its own type alias, otherwise it will not distribute over unions. See
 * https://www.typescriptlang.org/docs/handbook/advanced-types.html#distributive-conditional-types
 */
type LocalProperty<T> = T extends Function | ProxyMarked ? Local<T>
  : Unpromisify<T>;

/**
 * Proxies `T` if it is a `ProxyMarked`, clones it otherwise (as handled by structured cloning and transfer handlers).
 */
export type ProxyOrClone<T> = T extends ProxyMarked ? Remote<T> : T;
/**
 * Inverse of `ProxyOrClone<T>`.
 */
export type UnproxyOrClone<T> = T extends RemoteObject<ProxyMarked> ? Local<T>
  : T;

/**
 * Takes the raw type of a remote object in the other thread and returns the type as it is visible to the local thread
 * when proxied with `Comlink.proxy()`.
 *
 * This does not handle call signatures, which is handled by the more general `Remote<T>` type.
 *
 * @template T The raw type of a remote object as seen in the other thread.
 */
export type RemoteObject<T> = { [P in keyof T]: RemoteProperty<T[P]> };
/**
 * Takes the type of an object as a remote thread would see it through a proxy (e.g. when passed in as a function
 * argument) and returns the type that the local thread has to supply.
 *
 * This does not handle call signatures, which is handled by the more general `Local<T>` type.
 *
 * This is the inverse of `RemoteObject<T>`.
 *
 * @template T The type of a proxied object.
 */
export type LocalObject<T> = { [P in keyof T]: LocalProperty<T[P]> };

/**
 * Additional special comlink methods available on each proxy returned by `Comlink.wrap()`.
 */
export interface ProxyMethods {
  [releaseProxy]: () => void;
}

/**
 * Takes the raw type of a remote object, function or class in the other thread and returns the type as it is visible to
 * the local thread from the proxy return value of `Comlink.wrap()` or `Comlink.proxy()`.
 */
export type Remote<T> =
  // Handle properties
  & RemoteObject<T>
  & // Handle call signature (if present)
  (T extends (...args: infer TArguments) => infer TReturn ? (
    ...args: { [I in keyof TArguments]: UnproxyOrClone<TArguments[I]> }
  ) => Promisify<ProxyOrClone<Unpromisify<TReturn>>>
    : unknown)
  & // Handle construct signature (if present)
  // The return of construct signatures is always proxied (whether marked or not)
  (T extends { new (...args: infer TArguments): infer TInstance } ? {
    new (
      ...args: {
        [I in keyof TArguments]: UnproxyOrClone<TArguments[I]>;
      }
    ): Promisify<Remote<TInstance>>;
  }
    : unknown)
  & // Include additional special comlink methods available on the proxy.
  ProxyMethods;

/**
 * Expresses that a type can be either a sync or async.
 */
type MaybePromise<T> = Promise<T> | T;

/**
 * Takes the raw type of a remote object, function or class as a remote thread would see it through a proxy (e.g. when
 * passed in as a function argument) and returns the type the local thread has to supply.
 *
 * This is the inverse of `Remote<T>`. It takes a `Remote<T>` and returns its original input `T`.
 */
export type Local<T> =
  // Omit the special proxy methods (they don't need to be supplied, comlink adds them)
  & Omit<LocalObject<T>, keyof ProxyMethods>
  & // Handle call signatures (if present)
  (T extends (...args: infer TArguments) => infer TReturn ? (
    ...args: { [I in keyof TArguments]: ProxyOrClone<TArguments[I]> }
  ) => // The raw function could either be sync or async, but is always proxied automatically
  MaybePromise<UnproxyOrClone<Unpromisify<TReturn>>>
    : unknown)
  & // Handle construct signature (if present)
  // The return of construct signatures is always proxied (whether marked or not)
  (T extends { new (...args: infer TArguments): infer TInstance } ? {
    new (
      ...args: {
        [I in keyof TArguments]: ProxyOrClone<TArguments[I]>;
      }
    ): // The raw constructor could either be sync or async, but is always proxied automatically
    MaybePromise<Local<Unpromisify<TInstance>>>;
  }
    : unknown);

const isObject = (val: unknown): val is object =>
  (typeof val === "object" && val !== null) || typeof val === "function";

/**
 * Customizes the serialization of certain values as determined by `canHandle()`.
 *
 * @template T The input type being handled by this transfer handler.
 * @template S The serialized type sent over the wire.
 */
export interface TransferHandler<T, S> {
  /**
   * Gets called for every value to determine whether this transfer handler
   * should serialize the value, which includes checking that it is of the right
   * type (but can perform checks beyond that as well).
   */
  canHandle(value: unknown): value is T;

  /**
   * Gets called with the value if `canHandle()` returned `true` to produce a
   * value that can be sent in a message, consisting of structured-cloneable
   * values and/or transferrable objects.
   */
  serialize(value: T): S;

  /**
   * Gets called to deserialize an incoming value that was serialized in the
   * other thread with this transfer handler (known through the name it was
   * registered under).
   */
  deserialize(value: S): T;
}

/**
 * Internal transfer handle to handle objects marked to proxy.
 */
const proxyTransferHandler: TransferHandler<object, any> = {
  canHandle: (val): val is ProxyMarked =>
    isObject(val) && (val as ProxyMarked)[proxyMarker],
  serialize(obj) {
    // TODO: this isn't workable yet...

    // @ts-ignore
    const { port1, port2 } = new MessageChannel();
    expose(obj, port1);

    return ESSerializer.serialize(port2);
  },
  deserialize(port) {
    // TODO: this isn't workable yet...

    // @ts-ignore
    const deserialized = ESSerializer.deserialize(port, [MessagePort]);
    deserialized.start();

    return wrap(deserialized);
  },
};

interface ThrownValue {
  [throwMarker]: unknown; // just needs to be present
  value: unknown;
}
type SerializedThrownValue =
  | { isError: true; value: Error }
  | { isError: false; value: unknown };

/**
 * Internal transfer handler to handle thrown exceptions.
 */
const throwTransferHandler: TransferHandler<
  ThrownValue,
  SerializedThrownValue
> = {
  canHandle: (value): value is ThrownValue =>
    isObject(value) && throwMarker in value,
  serialize({ value }) {
    let serialized: SerializedThrownValue;

    if (value instanceof Error) {
      serialized = {
        isError: true,
        value: {
          message: value.message,
          name: value.name,
          stack: value.stack,
        },
      };
    } else {
      serialized = { isError: false, value };
    }

    return serialized;
  },
  deserialize(serialized) {
    if (serialized.isError) {
      throw Object.assign(
        new Error(serialized.value.message),
        serialized.value,
      );
    }

    throw serialized.value;
  },
};

/**
 * Allows customizing the serialization of certain values.
 */
export const transferHandlers = new Map<
  string,
  TransferHandler<unknown, unknown>
>([
  ["proxy", proxyTransferHandler],
  ["throw", throwTransferHandler],
]);

function fromWireValue(value: WireValue): any {
  switch (value.type) {
    case WireValueMap.HANDLER:
      return transferHandlers.get((value as HandlerWireValue).name)!
        .deserialize(value.value);
    case WireValueMap.RAW:
      return value.value;
  }
}
(self as any).fromWireValue = fromWireValue;

export function expose(this: any, obj: any, ep: Endpoint = self as any) {
  ep.addEventListener("message", function callback(ev: MessageEvent) {
    if (!ev || !ev.data) {
      return;
    }

    let objFallback;
    try {
      objFallback = obj;
    } catch (e) {
      objFallback = (self as any).tmp;
    }

    const { id, type, path } = {
      path: [] as string[],
      ...(ev.data as Message),
    };

    const argumentList = (ev.data.argumentList || []).map(fromWireValue);

    let returnValue;
    try {
      const parent = path.slice(0, -1).reduce(
        (obj, prop) => obj[prop],
        objFallback,
      );
      const rawValue = path.reduce((obj, prop) => obj[prop], objFallback);

      switch (type) {
        case MessageMap.GET:
          {
            returnValue = rawValue;
          }
          break;
        case MessageMap.SET:
          {
            parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
            returnValue = true;
          }
          break;
        case MessageMap.APPLY:
          {
            returnValue = rawValue.apply(parent, argumentList);
          }
          break;
        case MessageMap.CONSTRUCT:
          {
            // TODO: this isn't workable yet...
            notImplemented();
            const value = new rawValue(...argumentList);
            returnValue = proxy(value);
          }
          break;
        case MessageMap.RELEASE:
          {
            returnValue = undefined;
          }
          break;
      }
    } catch (value) {
      returnValue = { value, [throwMarker]: 0 };
    }

    Promise.resolve(returnValue)
      .catch((value) => {
        return { value, [throwMarker]: 0 };
      })
      .then((returnValue) => {
        const wireValue = toWireValue(returnValue);
        ep.postMessage({ ...wireValue, id });

        if (type === MessageMap.RELEASE) {
          // detach after sending release response above.
          ep.removeEventListener("message", callback as any);
        }
      });
  } as any);
}

export function wrap<T>(ep: Endpoint, target?: any): Remote<T> {
  return createProxy<T>(ep, [], target) as any;
}

function throwIfProxyReleased(isReleased: boolean) {
  if (isReleased) {
    throw new Error("Proxy has been released and is not useable");
  }
}

function createProxy<T>(
  ep: Endpoint,
  path: (string | number | symbol)[] = [],
  target: object = function () {},
): Remote<T> {
  let isProxyReleased = false;

  const proxy = new Proxy(target, {
    get(_target, prop) {
      throwIfProxyReleased(isProxyReleased);

      if (prop === releaseProxy) {
        return () => {
          return requestResponseMessage(ep, {
            type: MessageMap.RELEASE,
            path: path.map((p) => p.toString()),
          }).then(() => {
            isProxyReleased = true;
          });
        };
      }

      if (prop === "then") {
        if (path.length === 0) {
          return { then: () => proxy };
        }

        const r = requestResponseMessage(ep, {
          type: MessageMap.GET,
          path: path.map((p) => p.toString()),
        }).then(fromWireValue);

        return r.then.bind(r);
      }

      return createProxy(ep, [...path, prop]);
    },
    set(_target, prop, rawValue) {
      throwIfProxyReleased(isProxyReleased);

      // FIXME: ES6 Proxy Handler `set` methods are supposed to return a
      // boolean. To show good will, we return true asynchronously ¯\_(ツ)_/¯
      const value = toWireValue(rawValue);

      return requestResponseMessage(
        ep,
        {
          type: MessageMap.SET,
          path: [...path, prop].map((p) => p.toString()),
          value,
        },
      ).then(fromWireValue) as any;
    },
    apply(_target, _thisArg, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);

      const last = path[path.length - 1];

      // We just pretend that `bind()` didn’t happen.
      if (last === "bind") {
        return createProxy(ep, path.slice(0, -1));
      }

      const argumentList = processArguments(rawArgumentList);

      return requestResponseMessage(
        ep,
        {
          type: MessageMap.APPLY,
          path: path.map((p) => p.toString()),
          argumentList,
        },
      ).then(fromWireValue);
    },
    construct(_target, rawArgumentList) {
      // TODO: this isn't workable yet...
      notImplemented();
      throwIfProxyReleased(isProxyReleased);

      const argumentList = processArguments(rawArgumentList);

      return requestResponseMessage(
        ep,
        {
          type: MessageMap.CONSTRUCT,
          path: path.map((p) => p.toString()),
          argumentList,
        },
      ).then(fromWireValue);
    },
  });

  return proxy as any;
}

function processArguments(argumentList: any[]): WireValue[] {
  const processed = argumentList.map(toWireValue);

  return processed;
}

export function proxy<T>(obj: T): T & ProxyMarked {
  return Object.assign(obj, { [proxyMarker]: true }) as any;
}

function toWireValue(value: any): WireValue {
  for (const [name, handler] of transferHandlers) {
    if (handler.canHandle(value)) {
      const serializedValue = handler.serialize(value);

      return {
        type: WireValueMap.HANDLER,
        name,
        value: serializedValue,
      };
    }
  }

  return {
    type: WireValueMap.RAW,
    value,
  };
}

(self as any).toWireValue = toWireValue;

function requestResponseMessage(
  ep: Endpoint,
  msg: Message,
): Promise<WireValue> {
  return new Promise((resolve) => {
    const id = generateUUID();

    ep.addEventListener("message", function l(ev: MessageEvent) {
      if (!ev.data || !ev.data.id || ev.data.id !== id) {
        return;
      }

      ep.removeEventListener("message", l as any);

      resolve(ev.data);
    } as any);

    ep.postMessage({ id, ...msg });
  });
}

function generateUUID(): string {
  return new Array(4)
    .fill(0)
    .map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16))
    .join("-");
}
