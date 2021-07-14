import { main } from "./main.ts";

Deno.test("should not throw", async () => {
  await main();
});
