import { importw, workerSymbol } from "../../mod.ts";

let { log, add, multiply, denoCwd, _MyClass, [workerSymbol]: worker } =
  await importw(
    "./examples/basic/exampleMod.ts",
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
  await log(
    `Deno.cwd() in a worker without access to Deno namespace throwing an error:`,
    e.message,
  );
}

// Re-import `log` and `denoCwd` from a Worker with Deno namespace enabled
({ log, denoCwd } = await importw(
  "./examples/basic/exampleMod.ts",
  { name: "exampleWorkerWithDenoNamespace", deno: true },
));

// Should now log the CWD from within the Worker
await log(
  `Deno.cwd() in a worker with access to Deno namespace:`,
  await denoCwd(),
);

(worker as Worker).terminate();
