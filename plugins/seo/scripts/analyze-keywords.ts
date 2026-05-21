#!/usr/bin/env bun
/**
 * analyze-keywords.ts — SEO Content Intelligence CLI
 * Usage: bun analyze-keywords.ts <url-or-path> --keyword "main keyword" [--format json|markdown]
 */
import * as cheerio from "cheerio";

type OutputFormat = "json" | "markdown";

interface CliOptions {
  input: string;
  keyword: string;
  synonyms: string[];
  locations: string[];
  brand: string | null;
  allowBrandTitle: boolean;
  compareSerp: boolean;
  gl: string;
  hl: string;
  location: string | null;
  lang: string;
  format: OutputFormat;
}

interface HeadingItem { level: "h1" | "h2" | "h3"; text: string }
interface TermStat { term: string; count: number; density: number; inTitle: boolean; inH1: boolean }
interface Issue { level: "info" | "warning" | "error"; message: string; detail?: string }
interface NgramStat { phrase: string; count: number }
interface LocalSignal { location: string; mentions: number; contextualMentions: number; stuffingSignals: string[] }
interface SerpCompetitor { title: string; link: string; snippet: string; words: number; chars: number }

interface Report {
  input: string;
  target: { keyword: string; synonyms: string[]; locations: string[]; brand: string | null };
  metrics: {
    chars: number;
    words: number;
    sentences: number;
    paragraphs: number;
    headings: { h1: number; h2: number; h3: number; total: number };
    thinContentRisk: "low" | "medium" | "high";
  };
  meta: {
    title: string;
    titleLength: number;
    description: string;
    descriptionLength: number;
    h1: string[];
    titleH1Similarity: number;
    issues: Issue[];
  };
  headings: {
    items: HeadingItem[];
    coverage: Record<string, string[]>;
    exactMatchOveruse: boolean;
    emptyHeadingSections: string[];
    issues: Issue[];
  };
  keywords: {
    exact: TermStat;
    variants: TermStat[];
    repeatedWords: NgramStat[];
    ngrams: Record<"2" | "3" | "4" | "5", NgramStat[]>;
    repeatedSimilarPhrases: NgramStat[];
    localRepetitionWindows: Array<{ term: string; windowStart: number; count: number }>;
    stuffingScore: number;
    stuffingSignals: Issue[];
  };
  local: {
    distribution: LocalSignal[];
    listStuffing: Issue[];
  };
  serp?: {
    enabled: boolean;
    warning?: string;
    query?: string;
    medianWords?: number;
    medianChars?: number;
    titleVariants?: string[];
    snippetVariants?: string[];
    competitors?: SerpCompetitor[];
  };
  warnings: string[];
}

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "de", "des", "du", "en", "et", "for", "from", "in", "is", "la", "le", "les",
  "of", "on", "or", "pour", "that", "the", "to", "un", "une", "with", "your", "vous", "vos", "notre", "nos", "dans",
]);

const SERVICE_TERMS = [
  "service", "services", "solution", "solutions", "agency", "agence", "expert", "experts", "consultant", "creation", "création",
  "website", "site", "web", "seo", "marketing", "development", "développement", "design", "audit", "local", "business",
];

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    input: "",
    keyword: "",
    synonyms: [],
    locations: [],
    brand: null,
    allowBrandTitle: false,
    compareSerp: false,
    gl: "us",
    hl: "en",
    location: null,
    lang: "en",
    format: "json",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--") && !opts.input) {
      opts.input = arg;
      continue;
    }
    if (arg === "--allow-brand-title") opts.allowBrandTitle = true;
    else if (arg === "--compare-serp") opts.compareSerp = true;
    else if (arg === "--keyword" || arg === "--primary") opts.keyword = requireValue(argv, ++i, arg);
    else if (arg === "--synonyms") opts.synonyms = splitList(requireValue(argv, ++i, arg));
    else if (arg === "--locations") opts.locations = splitList(requireValue(argv, ++i, arg));
    else if (arg === "--brand") opts.brand = requireValue(argv, ++i, arg);
    else if (arg === "--gl") opts.gl = requireValue(argv, ++i, arg);
    else if (arg === "--hl") opts.hl = requireValue(argv, ++i, arg);
    else if (arg === "--location") opts.location = requireValue(argv, ++i, arg);
    else if (arg === "--lang") opts.lang = requireValue(argv, ++i, arg);
    else if (arg === "--format") opts.format = parseFormat(requireValue(argv, ++i, arg));
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!opts.input) throw new Error("Missing input URL or local file path");
  if (!opts.keyword) throw new Error("Missing required --keyword");
  return opts;
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
  return value;
}

