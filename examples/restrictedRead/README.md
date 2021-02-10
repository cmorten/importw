# Basic

This directory contains an example (`main.ts`) of using `importw` to import a module (`exampleMod.ts`) inside a Worker without the read access permission.

## How to run this example

To run the example, execute the following from the root of this repo:

```console
deno run --unstable --allow-read=./ ./examples/restrictedRead/main.ts
```

Where the `--unstable` flag is required in order to use the unstable Worker API, and the `--allow-read=./` permission is to demonstrate that the read permission is being restricted within the Worker.
