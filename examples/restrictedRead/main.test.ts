import { importw, workerSymbol } from "../../mod.ts";

Deno.test("should not throw", async () => {
  const exampleModPath = new URL("./exampleMod.ts", import.meta.url).pathname;

  // Import `denoCwd` from a Worker with Deno namespace enabled, but read permission disallowed
  const { denoCwd, [workerSymbol]: worker } = await importw(
    "./examples/restrictedRead/exampleMod.ts",
    {
      name: "exampleWorkerWithDenoNamespaceButNoRead",
      deno: {
        namespace: true,
        permissions: {
          read: [exampleModPath],
        },
      },
    },
  );

  /**
   * Expect to get a read permission error:
   *
   * `error: Uncaught (in promise) PermissionDenied: read access to <CWD>, run again with the --allow-read flag`
   */
  try {
    await denoCwd(); // should BOOM!

    throw new Error(
      "expected: `error: Uncaught (in promise) PermissionDenied: read access to <CWD>, run again with the --allow-read flag`",
    );
  } catch (_) {
    // this is expected
  }

  (worker as Worker).terminate();
});
