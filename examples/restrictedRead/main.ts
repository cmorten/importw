import { importw, release } from "../../mod.ts";
import {
  dirname,
  fromFileUrl,
  resolve,
} from "https://deno.land/std/path/mod.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));

export async function main() {
  const exampleModPath = resolve(__dirname, "./exampleMod.ts");

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
