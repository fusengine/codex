export type HarnessScope =
	| "core" | "solid" | "rules" | "carto" | "security" | "changelog"
	| "aipilot" | "lessons" | "seo" | "memory" | "tailwindcss";
export interface HookHandlerTuple {
	plugin: string;
	event: string;
	matcher: string;
	command: string;
}

export interface HarnessHookRoute {
	plugin: string;
	event: string;
	matcher: string;
	scope: HarnessScope;
}

export interface WiringValidationOptions {
	installedHarnessVersion?: string;
}
