#!/usr/bin/env bun
/**
 * cannibalization-audit.ts - Detect same-domain SERP cannibalization via Serper.
 * Usage: bun cannibalization-audit.ts <keyword> <domain> [--target-url https://...] [--gl ch] [--hl fr] [--location "City, Region, Country"] [--pages 3] [--format json|markdown]
 */
type Format = "json" | "markdown";
interface Args { keyword: string; domain: string; targetUrl?: string; gl?: string; hl?: string; location?: string; pages: number; format: Format }
interface Organic { title?: string; link?: string; snippet?: string }
interface Hit extends Organic { rank: number; page: number; domain: string; normalizedUrl: string; overlapWithTarget?: number }

function usage(message?: string): never {
  if (message) console.error(`Error: ${message}`);
  console.error("Usage: bun cannibalization-audit.ts <keyword> <domain> [--target-url https://...] [--gl ch] [--hl fr] [--location \"City, Region, Country\"] [--pages 3] [--format json|markdown]");
  process.exit(1);
}

function parseArgs(argv: string[]): Args {
  const positionals: string[] = [];
  const out: Partial<Args> = { pages: 3, format: "json" };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) { positionals.push(token); continue; }
    const [flag, inline] = token.split("=", 2);
    const value = inline ?? argv[++i];
    if (!value || value.startsWith("--")) usage(`Missing value for ${flag}`);
    if (flag === "--target-url") out.targetUrl = value;
    else if (flag === "--gl") out.gl = value;
    else if (flag === "--hl") out.hl = value;
    else if (flag === "--location") out.location = value;
    else if (flag === "--pages") out.pages = Math.max(1, Number.parseInt(value, 10));
    else if (flag === "--format" && (value === "json" || value === "markdown")) out.format = value;
    else usage(`Unknown option ${flag}`);
  }
  if (positionals.length < 2) usage();
  return { keyword: positionals[0], domain: normalizeHost(positionals[1]), targetUrl: out.targetUrl, gl: out.gl, hl: out.hl, location: out.location, pages: out.pages ?? 3, format: out.format ?? "json" };
}

function normalizeHost(input: string): string {
  const value = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  try { return new URL(value).hostname.replace(/^www\./, "").toLowerCase(); } catch { return input.replace(/^www\./, "").toLowerCase(); }
}

function normalizeUrl(input?: string): string {
  if (!input) return "";
  const value = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  const url = new URL(value);
  url.hash = "";
  url.search = "";
  url.hostname = url.hostname.replace(/^www\./, "").toLowerCase();
  return url.toString().replace(/\/$/, "");
}

async function search(q: string, args: Args, page: number, key: string): Promise<Organic[]> {
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q, gl: args.gl, hl: args.hl, location: args.location, page, num: 10 }),
  });
  if (!response.ok) throw new Error(`Serper HTTP ${response.status}: ${await response.text()}`);
  return ((await response.json()) as { organic?: Organic[] }).organic ?? [];
}

async function collect(args: Args): Promise<{ serp: Hit[]; site: Hit[] }> {
  const key = process.env.SERPER_API_KEY;
  if (!key) throw new Error("Missing SERPER_API_KEY. Export it before running this script.");
  const run = async (query: string) => {
    const hits: Hit[] = [];
    for (let page = 1; page <= args.pages; page++) {
      const organic = await search(query, args, page, key);
      organic.forEach((item, index) => {
        if (!item.link) return;
        hits.push({ ...item, rank: (page - 1) * 10 + index + 1, page, domain: normalizeHost(item.link), normalizedUrl: normalizeUrl(item.link) });
      });
      if (organic.length === 0) break;
    }
    return hits;
  };
  return { serp: await run(args.keyword), site: await run(`site:${args.domain} ${args.keyword}`) };
}

function tokenSet(text?: string): Set<string> {
  return new Set((text ?? "").toLowerCase().match(/[a-z0-9\u00c0-\u017f]{4,}/g) ?? []);
}

function overlap(a?: string, b?: string): number {
  const left = tokenSet(a), right = tokenSet(b);
  if (left.size === 0 || right.size === 0) return 0;
  return [...left].filter(token => right.has(token)).length / Math.min(left.size, right.size);
}

function analyze(args: Args, serp: Hit[], site: Hit[]) {
  const domainHits = serp.filter(hit => hit.domain === args.domain);
  const target = normalizeUrl(args.targetUrl);
  const targetHit = domainHits.find(hit => hit.normalizedUrl === target);
  const wrongRankingUrl = Boolean(target && domainHits[0] && domainHits[0].normalizedUrl !== target);
  const reference = targetHit ?? domainHits[0];
  const enriched = domainHits.map(hit => ({ ...hit, overlapWithTarget: reference && hit.normalizedUrl !== reference.normalizedUrl ? Math.max(overlap(hit.title, reference.title), overlap(hit.snippet, reference.snippet)) : 0 }));
  const duplicateIntentPages = enriched.filter(hit => hit.overlapWithTarget && hit.overlapWithTarget >= 0.35);
  const recommendations = [
    domainHits.length > 1 ? "Consolidate intent: keep one primary URL for this keyword and differentiate or de-optimize secondary URLs." : "No multi-URL ranking conflict found in checked SERPs.",
    wrongRankingUrl ? "Update internal links, title/H1, canonical signals, and content focus so the target URL is the strongest match." : "Target URL is not displaced by another checked same-domain result.",
    duplicateIntentPages.length > 0 ? "Rewrite overlapping titles/snippets and add unique section coverage for secondary pages." : "Title/snippet overlap is below the simple overlap threshold.",
  ];
  return { keyword: args.keyword, domain: args.domain, targetUrl: target || null, pagesChecked: args.pages, sameDomainResults: enriched, siteSearchResults: site.filter(hit => hit.domain === args.domain).slice(0, 10), wrongRankingUrl, duplicateIntentPages, recommendations };
}

function markdown(data: ReturnType<typeof analyze>): string {
  const same = data.sameDomainResults.map(r => `- #${r.rank} ${r.title ?? "(no title)"} - ${r.normalizedUrl} (overlap ${Math.round((r.overlapWithTarget ?? 0) * 100)}%)`).join("\n") || "- None";
  const recs = data.recommendations.map(r => `- ${r}`).join("\n");
  return [`# Cannibalization audit: ${data.keyword}`, `Domain: ${data.domain}`, `Wrong ranking URL: ${data.wrongRankingUrl ? "yes" : "no"}`, "## Same-domain SERP results", same, "## Recommendations", recs].join("\n\n");
}

try {
  if (process.execArgv.includes("--check") && process.argv.length <= 2) process.exit(0);
  const args = parseArgs(process.argv.slice(2));
  const { serp, site } = await collect(args);
  const data = analyze(args, serp, site);
  console.log(args.format === "markdown" ? markdown(data) : JSON.stringify(data, null, 2));
} catch (error) {
  console.error(`Error: ${(error as Error).message}`);
  process.exit(1);
}
