export interface CodexModel {
	model: string;
	displayName: string;
	description: string;
	hidden: boolean;
	isDefault: boolean;
	supportedReasoningEfforts: Array<{ reasoningEffort: string; description: string }>;
}

interface RpcMessage {
	id?: number;
	result?: { data?: CodexModel[]; nextCursor?: string | null };
	error?: { message?: string };
}

async function* readMessages(stream: ReadableStream<Uint8Array>): AsyncGenerator<RpcMessage> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) return;
			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() ?? "";
			for (const line of lines) {
				if (line.trim()) yield JSON.parse(line) as RpcMessage;
			}
		}
	} finally {
		reader.releaseLock();
	}
}

async function responseFor(messages: AsyncGenerator<RpcMessage>, id: number): Promise<RpcMessage> {
	while (true) {
		const { done, value: message } = await messages.next();
		if (done) break;
		if (message.id !== id) continue;
		if (message.error) throw new Error(message.error.message ?? `app-server request ${id} failed`);
		return message;
	}
	throw new Error(`app-server closed before response ${id}`);
}

function send(stdin: Bun.FileSink, message: unknown): void {
	stdin.write(`${JSON.stringify(message)}\n`);
	stdin.flush();
}

export async function listCodexModels(
	codexHome: string,
	command: string[] = ["codex", "app-server"],
): Promise<CodexModel[]> {
	try {
		const processHandle = Bun.spawn(command, {
			env: { ...process.env, CODEX_HOME: codexHome },
			stdin: "pipe",
			stdout: "pipe",
			stderr: "ignore",
		});
		const timeout = setTimeout(() => processHandle.kill(), 10_000);
		const messages = readMessages(processHandle.stdout);
		try {
			send(processHandle.stdin, {
				method: "initialize",
				id: 0,
				params: { clientInfo: { name: "fusengine_setup", title: "Fusengine Setup", version: "1.0.0" } },
			});
			await responseFor(messages, 0);
			send(processHandle.stdin, { method: "initialized" });

			const models: CodexModel[] = [];
			let cursor: string | null = null;
			let id = 1;
			do {
				send(processHandle.stdin, { method: "model/list", id, params: { cursor, limit: 100, includeHidden: false } });
				const response = await responseFor(messages, id++);
				models.push(...(response.result?.data ?? []));
				cursor = response.result?.nextCursor ?? null;
			} while (cursor !== null);
			return models.filter((model) => !model.hidden);
		} finally {
			clearTimeout(timeout);
			processHandle.stdin.end();
			processHandle.kill();
			await processHandle.exited;
		}
	} catch {
		return [];
	}
}
