import { importw } from "../mod.ts";

let { log, add, multiply, denoCwd } = await importw(
  "./examples/service.ts",
  { name: "exampleWorker" },
);

await log(`add(40, 2) in a worker:`, await add(40, 2));
await log(`multiply(40, 2) in a worker:`, await multiply(40, 2));

// Class examples not working (yet...) as not implemented a successful
// constructor flow.
// const instance = await new MyClass("Deno", "The Dino");
// await instance.logName();

try {
  // Expect error to be thrown
  await denoCwd();
} catch (e) {
  await log(`Deno.cwd() in a worker throwing an error:`, e.message);
}

// Re-import `log` and `denoCwd` from a worker with Deno namespace enabled
({ log, denoCwd } = await importw(
  "./examples/service.ts",
  { name: "exampleWorkerWithDenoNamespace", deno: true },
));

// Should now log the CWD from within the worker
await log(`Deno.cwd() in a worker:`, await denoCwd());

Deno.exit(0);
