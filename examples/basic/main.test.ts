import { importw, workerSymbol } from "../../mod.ts";

Deno.test("should not throw", async () => {
  let { log, add, multiply, denoCwd, [workerSymbol]: worker } = await importw(
    "./examples/basic/exampleMod.ts",
    { name: "exampleWorker" },
  );

  await log(`add(40, 2) in a worker:`, await add(40, 2));
  await log(`multiply(40, 2) in a worker:`, await multiply(40, 2));

  try {
    // Expect error to be thrown
    await denoCwd();
  } catch (e) {
    await log(
      `Deno.cwd() in a worker without access to Deno namespace throwing an error:`,
      e.message,
    );
  }

  (worker as Worker).terminate();

  // Re-import `log` and `denoCwd` from a Worker with Deno namespace enabled
  ({ log, denoCwd, [workerSymbol]: worker } = await importw(
    "./examples/basic/exampleMod.ts",
    { name: "exampleWorkerWithDenoNamespace", deno: true },
  ));

  // Should now log the CWD from within the Worker
  await log(
    `Deno.cwd() in a worker with access to Deno namespace:`,
    await denoCwd(),
  );

  (worker as Worker).terminate();
});
