import { importw, release } from "../../mod.ts";
import { resolve } from "https://deno.land/std@0.101.0/path/mod.ts";

export async function main() {
  const exampleModPath = resolve("./exampleMod.ts");

  // Import `denoCwd` from a Worker with Deno namespace enabled, but read permission restricted
  const { denoCwd, [release]: terminate } = await importw(
    "./examples/restrictedRead/exampleMod.ts",
    {
      name: "permissionRestrictedWorker",
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
   * `PermissionDenied: read access to <CWD>, run again with the --allow-read flag`
   */
  try {
    await denoCwd(); // BOOM!
  } catch (e) {
    console.log("BOOM! 💥 ");
    console.error(e);
  }

  await terminate();
}

if (import.meta.main) {
  await main();
}
