# Basic

This directory contains a simple example (`main.ts`) of using `importw` to import a module (`exampleMod.ts`) inside a Worker with and without access to the Deno namespace.

It demonstrates that not providing access to the Deno namespace prevents the imported module from using privileged APIs such as `Deno.cwd()`, and the providing access does allow such APIs to be used.

## How to run this example

To run the example, execute the following from the root of this repo:

```console
deno run --unstable --allow-read=./ ./examples/basic/main.ts
```

Where the `--unstable` flag is required in order to use the unstable Worker API, and the `--allow-read=./` permission is required to execute `Deno.cwd()` in this particular example.
