export function tomlString(value: string): string {
	const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
	return `"${escaped}"`;
}

export function tomlArray(values: string[]): string {
	return `[${values.map(tomlString).join(", ")}]`;
}

export function tomlMultiline(key: string, value: string): string[] {
	if (!value.includes("'''")) return [`${key} = '''${value}'''`];
	const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
	return [`${key} = """${escaped}"""`];
}

export function skillConfigLines(paths: string[]): string[] {
	return paths.flatMap((path) => [
		"",
		"[[skills.config]]",
		`path = ${tomlString(path)}`,
		"enabled = true",
	]);
}
