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

import { join } from "../deps.ts";
import * as comlink from "./comlink.ts";

function expectMessage(target: any, payload?: any): any {
  return new Promise((resolve) => {
    target.addEventListener("message", function f(ev: any) {
      if (payload && ev.data !== payload) {
        return;
      }

      target.removeEventListener("message", f);
      resolve(ev);
    });
  });
}

export const workerSymbol = Symbol();

export default async function importw(
  path: string,
  { name, base = Deno.cwd(), deno = false }: any = {},
) {
  const url = path.includes(":/") ? path : join(base, path);
  const worker = new Worker(import.meta.url, { type: "module", name, deno });
  await expectMessage(worker, "waiting");
  worker.postMessage(url);
  await expectMessage(worker, "ready");

  const api = comlink.wrap(worker);

  return new Proxy(api, {
    get(target: any, prop) {
      if (prop === workerSymbol) {
        return worker;
      }

      return target[prop];
    },
  });
}

export { importw };

if (!("window" in self)) {
  (async function run(w: any = self) {
    w.postMessage("waiting");
    const { data } = await expectMessage(w);
    const nodule = await import(data);
    w.postMessage("ready");
    comlink.expose(nodule);
  })();
}
