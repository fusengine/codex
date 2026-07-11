import { FALLBACK_EFFORTS, type Choice } from "./config-options";
import type { CodexModel } from "./model-catalog";

/** Build model choices while retaining the configured model if discovery fails. */
export function modelChoices(models: CodexModel[], current?: string): Choice[] {
	if (models.length === 0 && current) return [{ value: current, label: current, hint: "current · catalog unavailable" }];
	return models.map((model) => ({
		value: model.model,
		label: model.model,
		hint: model.isDefault ? `${model.displayName} · default` : model.displayName,
	}));
}

/** Build reasoning choices supported by the selected model. */
export function effortChoices(models: CodexModel[], model?: string): Choice[] {
	const efforts = models.find((item) => item.model === model)?.supportedReasoningEfforts ?? [];
	return efforts.length > 0
		? efforts.map((item) => ({ value: item.reasoningEffort, label: item.reasoningEffort, hint: item.description }))
		: FALLBACK_EFFORTS;
}
