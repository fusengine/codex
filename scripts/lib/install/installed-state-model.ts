export type InstallStatus = "current" | "missing" | "stale" | "broken";

export interface InstalledPluginState {
	name: string;
	sourceVersion: string;
	cacheVersions: string[];
	cacheVersion?: string;
	enabled: boolean;
	cacheExists: boolean;
	hooksCount: number;
	runtimeSharedOk: boolean;
	status: InstallStatus;
	reasons: string[];
}

export function statusFor(args: {
	sourceVersion: string;
	cacheVersion?: string;
	enabled: boolean;
	cacheExists: boolean;
	runtimeSharedOk: boolean;
}): { status: InstallStatus; reasons: string[] } {
	const reasons: string[] = [];
	if (!args.enabled) reasons.push("not enabled");
	if (!args.cacheExists) reasons.push("cache missing");
	if (args.cacheExists && args.cacheVersion !== args.sourceVersion) {
		reasons.push(`cache version ${args.cacheVersion ?? "unknown"} != source ${args.sourceVersion}`);
	}
	if (!args.runtimeSharedOk) reasons.push("runtime shared missing");
	if (reasons.length === 0) return { status: "current", reasons };
	if (!args.cacheExists || !args.enabled) return { status: "missing", reasons };
	if (!args.runtimeSharedOk) return { status: "broken", reasons };
	return { status: "stale", reasons };
}
