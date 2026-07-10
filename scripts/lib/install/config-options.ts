export type Choice = { value: string; label: string; hint?: string };

export const FALLBACK_EFFORTS: Choice[] = ["minimal", "low", "medium", "high", "xhigh"]
	.map((value) => ({ value, label: value }));
export const PERSONALITIES: Choice[] = ["none", "friendly", "pragmatic"]
	.map((value) => ({ value, label: value }));
export const APPROVALS: Choice[] = [
	{ value: "untrusted", label: "untrusted", hint: "asks before everything not allowlisted" },
	{ value: "on-request", label: "on-request", hint: "the model decides when to ask (recommended)" },
	{ value: "never", label: "never", hint: "never interrupts, returns failures to the model" },
];
export const SANDBOXES: Choice[] = ["read-only", "workspace-write", "danger-full-access"]
	.map((value) => ({ value, label: value }));
