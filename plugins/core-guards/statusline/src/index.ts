#!/usr/bin/env bun
/**
 * Statusline Entry Point
 *
 * @description Main entry point of the Claude Code statusline
 * SOLID architecture with modular segments
 *
 * @see https://starship.rs/guide/ - Inspired by Starship
 * @see https://blog.logrocket.com/applying-solid-principles-typescript/
 */

import { ConfigManager } from "./config/manager";
import type { HookInput, SegmentContext } from "./interfaces";
import { StatuslineRenderer } from "./renderer";
import {
	getContextFromInput,
	trackDailySpend,
	trackFiveHourUsage,
	trackWeeklyUsage,
} from "./services";
import { colors, getGitInfo } from "./utils";

async function main(): Promise<void> {
	try {
		// 1. Read the Claude Code input
		const input: HookInput = await Bun.stdin.json();

		// 2. Load the configuration
		const configManager = new ConfigManager();
		const config = await configManager.load();

		// 3. Compute context data
		const contextData = getContextFromInput(
			input,
			config.context.estimateOverhead,
			config.context.overheadTokens,
		);

		// 4. Track 5-hour usage
		const fiveHourUsage = trackFiveHourUsage(
			input.session_id,
			contextData.tokens,
			input.model.id,
			config.fiveHour.subscriptionPlan,
		);

		// 5. Track weekly usage (if enabled)
		const weeklyUsage = config.weekly.enabled
			? trackWeeklyUsage(input.session_id, contextData.tokens, input.cost.total_cost_usd)
			: undefined;

		// 6. Track daily spend (if enabled)
		const dailySpend = config.dailySpend.enabled
			? trackDailySpend(input.session_id, input.cost.total_cost_usd, config.dailySpend.budget)
			: undefined;

		// 7. Get Git info
		const git = await getGitInfo();

		// 8. Get the Node version
		const nodeVersion = process.version || "N/A";

		// 9. Build the segment context
		const segmentContext: SegmentContext = {
			input,
			context: contextData,
			fiveHourUsage,
			weeklyUsage,
			dailySpend,
			git,
			nodeVersion,
		};

		// 10. Render the statusline
		const renderer = new StatuslineRenderer();
		const statusline = await renderer.render(segmentContext, config);
		console.log(statusline);

		// 11. Show warnings if needed
		const pct = Math.round(fiveHourUsage.percentage);
		if (pct >= 100) {
			console.log(`\n${colors.red(config.icons.warning)} LIMIT REACHED: ${pct}% of 5h`);
		} else if (pct >= 90) {
			console.log(`\n${colors.yellow(config.icons.warning)} Warning: ${pct}% of the 5h limit`);
		}
	} catch (error) {
		console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
}

main();
