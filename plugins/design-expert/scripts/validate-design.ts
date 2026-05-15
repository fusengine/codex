#!/usr/bin/env bun
/* Bun → Python wrapper. Original preserved at _legacy_py/_legacy_py/validate-design.py. */
import { join, dirname } from "node:path";
const here = dirname(import.meta.path);
const py = join(here, "_legacy_py/validate-design.py");
const proc = Bun.spawn(["python3", py], {
	stdin: "inherit", stdout: "inherit", stderr: "inherit",
	env: process.env,
});
process.exit(await proc.exited);
