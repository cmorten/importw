import { importw, release, worker } from "../../mod.ts";

export async function withoutDenoNamespace() {
  const {
    log,
    add,
    multiply,
    denoCwd,
    MyClass,
    [release]: terminate,
    [worker]: workerRef,
  } = await importw(
    "./examples/basic/exampleMod.ts",
    { name: "worker" },
  );

  // Have access to the underlying Worker
  console.log(workerRef.constructor.name); // Worker

  await log(`add(40, 2) in a worker:`, await add(40, 2));
  await log(`multiply(40, 2) in a worker:`, await multiply(40, 2));

  // Use classes and other complex constructs
  const instance = await new MyClass("Deno", "The Dino");
  await instance.logName();

  /**
   * Expect to get an error:
   * `ReferenceError: Deno is not defined`
   */
  try {
    await denoCwd(); // BOOM!
  } catch (e) {
    console.log("BOOM! 💥 ");
    console.error(e);
  }

  // Classes as a special case need to be released
  // otherwise we will end up with open resource handles
  // for the MessagePort(s). This is a consequence of
  // importw utilizing comlink.
  await instance[release]();

  // This will handle all other resource cleanup.
  await terminate();
}

export async function withDenoNamespace() {
  // Import `log` and `denoCwd` from a Worker with Deno namespace enabled
  const { log, denoCwd, [release]: terminate } = await importw(
    "./examples/basic/exampleMod.ts",
    { name: "workerWithDenoNamespace", deno: true },
  );

  // Should now log the CWD from within the Worker
  await log(
    `Deno.cwd() in a worker with access to Deno namespace:`,
    await denoCwd(),
  );

  await terminate();
}

if (import.meta.main) {
  await withoutDenoNamespace();
  await withDenoNamespace();
}
