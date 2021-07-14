import { withDenoNamespace, withoutDenoNamespace } from "./main.ts";

Deno.test("without Deno namespace: should not throw", async () => {
  await withoutDenoNamespace();
});

Deno.test("with Deno namespace: should not throw", async () => {
  await withDenoNamespace();
});
