export function identityNicknames(name: string, explicit: unknown): string[] {
	const requested = Array.isArray(explicit) ? unique(explicit.map(String).map(sanitize).filter(Boolean)) : [];
	if (requested.length > 0) return requested;
	const base = titleCase(name);
	return unique([base, `${base} Specialist`, `${base} Agent`].map(sanitize).filter(Boolean));
}

export function normalizeSkillNames(value: unknown): string[] {
	if (Array.isArray(value)) return unique(value.map(String).map(clean).filter(Boolean));
	if (typeof value === "string") return unique(value.split(",").map(clean).filter(Boolean));
	return [];
}

function titleCase(name: string): string {
	return name
		.split(/[-_\s]+/)
		.filter(Boolean)
		.map(titlePart)
		.join(" ");
}

function titlePart(part: string): string {
	if (part.toUpperCase() === "SEO") return "SEO";
	return `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`;
}

function clean(value: string): string {
	return value.trim();
}

function sanitize(value: string): string {
	return clean(value).replace(/[^A-Za-z0-9 _-]+/g, "").replace(/\s+/g, " ").trim();
}

function unique(values: string[]): string[] {
	return [...new Set(values)];
}
