// "broken" is reserved: no longer emitted since the python-era runtimeSharedOk
// gate was removed. Kept in the union for the summary vocabulary and future use.
export type InstallStatus = "current" | "missing" | "stale" | "broken";

export interface InstalledPluginState {
	name: string;
	sourceVersion: string;
	cacheVersions: string[];
	cacheVersion?: string;
	enabled: boolean;
	cacheExists: boolean;
	hooksCount: number;
	status: InstallStatus;
	reasons: string[];
}

export function statusFor(args: {
	sourceVersion: string;
	cacheVersion?: string;
	enabled: boolean;
	cacheExists: boolean;
}): { status: InstallStatus; reasons: string[] } {
	const reasons: string[] = [];
	if (!args.enabled) reasons.push("not enabled");
	if (!args.cacheExists) reasons.push("cache missing");
	if (args.cacheExists && args.cacheVersion !== args.sourceVersion) {
		reasons.push(`cache version ${args.cacheVersion ?? "unknown"} != source ${args.sourceVersion}`);
	}
	if (reasons.length === 0) return { status: "current", reasons };
	if (!args.cacheExists || !args.enabled) return { status: "missing", reasons };
	return { status: "stale", reasons };
}
