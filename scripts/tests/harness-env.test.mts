import { describe, expect, test } from "bun:test";
import {
	HARNESS_ENV_OPTIONS,
	configureHarnessEnv,
	getEnabledHarnessEnv,
	isHarnessEnvAsked,
} from "../lib/install/harness-env";

describe("configureHarnessEnv", () => {
	test("sets a selected key to its preset value and marks asked", () => {
		const next = configureHarnessEnv({}, ["RALPH_MODE"]);
		const ralph = HARNESS_ENV_OPTIONS.find((o) => o.key === "RALPH_MODE");
		expect(next.RALPH_MODE).toBe(ralph?.value);
		expect(isHarnessEnvAsked(next)).toBe(true);
	});

	test("drops unselected harness keys but preserves foreign keys", () => {
		const next = configureHarnessEnv({ RALPH_MODE: "1", RUST_LOG: "error" }, []);
		expect(next.RALPH_MODE).toBeUndefined();
		expect(next.RUST_LOG).toBe("error");
	});

	test("getEnabledHarnessEnv round-trips a configured selection", () => {
		const next = configureHarnessEnv({}, ["FUSE_MCP_TTL_SEC"]);
		expect(getEnabledHarnessEnv(next)).toEqual(["FUSE_MCP_TTL_SEC"]);
	});
});
