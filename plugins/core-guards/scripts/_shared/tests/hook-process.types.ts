export type HookResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type HookRunOptions = {
  cwd?: string;
  codexHome?: string;
};

export type HookCommand = { command: string };
export type HookEntry = { matcher: string; hooks: HookCommand[] };
export type HookConfig = { hooks: Record<string, HookEntry[]> };
