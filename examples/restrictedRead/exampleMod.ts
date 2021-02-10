/**
 * Returns the current working directory via the
 * Deno.cwd() API.
 */
export function denoCwd() {
  return Deno.cwd();
}
