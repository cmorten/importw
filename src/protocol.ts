// deno-lint-ignore-file no-explicit-any
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

import { MessagePortPolyfill } from "./messagePortPolyfill.js";

// TODO: use built-in type once available
// REF: https://developer.mozilla.org/en-US/docs/Web/API/Transferable
export type Transferable = ArrayBuffer | MessagePortPolyfill;

export interface EventSource {
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: unknown,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: unknown,
  ): void;
}

export interface PostMessageWithOrigin {
  postMessage(
    message: any,
    targetOrigin: string,
    transferables?: Transferable[],
  ): void;
}

export interface Endpoint extends EventSource {
  postMessage(message: any, transferables?: Transferable[]): void;
  start?: () => void;
}

export const WireValueMap = {
  RAW: 0,
  PROXY: 1,
  THROW: 2,
  HANDLER: 3,
};

export const enum WireValueType {
  RAW,
  PROXY,
  THROW,
  HANDLER,
}

export interface RawWireValue {
  id?: string;
  type: WireValueType.RAW;
  value: unknown;
}

export interface HandlerWireValue {
  id?: string;
  type: WireValueType.HANDLER;
  name: string;
  value: unknown;
}

export type WireValue = RawWireValue | HandlerWireValue;

export type MessageID = string;

export const MessageMap = {
  GET: 0,
  SET: 1,
  APPLY: 2,
  CONSTRUCT: 3,
  ENDPOINT: 4,
  RELEASE: 5,
};

export const enum MessageType {
  GET,
  SET,
  APPLY,
  CONSTRUCT,
  ENDPOINT,
  RELEASE,
}

export interface GetMessage {
  id?: MessageID;
  type: MessageType.GET;
  path: string[];
}

export interface SetMessage {
  id?: MessageID;
  type: MessageType.SET;
  path: string[];
  value: WireValue;
}

export interface ApplyMessage {
  id?: MessageID;
  type: MessageType.APPLY;
  path: string[];
  argumentList: WireValue[];
}

export interface ConstructMessage {
  id?: MessageID;
  type: MessageType.CONSTRUCT;
  path: string[];
  argumentList: WireValue[];
}

export interface EndpointMessage {
  id?: MessageID;
  type: MessageType.ENDPOINT;
}

export interface ReleaseMessage {
  id?: MessageID;
  type: MessageType.RELEASE;
  path: string[];
}

export type Message =
  | GetMessage
  | SetMessage
  | ApplyMessage
  | ConstructMessage
  | EndpointMessage
  | ReleaseMessage;
