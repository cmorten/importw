import { importw } from "../../mod.ts";

const exampleModPath = new URL("./exampleMod.ts", import.meta.url).pathname;

// Import `denoCwd` from a Worker with Deno namespace enabled, but read permission disallowed
const { denoCwd } = await importw(
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
await denoCwd(); // BOOM!

