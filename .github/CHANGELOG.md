# ChangeLog

## [1.0.0] - 14-07-2021

- feat: support Deno `1.12.0`
- feat: support using classes in the worker
- docs: add remote module example
- feat: BREAKING: remove default export, change Symbol for accessing the worker to `worker`
- feat: add new Symbol for terminating the Worker `release` 

## [0.4.0] - 25-06-2021

- feat: support Deno `1.11.2` and std `0.99.0`
- feat: export Symbol to allow consumers to gain access to the worker and terminate it
- ci: add linting and smoke tests

## [0.3.0] - 10-02-2021

- feat: support Deno 1.7.2 and std 0.85.0

## [0.2.2] - 19-09-2020

- chore: upgrade to eggs@0.2.2 in CI

## [0.2.1] - 19-09-2020

- chore: upgrade to eggs@0.2.1 in CI

## [0.2.0] - 19-09-2020

- feat: support Deno 1.4.1 and std 0.70.0

## [0.1.2] - 25-07-2020

- chore: docs update

## [0.1.1] - 25-07-2020

- fix: patch for URL imports.
- chore: ensure examples uploaded to nest.land.

## [0.1.0] - 25-07-2020

- feat: initial creation of importw.
