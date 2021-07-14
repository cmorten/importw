/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

// @deno-types="./comlink.d.ts"
import * as comlink from "./comlink.js";
import { expectMessage } from "./expectMessage.ts";

export async function expose(
  worker: WorkerGlobalScope & typeof globalThis = self,
): Promise<void> {
  worker.postMessage("waiting");

  const { data } = await expectMessage(worker);
  const nodule = await import(data);

  worker.postMessage("ready");

  comlink.expose(nodule);
}
