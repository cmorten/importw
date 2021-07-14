import { importw, release } from "../../mod.ts";

export async function main() {
  // Import `ensureFile` from a Worker with the write permissions disallowed.
  const { ensureFile, [release]: terminate } = await importw(
    "https://deno.land/std/fs/mod.ts",
    {
      name: "permissionRestrictedWorker",
      deno: {
        namespace: true,
        permissions: {
          read: ["./"],
          write: false,
          net: ["deno.land"],
        },
      },
    },
  );

  /**
   * Expect to get a write permission error:
   * `PermissionDenied: Requires write access to "./evil.txt", run again with the --allow-write flag`
   */
  try {
    await ensureFile("./evil.txt"); // BOOM!
  } catch (e) {
    console.log("BOOM! 💥 ");
    console.error(e);
  }

  await terminate();
}

if (import.meta.main) {
  await main();
}
