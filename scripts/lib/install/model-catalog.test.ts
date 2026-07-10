import { expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listCodexModels } from "./model-catalog";

test("loads every visible model page from Codex app-server", async () => {
	const root = mkdtempSync(join(tmpdir(), "model-catalog-"));
	const server = join(root, "server.ts");
	writeFileSync(server, `
import { createInterface } from "node:readline";
const lines = createInterface({ input: process.stdin });
lines.on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize") {
    console.log(JSON.stringify({ id: message.id, result: {} }));
  }
  if (message.method === "model/list") {
    const second = message.params.cursor === "page-2";
    const model = second
      ? { model: "second", displayName: "Second", description: "", hidden: false, isDefault: false, supportedReasoningEfforts: [] }
      : { model: "first", displayName: "First", description: "", hidden: false, isDefault: true, supportedReasoningEfforts: [] };
    console.log(JSON.stringify({ id: message.id, result: { data: [model], nextCursor: second ? null : "page-2" } }));
  }
});
`);

	const models = await listCodexModels(root, ["bun", server]);
	expect(models.map((model) => model.model)).toEqual(["first", "second"]);
	expect(models[0]?.isDefault).toBe(true);
	rmSync(root, { recursive: true, force: true });
});

test("returns an empty catalog when app-server cannot start", async () => {
	expect(await listCodexModels("/tmp", ["missing-codex-binary"])).toEqual([]);
});
