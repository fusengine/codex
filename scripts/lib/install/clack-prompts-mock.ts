/**
 * clack-prompts-mock.ts — shared full-surface stub for `@clack/prompts`, for use with
 * `mock.module("@clack/prompts", ...)` in bun:test files.
 *
 * Bun's `mock.module()` mutates a process-global virtual-module map: it is NOT scoped per
 * test file, and `mock.restore()` does not reset it (only `--isolate`, a fresh subprocess
 * per file, does). A stub missing part of the surface a LATER test file needs (e.g. `log`)
 * silently leaks into that file and crashes it — see MEMORY/LESSON.md. Every test file that
 * mocks "@clack/prompts" MUST build its stub from `clackPromptsMock()` and override only the
 * interactive calls it drives (`confirm`, `select`, `text`, `multiselect`, `isCancel`).
 *
 * NOT named `*.test.ts` on purpose — bun's default test glob would otherwise pick this file
 * up as a (empty) test file.
 */
type AsyncStub = (...args: unknown[]) => Promise<unknown>;
type SyncStub = (...args: unknown[]) => unknown;
type VoidStub = (...args: unknown[]) => void;

/** Shape of the `@clack/prompts` surface consumed anywhere under scripts/lib/install/. */
export interface ClackPromptsMock {
	confirm: AsyncStub;
	select: AsyncStub;
	multiselect: AsyncStub;
	text: AsyncStub;
	note: VoidStub;
	intro: VoidStub;
	outro: VoidStub;
	cancel: VoidStub;
	isCancel: SyncStub;
	spinner: () => { start: VoidStub; stop: VoidStub; message: VoidStub };
	log: {
		step: VoidStub;
		info: VoidStub;
		warn: VoidStub;
		success: VoidStub;
		error: VoidStub;
	};
}

/**
 * Builds a full `@clack/prompts` stub. Pass `overrides` for the interactive calls the test
 * drives; every other export gets a safe no-op so a leaked module mock never crashes an
 * unrelated test file executed later in the same `bun test` invocation.
 */
export function clackPromptsMock(overrides: Partial<ClackPromptsMock> = {}): ClackPromptsMock {
	const noop: VoidStub = () => {};
	const noopAsync: AsyncStub = async () => undefined;
	return {
		confirm: noopAsync,
		select: noopAsync,
		multiselect: noopAsync,
		text: noopAsync,
		note: noop,
		intro: noop,
		outro: noop,
		cancel: noop,
		isCancel: (value: unknown) => value === undefined,
		spinner: () => ({ start: noop, stop: noop, message: noop }),
		log: { step: noop, info: noop, warn: noop, success: noop, error: noop },
		...overrides,
	};
}
