#!/usr/bin/env bun
/* Bun → Python wrapper. Original preserved at _legacy_py/_legacy_py/inject-rules.py. */
import { join, dirname } from "node:path";
const here = dirname(import.meta.path);
const py = join(here, "_legacy_py/inject-rules.py");
const args = process.argv.slice(2);
if (args.length === 0) args.push(process.env.PLUGIN_ROOT ?? join(here, ".."));
const proc = Bun.spawn(["python3", py, ...args], {
	stdin: "inherit", stdout: "inherit", stderr: "inherit",
	env: process.env,
});
process.exit(await proc.exited);
