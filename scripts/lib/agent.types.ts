export type AgentTomlOptions = {
	fallbackSkillNames: string[];
	resolveSkillPaths: (skillNames: string[]) => string[];
};
