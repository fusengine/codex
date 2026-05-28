#!/usr/bin/env bun
/**
 * track-rank.ts - Track a domain or URL in Google SERPs via Serper.
 * Usage: bun track-rank.ts <keyword> <domain-or-url> [--gl ch] [--hl fr] [--location "City, Region, Country"] [--pages 3] [--target-url https://...] [--format json|markdown]
 */
type Format = "json" | "markdown";
interface Args { keyword: string; subject: string; gl?: string; hl?: string; location?: string; pages: number; format: Format; targetUrl?: string }
interface Organic { title?: string; link?: string; snippet?: string; position?: number }
interface Ranked extends Organic { page: number; rank: number; domain: string; exactUrl: boolean }

function usage(message?: string): never {
  if (message) console.error(`Error: ${message}`);
  console.error("Usage: bun track-rank.ts <keyword> <domain-or-url> [--gl ch] [--hl fr] [--location \"City, Region, Country\"] [--pages 3] [--target-url https://...] [--format json|markdown]");
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
    if (flag === "--gl") out.gl = value;
    else if (flag === "--hl") out.hl = value;
    else if (flag === "--location") out.location = value;
    else if (flag === "--target-url") out.targetUrl = value;
    else if (flag === "--pages") out.pages = Math.max(1, Number.parseInt(value, 10));
    else if (flag === "--format" && (value === "json" || value === "markdown")) out.format = value;
    else usage(`Unknown option ${flag}`);
  }
  if (positionals.length < 2) usage();
  return { keyword: positionals[0], subject: positionals[1], pages: out.pages ?? 3, format: out.format ?? "json", gl: out.gl, hl: out.hl, location: out.location, targetUrl: out.targetUrl };
}

function normalizeHost(input: string): string {
  const value = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  try { return new URL(value).hostname.replace(/^www\./, "").toLowerCase(); } catch { return input.replace(/^www\./, "").toLowerCase(); }
}

function normalizeUrl(input?: string): string | undefined {
  if (!input || !/^https?:\/\//i.test(input)) return undefined;
  const url = new URL(input);
  url.hash = "";
  url.search = "";
  url.hostname = url.hostname.replace(/^www\./, "").toLowerCase();
  return url.toString().replace(/\/$/, "");
}

async function searchPage(args: Args, page: number, key: string): Promise<Organic[]> {
  const body = { q: args.keyword, gl: args.gl, hl: args.hl, location: args.location, page, num: 10 };
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Serper HTTP ${response.status}: ${await response.text()}`);
  const json = await response.json() as { organic?: Organic[] };
  return json.organic ?? [];
}

async function collect(args: Args): Promise<{ results: Ranked[]; pagesChecked: number }> {
  const key = process.env.SERPER_API_KEY;
  if (!key) throw new Error("Missing SERPER_API_KEY. Export it before running this script.");
  const results: Ranked[] = [];
  for (let page = 1; page <= args.pages; page++) {
    const organic = await searchPage(args, page, key);
    organic.forEach((item, index) => {
      if (!item.link) return;
      const link = normalizeUrl(item.link) ?? item.link;
      results.push({ ...item, link, page, rank: (page - 1) * 10 + index + 1, domain: normalizeHost(item.link), exactUrl: normalizeUrl(item.link) === normalizeUrl(args.targetUrl ?? args.subject) });
    });
    if (organic.length === 0) return { results, pagesChecked: page };
  }
  return { results, pagesChecked: args.pages };
}

function report(args: Args, ranked: Ranked[], pagesChecked: number) {
  const domain = normalizeHost(args.subject);
  const expectedUrl = normalizeUrl(args.targetUrl);
  const matches = ranked.filter(result => result.domain === domain);
  const best = matches[0];
  const competitors = ranked.filter(result => result.domain !== domain).slice(0, 10);
  return {
    keyword: args.keyword,
    subject: args.subject,
    expectedTargetUrl: expectedUrl ?? null,
    pagesChecked,
    bestRank: best?.rank ?? null,
    matchedResults: matches,
    topCompetitors: competitors.map(({ rank, title, link, domain, snippet }) => ({ rank, title, link, domain, snippet })),
    possibleCannibalization: Boolean(expectedUrl && best && normalizeUrl(best.link) !== expectedUrl),
  };
}

function markdown(data: ReturnType<typeof report>): string {
  const matches = data.matchedResults.map(r => `- #${r.rank} ${r.title ?? "(no title)"} - ${r.link}`).join("\n") || "- None";
  const competitors = data.topCompetitors.map(r => `- #${r.rank} ${r.domain}: ${r.title ?? "(no title)"} - ${r.link}`).join("\n") || "- None";
  return [`# Rank tracking: ${data.keyword}`, `Best rank: ${data.bestRank ?? "not found"}`, `Pages checked: ${data.pagesChecked}`, `Cannibalization: ${data.possibleCannibalization ? "possible" : "not detected"}`, "## Matched results", matches, "## Top competitors", competitors].join("\n\n");
}

try {
  if (process.execArgv.includes("--check") && process.argv.length <= 2) process.exit(0);
  const args = parseArgs(process.argv.slice(2));
  const { results, pagesChecked } = await collect(args);
  const data = report(args, results, pagesChecked);
  console.log(args.format === "markdown" ? markdown(data) : JSON.stringify(data, null, 2));
} catch (error) {
  console.error(`Error: ${(error as Error).message}`);
  process.exit(1);
}
