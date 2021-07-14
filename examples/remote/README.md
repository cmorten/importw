# Basic

This directory contains an example (`main.ts`) of using `importw` to import a
remote module inside a Worker without the read access permission.

## How to run this example

To run the example, execute the following from the root of this repo:

```console
deno run --unstable --allow-net=deno.land --allow-read --allow-write ./examples/remote/main.ts
```

Where the `--unstable` flag is required in order to use the unstable Worker API,
the `--allow-net=` permission is to allow us to import the remote Deno module
into the Worker, and the `--allow-read` and `--allow-write` permissions are to
demonstrate that the write permission is being restricted within the Worker
meaning the "evil" file doesn't get written.
