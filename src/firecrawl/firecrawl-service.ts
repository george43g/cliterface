import { executeCommand as baseExecuteCommand, type CommandResult } from '../yabai/yabai-service';

export type { CommandResult };

export async function executeCommand(cmd: string): Promise<CommandResult> {
  console.log('[firecrawl]', cmd);
  return baseExecuteCommand(cmd);
}

// ── Scrape ──────────────────────────────────────────────────────────────────

export interface ScrapeOptions {
  url: string;
  format?: string;
  onlyMainContent?: boolean;
  waitFor?: number;
  screenshot?: boolean;
  fullPageScreenshot?: boolean;
  includeTags?: string;
  excludeTags?: string;
  query?: string;
  country?: string;
  outputPath?: string;
  json?: boolean;
  pretty?: boolean;
  summary?: boolean;
}

export function buildScrapeCommand(opts: ScrapeOptions): string {
  const parts = ['firecrawl', 'scrape', `'${opts.url}'`];
  if (opts.format) parts.push(`--format '${opts.format}'`);
  if (opts.onlyMainContent) parts.push('--only-main-content');
  if (opts.waitFor) parts.push(`--wait-for ${opts.waitFor}`);
  if (opts.screenshot) parts.push('--screenshot');
  if (opts.fullPageScreenshot) parts.push('--full-page-screenshot');
  if (opts.includeTags) parts.push(`--include-tags '${opts.includeTags}'`);
  if (opts.excludeTags) parts.push(`--exclude-tags '${opts.excludeTags}'`);
  if (opts.query) parts.push(`--query '${opts.query}'`);
  if (opts.country) parts.push(`--country ${opts.country}`);
  if (opts.outputPath) parts.push(`--output '${opts.outputPath}'`);
  if (opts.json) parts.push('--json');
  if (opts.pretty) parts.push('--pretty');
  if (opts.summary) parts.push('--summary');
  return parts.join(' ');
}

// ── Search ───────────────────────────────────────────────────────────────────

export interface SearchOptions {
  query: string;
  limit?: number;
  sources?: string;
  categories?: string;
  tbs?: string;
  location?: string;
  country?: string;
  scrape?: boolean;
  scrapeFormats?: string;
  onlyMainContent?: boolean;
  json?: boolean;
}

export function buildSearchCommand(opts: SearchOptions): string {
  const parts = ['firecrawl', 'search', `'${opts.query}'`];
  if (opts.limit) parts.push(`--limit ${opts.limit}`);
  if (opts.sources) parts.push(`--sources '${opts.sources}'`);
  if (opts.categories) parts.push(`--categories '${opts.categories}'`);
  if (opts.tbs) parts.push(`--tbs ${opts.tbs}`);
  if (opts.location) parts.push(`--location '${opts.location}'`);
  if (opts.country) parts.push(`--country ${opts.country}`);
  if (opts.scrape) parts.push('--scrape');
  if (opts.scrapeFormats) parts.push(`--scrape-formats '${opts.scrapeFormats}'`);
  if (opts.onlyMainContent) parts.push('--only-main-content');
  if (opts.json) parts.push('--json');
  return parts.join(' ');
}

// ── Map ──────────────────────────────────────────────────────────────────────

export interface MapOptions {
  url: string;
  limit?: number;
  search?: string;
  sitemap?: 'only' | 'include' | 'skip';
  includeSubdomains?: boolean;
  ignoreQueryParameters?: boolean;
  timeout?: number;
  json?: boolean;
  pretty?: boolean;
  wait?: boolean;
}

export function buildMapCommand(opts: MapOptions): string {
  const parts = ['firecrawl', 'map', `'${opts.url}'`];
  if (opts.limit) parts.push(`--limit ${opts.limit}`);
  if (opts.search) parts.push(`--search '${opts.search}'`);
  if (opts.sitemap && opts.sitemap !== 'include') parts.push(`--sitemap ${opts.sitemap}`);
  if (opts.includeSubdomains) parts.push('--include-subdomains');
  if (opts.ignoreQueryParameters) parts.push('--ignore-query-parameters');
  if (opts.timeout) parts.push(`--timeout ${opts.timeout}`);
  if (opts.json) parts.push('--json');
  if (opts.pretty) parts.push('--pretty');
  if (opts.wait) parts.push('--wait');
  return parts.join(' ');
}

// ── Crawl ────────────────────────────────────────────────────────────────────

