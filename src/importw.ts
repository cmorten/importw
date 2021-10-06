/**
 * This is a limited port of import-from-worker
 * (https://github.com/GoogleChromeLabs/import-from-worker) for Deno.
 *
 * Copyright 2020 Google Inc. All Rights Reserved.
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

/// <reference lib="deno.unstable" />

// @deno-types="./comlink.d.ts"
import * as comlink from "./comlink.js";
import { expectMessage } from "./expectMessage.ts";
import { expose } from "./worker.ts";

export const worker = Symbol("importw.worker");

export interface ImportWorkerOptions extends Omit<WorkerOptions, "type"> {
  base?: string;
}

export type ImportWorker<T> = comlink.Remote<T> & {
  [worker]: Worker;
  [comlink.releaseProxy]: () => void;
};

// deno-lint-ignore no-explicit-any
export async function importw<T = any>(
  path: string,
  { name, deno = false }: ImportWorkerOptions = {},
): Promise<ImportWorker<T>> {
  const url = new URL(path, `file://${Deno.cwd()}/`);
  const importSpecifier = url.href;

  const importWorker = new Worker(import.meta.url, {
    type: "module",
    name,
    deno,
  });

  await expectMessage(importWorker, "waiting");

  importWorker.postMessage(importSpecifier);

  await expectMessage(importWorker, "ready");

  const api: comlink.Remote<T> = comlink.wrap(importWorker);

  return new Proxy<comlink.Remote<T>>(api, {
    get(target, prop) {
      if (prop === worker) {
        return importWorker;
      } else if (prop === comlink.releaseProxy) {
        return async function terminate() {
          await target[comlink.releaseProxy]();
          importWorker.terminate();
        };
      }

      return target[prop as keyof comlink.Remote<T>];
    },
  }) as ImportWorker<T>;
}

if (!("window" in self)) {
  expose();
}