function parseFormat(value: string): OutputFormat {
  if (value !== "json" && value !== "markdown") throw new Error("--format must be json or markdown");
  return value;
}

function splitList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

async function fetchHtml(input: string): Promise<string> {
  if (/^https?:\/\//.test(input)) {
    const res = await fetch(input);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${input}`);
    return res.text();
  }
  return Bun.file(input).text();
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalize(value: string): string {
  return cleanText(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function wordsOf(value: string): string[] {
  return normalize(value).match(/[a-z0-9]+(?:['-][a-z0-9]+)?/gi) ?? [];
}

function sentencesOf(value: string): string[] {
  return cleanText(value).split(/(?<=[.!?])\s+|\n+/).map(cleanText).filter((s) => wordsOf(s).length > 2);
}

function extractContent(html: string) {
  const $ = cheerio.load(html);
  const title = cleanText($("title").first().text());
  const description = cleanText($("meta[name='description']").attr("content") ?? "");
  $("script,style,nav,footer,header,aside,noscript,svg").remove();
  const headingItems: HeadingItem[] = [];
  $("h1,h2,h3").each((_, el) => {
    const level = el.tagName.toLowerCase() as HeadingItem["level"];
    headingItems.push({ level, text: cleanText($(el).text()) });
  });
  const paragraphs = $("p").map((_, el) => cleanText($(el).text())).get().filter(Boolean);
  const bodyText = cleanText($("body").text());
  const fullText = cleanText([title, description, ...headingItems.map((h) => h.text), bodyText].filter(Boolean).join(" "));
  return { $, title, description, headingItems, paragraphs, bodyText, fullText };
}

function countPhrase(text: string, phrase: string): number {
  const target = wordsOf(phrase).join(" ");
  if (!target) return 0;
  const haystack = wordsOf(text).join(" ");
  return haystack.split(target).length - 1;
}

function includesTerm(text: string, term: string): boolean {
  return countPhrase(text, term) > 0;
}

function jaccardSimilarity(a: string, b: string): number {
  const left = new Set(wordsOf(a).filter((w) => !STOP_WORDS.has(w)));
  const right = new Set(wordsOf(b).filter((w) => !STOP_WORDS.has(w)));
  if (left.size === 0 || right.size === 0) return 0;
  const intersection = [...left].filter((w) => right.has(w)).length;
  return Number((intersection / new Set([...left, ...right]).size).toFixed(2));
}

function topNgrams(words: string[], size: 2 | 3 | 4 | 5, limit = 12): NgramStat[] {
  const counts = new Map<string, number>();
  for (let i = 0; i <= words.length - size; i += 1) {
    const phraseWords = words.slice(i, i + size);
    if (phraseWords.every((word) => STOP_WORDS.has(word))) continue;
    const phrase = phraseWords.join(" ");
    counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([phrase, count]) => ({ phrase, count }));
}

function repeatedWords(words: string[]): NgramStat[] {
  const counts = new Map<string, number>();
  for (const word of words) {
    if (word.length < 4 || STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([phrase, count]) => ({ phrase, count }));
}

function termStats(term: string, text: string, title: string, h1s: string[], totalWords: number): TermStat {
  const count = countPhrase(text, term);
  return {
    term,
    count,
    density: totalWords ? Number(((count * wordsOf(term).length / totalWords) * 100).toFixed(2)) : 0,
    inTitle: includesTerm(title, term),
    inH1: h1s.some((h1) => includesTerm(h1, term)),
  };
}

function analyzeMeta(title: string, description: string, h1s: string[], opts: CliOptions): Report["meta"] {
  const issues: Issue[] = [];
  if (!title) issues.push({ level: "error", message: "Missing title" });
  if (title.length > 60) issues.push({ level: "warning", message: "Title exceeds 60 characters", detail: `${title.length} chars` });
  if (!description) issues.push({ level: "warning", message: "Missing meta description" });
  if (description.length > 150) issues.push({ level: "warning", message: "Description exceeds 150 characters", detail: `${description.length} chars` });
  if (opts.brand && !opts.allowBrandTitle && includesTerm(title, opts.brand)) {
    issues.push({ level: "warning", message: "Brand appears in title", detail: "Pass --allow-brand-title to suppress" });
  }
  const bestH1Similarity = Math.max(0, ...h1s.map((h1) => jaccardSimilarity(title, h1)));
  if (title && h1s.length && bestH1Similarity < 0.25) issues.push({ level: "warning", message: "Title and H1 appear semantically distant", detail: `${bestH1Similarity}` });
  const titleOrH1 = [title, ...h1s].join(" ");
  if (![opts.keyword, ...opts.synonyms].some((term) => includesTerm(titleOrH1, term))) {
    issues.push({ level: "warning", message: "Keyword or synonym missing from title/H1" });
  }
  return { title, titleLength: title.length, description, descriptionLength: description.length, h1: h1s, titleH1Similarity: bestH1Similarity, issues };
}

function analyzeHeadings(headings: HeadingItem[], opts: CliOptions): Report["headings"] {
  const terms = [opts.keyword, ...opts.synonyms];
  const coverage: Record<string, string[]> = {};
  const issues: Issue[] = [];
  for (const term of terms) coverage[term] = headings.filter((h) => includesTerm(h.text, term)).map((h) => `${h.level}: ${h.text}`);
  const exactMatches = headings.filter((h) => normalize(h.text) === normalize(opts.keyword)).length;
  const exactMatchOveruse = exactMatches >= 2;
  if (exactMatchOveruse) issues.push({ level: "warning", message: "Exact-match heading overuse", detail: `${exactMatches} exact headings` });
  const emptyHeadingSections = headings.filter((h) => wordsOf(h.text).length === 0).map((h) => h.level);
  if (emptyHeadingSections.length) issues.push({ level: "warning", message: "Empty heading text found", detail: emptyHeadingSections.join(", ") });
  if (!headings.some((h) => h.level === "h2" && terms.some((term) => includesTerm(h.text, term)))) {
    issues.push({ level: "info", message: "No H2 covers keyword or synonym" });
  }
  return { items: headings, coverage, exactMatchOveruse, emptyHeadingSections, issues };
}

function localWindows(words: string[], terms: string[]): Array<{ term: string; windowStart: number; count: number }> {
  const out: Array<{ term: string; windowStart: number; count: number }> = [];
  const normalizedTerms = terms.map((term) => ({ raw: term, tokens: wordsOf(term) })).filter((t) => t.tokens.length);
  for (let i = 0; i < words.length; i += 25) {
    const slice = words.slice(i, i + 50).join(" ");
    for (const term of normalizedTerms) {
      const count = slice.split(term.tokens.join(" ")).length - 1;
      if (count >= 3) out.push({ term: term.raw, windowStart: i, count });
    }
  }
  return out.slice(0, 20);
}

function similarRepeatedPhrases(ngrams: NgramStat[]): NgramStat[] {
  const grouped = new Map<string, number>();
  for (const item of ngrams) {
    const key = wordsOf(item.phrase).filter((w) => !STOP_WORDS.has(w)).slice(0, 3).join(" ");
    if (!key) continue;
    grouped.set(key, (grouped.get(key) ?? 0) + item.count);
  }
  return [...grouped.entries()].filter(([, count]) => count >= 4).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([phrase, count]) => ({ phrase, count }));
}

function analyzeKeywords(text: string, title: string, h1s: string[], opts: CliOptions): Report["keywords"] {
  const words = wordsOf(text);
  const exact = termStats(opts.keyword, text, title, h1s, words.length);
  const variants = opts.synonyms.map((term) => termStats(term, text, title, h1s, words.length));
  const ngrams = { "2": topNgrams(words, 2), "3": topNgrams(words, 3), "4": topNgrams(words, 4), "5": topNgrams(words, 5) };
  const repeated = repeatedWords(words);
  const repeatedSimilarPhrases = similarRepeatedPhrases([...ngrams["3"], ...ngrams["4"], ...ngrams["5"]]);
  const localRepetitionWindows = localWindows(words, [opts.keyword, ...opts.synonyms]);
  const stuffingSignals: Issue[] = [];
  if (exact.density > 3.5) stuffingSignals.push({ level: "warning", message: "High exact keyword density", detail: `${exact.density}%` });
  if (exact.count >= 10 && variants.every((v) => v.count === 0)) stuffingSignals.push({ level: "warning", message: "Exact keyword repeated without synonym support" });
  if (repeated[0]?.count >= Math.max(8, words.length * 0.025)) stuffingSignals.push({ level: "warning", message: "Dominant repeated word", detail: `${repeated[0].phrase}: ${repeated[0].count}` });
  if (localRepetitionWindows.length >= 2) stuffingSignals.push({ level: "warning", message: "Clustered local keyword repetition", detail: `${localRepetitionWindows.length} dense windows` });
  if (repeatedSimilarPhrases.length >= 4) stuffingSignals.push({ level: "warning", message: "Repeated similar phrase patterns", detail: `${repeatedSimilarPhrases.length} phrase groups` });
  const stuffingScore = Math.min(100, stuffingSignals.length * 18 + Math.max(0, exact.density - 2) * 8 + localRepetitionWindows.length * 4);
  return { exact, variants, repeatedWords: repeated, ngrams, repeatedSimilarPhrases, localRepetitionWindows, stuffingScore: Number(stuffingScore.toFixed(1)), stuffingSignals };
}

function nearbyContext(sentence: string, location: string, terms: string[]): boolean {
  if (!includesTerm(sentence, location)) return false;
  const sentenceWords = wordsOf(sentence);
  if (terms.some((term) => includesTerm(sentence, term))) return true;
  const locTokens = wordsOf(location);
  const locIndex = findTokenSequence(sentenceWords, locTokens);
  const serviceIndex = sentenceWords.findIndex((word) => SERVICE_TERMS.includes(word));
  return serviceIndex >= 0 && locIndex >= 0 && Math.abs(serviceIndex - locIndex) <= 15;
}

function findTokenSequence(words: string[], sequence: string[]): number {
  if (!sequence.length || sequence.length > words.length) return -1;
  for (let i = 0; i <= words.length - sequence.length; i += 1) {
    if (sequence.every((token, offset) => words[i + offset] === token)) return i;
  }
  return -1;
}

function analyzeLocal(text: string, opts: CliOptions): Report["local"] {
  const sentences = sentencesOf(text);
  const terms = [opts.keyword, ...opts.synonyms, ...SERVICE_TERMS];
  const distribution = opts.locations.map((location) => {
    const matching = sentences.filter((sentence) => includesTerm(sentence, location));
    const contextualMentions = matching.filter((sentence) => nearbyContext(sentence, location, terms)).length;
    const stuffingSignals: string[] = [];
    if (matching.length > 0 && contextualMentions === 0) stuffingSignals.push("mentioned without nearby service or keyword context");
    return { location, mentions: matching.length, contextualMentions, stuffingSignals };
  });
  const listStuffing: Issue[] = [];
  for (const sentence of sentences) {
    const locationsInSentence = opts.locations.filter((location) => includesTerm(sentence, location));
    if (locationsInSentence.length > 4) listStuffing.push({ level: "warning", message: "Many locations in one sentence", detail: locationsInSentence.join(", ") });
    if (locationsInSentence.length >= 3 && /^[\w\s,'-]+[.!?]?$/.test(sentence) && (sentence.match(/,/g) ?? []).length >= locationsInSentence.length - 1) {
      listStuffing.push({ level: "warning", message: "Possible comma-only location list", detail: sentence.slice(0, 180) });
    }
  }
  return { distribution, listStuffing };
}

function thinRisk(words: number, paragraphs: number, headings: number): "low" | "medium" | "high" {
  if (words < 300 || paragraphs < 2) return "high";
  if (words < 700 || headings < 2) return "medium";
  return "low";
}

function median(values: number[]): number {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

async function serperSearch(opts: CliOptions): Promise<Report["serp"]> {
  if (!opts.compareSerp) return undefined;
  const key = process.env.SERPER_API_KEY;
  if (!key) return { enabled: false, warning: "SERPER_API_KEY missing; skipped SERP comparison" };
  const query = [opts.keyword, opts.location ?? opts.locations[0] ?? ""].filter(Boolean).join(" ");
  const searchRes = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, gl: opts.gl, hl: opts.hl, location: opts.location ?? undefined, num: 10 }),
  });
  if (!searchRes.ok) return { enabled: false, warning: `Serper search HTTP ${searchRes.status}`, query };
  const searchJson = await searchRes.json() as { organic?: Array<{ title?: string; link?: string; snippet?: string }> };
  const organic = (searchJson.organic ?? []).slice(0, 10);
  const competitors: SerpCompetitor[] = [];
  for (const item of organic) {
    const link = item.link ?? "";
    let text = `${item.title ?? ""} ${item.snippet ?? ""}`;
    if (link) {
      try {
        const scrape = await fetch("https://google.serper.dev/scrape", {
          method: "POST",
          headers: { "X-API-KEY": key, "Content-Type": "application/json" },
          body: JSON.stringify({ url: link }),
        });
        if (scrape.ok) {
          const scraped = await scrape.json() as { text?: string; title?: string };
          text = cleanText([scraped.title, scraped.text].filter(Boolean).join(" "));
        }
      } catch {
        // Keep the SERP snippet fallback; competitor fetch failures should not fail analysis.
      }
    }
    competitors.push({ title: item.title ?? "", link, snippet: item.snippet ?? "", words: wordsOf(text).length, chars: text.length });
  }
  return {
    enabled: true,
    query,
    medianWords: median(competitors.map((c) => c.words)),
    medianChars: median(competitors.map((c) => c.chars)),
    titleVariants: [...new Set(competitors.map((c) => c.title).filter(Boolean))].slice(0, 10),
    snippetVariants: [...new Set(competitors.map((c) => c.snippet).filter(Boolean))].slice(0, 10),
    competitors,
  };
}

async function buildReport(opts: CliOptions): Promise<Report> {
  const html = await fetchHtml(opts.input);
  const content = extractContent(html);
  const h1s = content.headingItems.filter((h) => h.level === "h1").map((h) => h.text);
  const h2Count = content.headingItems.filter((h) => h.level === "h2").length;
  const h3Count = content.headingItems.filter((h) => h.level === "h3").length;
  const words = wordsOf(content.fullText);
  const sentences = sentencesOf(content.bodyText);
  const headings = content.headingItems.length;
  const warnings: string[] = [];
  const serp = await serperSearch(opts);
  if (serp?.warning) warnings.push(serp.warning);
  return {
    input: opts.input,
    target: { keyword: opts.keyword, synonyms: opts.synonyms, locations: opts.locations, brand: opts.brand },
    metrics: {
      chars: content.fullText.length,
      words: words.length,
      sentences: sentences.length,
      paragraphs: content.paragraphs.length,
      headings: { h1: h1s.length, h2: h2Count, h3: h3Count, total: headings },
      thinContentRisk: thinRisk(words.length, content.paragraphs.length, headings),
    },
    meta: analyzeMeta(content.title, content.description, h1s, opts),
    headings: analyzeHeadings(content.headingItems, opts),
    keywords: analyzeKeywords(content.fullText, content.title, h1s, opts),
    local: analyzeLocal(content.bodyText, opts),
    serp,
    warnings,
  };
}

function markdown(report: Report): string {
  const lines = [
    `# SEO Content Intelligence`,
    ``,
    `- Input: ${report.input}`,
    `- Keyword: ${report.target.keyword}`,
    `- Words: ${report.metrics.words}`,
    `- Characters: ${report.metrics.chars}`,
    `- Thin content risk: ${report.metrics.thinContentRisk}`,
    `- Exact density: ${report.keywords.exact.density}% (${report.keywords.exact.count} occurrences)`,
    `- Keyword stuffing score: ${report.keywords.stuffingScore}/100`,
    ``,
    `## Meta`,
    `- Title (${report.meta.titleLength}): ${report.meta.title || "(missing)"}`,
    `- Description (${report.meta.descriptionLength}): ${report.meta.description || "(missing)"}`,
    `- Title/H1 similarity: ${report.meta.titleH1Similarity}`,
    ``,
    `## Issues`,
    ...[...report.meta.issues, ...report.headings.issues, ...report.keywords.stuffingSignals, ...report.local.listStuffing]
      .map((issue) => `- [${issue.level}] ${issue.message}${issue.detail ? ` — ${issue.detail}` : ""}`),
  ];
  if (report.serp?.enabled) lines.push(``, `## SERP`, `- Query: ${report.serp.query}`, `- Median words: ${report.serp.medianWords}`, `- Median chars: ${report.serp.medianChars}`);
  if (report.warnings.length) lines.push(``, `## Warnings`, ...report.warnings.map((warning) => `- ${warning}`));
  return lines.join("\n");
}

const usage = "Usage: bun analyze-keywords.ts <url-or-path> --keyword <keyword> [--synonyms a,b] [--locations city1,city2] [--brand name] [--allow-brand-title] [--compare-serp] [--gl us] [--hl en] [--location city] [--lang en] [--format json|markdown]";

try {
  if (process.execArgv.includes("--check") && process.argv.length <= 2) process.exit(0);
  const opts = parseArgs(process.argv.slice(2));
  const report = await buildReport(opts);
  console.log(opts.format === "markdown" ? markdown(report) : JSON.stringify(report, null, 2));
} catch (e) {
  console.error(`Error: ${(e as Error).message}`);
  console.error(usage);
  process.exit(1);
}