export interface CrawlOptions {
  url: string;
  limit?: number;
  maxDepth?: number;
  excludePaths?: string;
  includePaths?: string;
  allowExternalLinks?: boolean;
  allowSubdomains?: boolean;
  crawlEntireDomain?: boolean;
  ignoreQueryParameters?: boolean;
  delay?: number;
  maxConcurrency?: number;
  wait?: boolean;
  progress?: boolean;
  pollInterval?: number;
  pretty?: boolean;
}

export function buildCrawlCommand(opts: CrawlOptions): string {
  const parts = ['firecrawl', 'crawl', `'${opts.url}'`];
  if (opts.limit) parts.push(`--limit ${opts.limit}`);
  if (opts.maxDepth) parts.push(`--max-depth ${opts.maxDepth}`);
  if (opts.excludePaths) parts.push(`--exclude-paths '${opts.excludePaths}'`);
  if (opts.includePaths) parts.push(`--include-paths '${opts.includePaths}'`);
  if (opts.allowExternalLinks) parts.push('--allow-external-links');
  if (opts.allowSubdomains) parts.push('--allow-subdomains');
  if (opts.crawlEntireDomain) parts.push('--crawl-entire-domain');
  if (opts.ignoreQueryParameters) parts.push('--ignore-query-parameters');
  if (opts.delay) parts.push(`--delay ${opts.delay}`);
  if (opts.maxConcurrency) parts.push(`--max-concurrency ${opts.maxConcurrency}`);
  if (opts.wait) parts.push('--wait');
  if (opts.progress) parts.push('--progress');
  if (opts.pollInterval) parts.push(`--poll-interval ${opts.pollInterval}`);
  if (opts.pretty) parts.push('--pretty');
  return parts.join(' ');
}

// ── Agent ────────────────────────────────────────────────────────────────────

export interface AgentOptions {
  prompt: string;
  urls?: string;
  model?: 'spark-1-mini' | 'spark-1-pro';
  schema?: string;
  maxCredits?: number;
  wait?: boolean;
  pollInterval?: number;
  json?: boolean;
  pretty?: boolean;
}

export function buildAgentCommand(opts: AgentOptions): string {
  const parts = ['firecrawl', 'agent', `'${opts.prompt}'`];
  if (opts.urls) parts.push(`--urls '${opts.urls}'`);
  if (opts.model && opts.model !== 'spark-1-mini') parts.push(`--model ${opts.model}`);
  if (opts.schema) parts.push(`--schema '${opts.schema}'`);
  if (opts.maxCredits) parts.push(`--max-credits ${opts.maxCredits}`);
  if (opts.wait) parts.push('--wait');
  if (opts.pollInterval) parts.push(`--poll-interval ${opts.pollInterval}`);
  if (opts.json) parts.push('--json');
  if (opts.pretty) parts.push('--pretty');
  return parts.join(' ');
}

// ── Browser ──────────────────────────────────────────────────────────────────

export interface BrowserOptions {
  code: string;
  profile?: string;
  json?: boolean;
}

export function buildBrowserCommand(opts: BrowserOptions): string {
  const parts = ['firecrawl', 'browser', `'${opts.code}'`];
  if (opts.profile) parts.push(`--profile '${opts.profile}'`);
  if (opts.json) parts.push('--json');
  return parts.join(' ');
}

// ── Download ──────────────────────────────────────────────────────────────────

export interface DownloadOptions {
  url: string;
  outputPath?: string;
}

export function buildDownloadCommand(opts: DownloadOptions): string {
  const parts = ['firecrawl', 'download', `'${opts.url}'`];
  if (opts.outputPath) parts.push(`--output '${opts.outputPath}'`);
  return parts.join(' ');
}

// ── Service object ───────────────────────────────────────────────────────────

export const firecrawlService = {
  async scrape(opts: ScrapeOptions): Promise<CommandResult> {
    return executeCommand(buildScrapeCommand(opts));
  },
  async search(opts: SearchOptions): Promise<CommandResult> {
    return executeCommand(buildSearchCommand(opts));
  },
  async map(opts: MapOptions): Promise<CommandResult> {
    return executeCommand(buildMapCommand(opts));
  },
  async crawl(opts: CrawlOptions): Promise<CommandResult> {
    return executeCommand(buildCrawlCommand(opts));
  },
  async agent(opts: AgentOptions): Promise<CommandResult> {
    return executeCommand(buildAgentCommand(opts));
  },
  async browser(opts: BrowserOptions): Promise<CommandResult> {
    return executeCommand(buildBrowserCommand(opts));
  },
  async download(opts: DownloadOptions): Promise<CommandResult> {
    return executeCommand(buildDownloadCommand(opts));
  },
  async status(): Promise<CommandResult> {
    return executeCommand('firecrawl --status');
  },
};
