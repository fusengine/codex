export type FrontmatterData = Record<string, string | string[]>;

export interface Frontmatter {
	data: FrontmatterData;
	body: string;
}
