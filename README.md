<p align="center">
  <h1 align="center">importw</h1>
</p>
<p align="center">
Permission restricted imports for Deno.
<p align="center">
   <a href="https://github.com/asos-craigmorten/importw/tags/"><img src="https://img.shields.io/github/tag/asos-craigmorten/importw" alt="Current version" /></a>
   <img src="https://github.com/asos-craigmorten/importw/workflows/Test/badge.svg" alt="Current test status" />
   <a href="https://doc.deno.land/https/deno.land/x/importw/mod.ts"><img src="https://doc.deno.land/badge.svg" alt="Deno docs" /></a>
   <a href="http://makeapullrequest.com"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs are welcome" /></a>
   <a href="https://github.com/asos-craigmorten/importw/issues/"><img src="https://img.shields.io/github/issues/asos-craigmorten/importw" alt="importw issues" /></a>
   <img src="https://img.shields.io/github/stars/asos-craigmorten/importw" alt="importw stars" />
   <img src="https://img.shields.io/github/forks/asos-craigmorten/importw" alt="importw forks" />
   <img src="https://img.shields.io/github/license/asos-craigmorten/importw" alt="importw license" />
   <a href="https://GitHub.com/asos-craigmorten/importw/graphs/commit-activity"><img src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" alt="importw is maintained" /></a>
   <a href="https://nest.land/package/importw"><img src="https://nest.land/badge.svg" alt="Published on nest.land" /></a>
</p>
<p align="center">
   <a href="https://deno.land/x/importw"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Flatest-version%2Fx%2Fimportw%2Fmod.ts" alt="importw latest /x/ version" /></a>
   <a href="https://deno-visualizer.danopia.net/dependencies-of/https/deno.land/x/importw/mod.ts"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Fdep-count%2Fx%2Fimportw%2Fmod.ts" alt="importw dependency count" /></a>
   <a href="https://deno-visualizer.danopia.net/dependencies-of/https/deno.land/x/importw/mod.ts"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Fupdates%2Fx%2Fimportw%2Fmod.ts" alt="importw dependency outdatedness" /></a>
   <a href="https://deno-visualizer.danopia.net/dependencies-of/https/deno.land/x/importw/mod.ts"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Fcache-size%2Fx%2Fimportw%2Fmod.ts" alt="importw cached size" /></a>
</p>

---

```ts
import {
  importw,
  release,
  worker,
} from "https://deno.land/x/importw@1.1.0/mod.ts";

// Import module from within a worker.
const { log, add, [release]: terminate, [worker]: workerRef } = await importw(
  "https://deno.land/x/importw@1.1.0/examples/basic/exampleMod.ts",
  {
    name: "exampleWorker",
    deno: false,
  },
);

// Have access to the underlying Worker
console.log(workerRef.constructor.name); // Worker

// Run code within the Worker
await log(`add(40, 2) in a worker:`, await add(40, 2));

// Gracefully release Worker resources
await terminate();
```

## About

This module allows users to import modules from within a Deno Worker and expose
the methods to the main runtime.

This allows for a degree of isolation around the imported module, and allows
consumers to restrict an imported module's access to the Deno namespace and / or
privileged operations.

**Note:** this module does not provide full isolation as Workers run in-process.
If your code is long running you may be vulnerable to side channel timing
attacks.

This module consists of ports / adaptions of
[Comlink](https://github.com/GoogleChromeLabs/comlink) and
[import-from-worker](https://github.com/GoogleChromeLabs/import-from-worker) to
create the bridge between main runtime and Worker.

## Examples

Please refer to [examples README](./examples/README.md).

## Contributing

[Contributing guide](https://github.com/asos-craigmorten/importw/blob/main/.github/CONTRIBUTING.md)

---

## License

importw is licensed under the [MIT License](./LICENSE.md).

This module makes use of several ported sub-modules, each containing their
original license.
