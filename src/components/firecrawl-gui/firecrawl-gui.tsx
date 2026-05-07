import { Component, h, State } from '@stencil/core';
import {
  AGENT_MODELS,
  BROWSER_PRESETS,
  MAP_SITEMAP_MODES,
  SCRAPE_FORMATS,
  SEARCH_TBS_OPTIONS,
  validateDepth,
  validateLimit,
  validateUrl,
} from '../../firecrawl/firecrawl-command-builders';
import {
  buildAgentCommand,
  buildBrowserCommand,
  buildCrawlCommand,
  buildMapCommand,
  buildScrapeCommand,
  buildSearchCommand,
  type CommandResult,
  firecrawlService,
} from '../../firecrawl/firecrawl-service';

type TabId = 'scrape' | 'search' | 'map' | 'crawl' | 'agent' | 'browser';
type Status = 'idle' | 'running' | 'success' | 'error';

const TAB_DEFINITIONS: { id: TabId; label: string }[] = [
  { id: 'scrape', label: 'Scrape' },
  { id: 'search', label: 'Search' },
  { id: 'map', label: 'Map' },
  { id: 'crawl', label: 'Crawl' },
  { id: 'agent', label: 'Agent' },
  { id: 'browser', label: 'Browser' },
];

@Component({
  tag: 'firecrawl-gui',
  styleUrl: 'firecrawl-gui.css',
  scoped: true,
})
export class FirecrawlGui {
  // ── UI state ────────────────────────────────────────────────────────────────
  @State() activeTab: TabId = 'scrape';
  @State() status: Status = 'idle';
  @State() output = 'Select a tab and fill in the form to build a command.';
  @State() lastCommand = 'Ready...';
  @State() statusMessage = 'Ready';

  // ── Scrape tab ──────────────────────────────────────────────────────────────
  @State() scrapeUrl = '';
  @State() scrapeFormat = 'markdown';
  @State() scrapeOnlyMain = false;
  @State() scrapeWaitFor = 0;
  @State() scrapeScreenshot = false;
  @State() scrapeFullPage = false;
  @State() scrapeIncludeTags = '';
  @State() scrapeExcludeTags = '';
  @State() scrapeQuery = '';
  @State() scrapeJson = false;
  @State() scrapePretty = false;
  @State() scrapeUrlError: string | null = null;

  // ── Search tab ──────────────────────────────────────────────────────────────
  @State() searchQuery = '';
  @State() searchLimit = 5;
  @State() searchSources = 'web';
  @State() searchCategories = '';
  @State() searchTbs = '';
  @State() searchLocation = '';
  @State() searchScrape = false;
  @State() searchJson = false;

  // ── Map tab ─────────────────────────────────────────────────────────────────
  @State() mapUrl = '';
  @State() mapLimit = 0;
  @State() mapSearch = '';
  @State() mapSitemap: 'only' | 'include' | 'skip' = 'include';
  @State() mapIncludeSubdomains = false;
  @State() mapIgnoreQueryParams = false;
  @State() mapJson = false;
  @State() mapPretty = false;
  @State() mapUrlError: string | null = null;

  // ── Crawl tab ────────────────────────────────────────────────────────────────
  @State() crawlUrl = '';
  @State() crawlLimit = 0;
  @State() crawlMaxDepth = 0;
  @State() crawlExcludePaths = '';
  @State() crawlIncludePaths = '';
  @State() crawlAllowExternal = false;
  @State() crawlAllowSubdomains = false;
  @State() crawlEntireDomain = false;
  @State() crawlDelay = 0;
  @State() crawlMaxConcurrency = 0;
  @State() crawlWait = false;
  @State() crawlProgress = false;
  @State() crawlPretty = false;
  @State() crawlUrlError: string | null = null;
  @State() crawlDepthError: string | null = null;

  // ── Agent tab ────────────────────────────────────────────────────────────────
  @State() agentPrompt = '';
  @State() agentUrls = '';
  @State() agentModel: 'spark-1-mini' | 'spark-1-pro' = 'spark-1-mini';
  @State() agentSchema = '';
  @State() agentMaxCredits = 0;
  @State() agentWait = false;
  @State() agentJson = false;
  @State() agentPretty = false;

  // ── Browser tab ──────────────────────────────────────────────────────────────
  @State() browserCode = '';
  @State() browserProfile = '';
  @State() browserJson = false;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private buildCurrentCommand(): string {
    switch (this.activeTab) {
      case 'scrape':
        return buildScrapeCommand({
          url: this.scrapeUrl || 'https://example.com',
          format: this.scrapeFormat !== 'markdown' ? this.scrapeFormat : undefined,
          onlyMainContent: this.scrapeOnlyMain,
          waitFor: this.scrapeWaitFor || undefined,
          screenshot: this.scrapeScreenshot,
          fullPageScreenshot: this.scrapeFullPage,
          includeTags: this.scrapeIncludeTags || undefined,
          excludeTags: this.scrapeExcludeTags || undefined,
          query: this.scrapeQuery || undefined,
          json: this.scrapeJson,
          pretty: this.scrapePretty,
        });
      case 'search':
        return buildSearchCommand({
          query: this.searchQuery || '<query>',
          limit: this.searchLimit !== 5 ? this.searchLimit : undefined,
          sources: this.searchSources !== 'web' ? this.searchSources : undefined,
          categories: this.searchCategories || undefined,
          tbs: this.searchTbs || undefined,
          location: this.searchLocation || undefined,
          scrape: this.searchScrape,
          json: this.searchJson,
        });
      case 'map':
        return buildMapCommand({
          url: this.mapUrl || 'https://example.com',
          limit: this.mapLimit || undefined,
          search: this.mapSearch || undefined,
          sitemap: this.mapSitemap,
          includeSubdomains: this.mapIncludeSubdomains,
          ignoreQueryParameters: this.mapIgnoreQueryParams,
          json: this.mapJson,
          pretty: this.mapPretty,
        });
      case 'crawl':
        return buildCrawlCommand({
          url: this.crawlUrl || 'https://example.com',
          limit: this.crawlLimit || undefined,
          maxDepth: this.crawlMaxDepth || undefined,
          excludePaths: this.crawlExcludePaths || undefined,
          includePaths: this.crawlIncludePaths || undefined,
          allowExternalLinks: this.crawlAllowExternal,
          allowSubdomains: this.crawlAllowSubdomains,
          crawlEntireDomain: this.crawlEntireDomain,
          delay: this.crawlDelay || undefined,
          maxConcurrency: this.crawlMaxConcurrency || undefined,
          wait: this.crawlWait,
          progress: this.crawlProgress,
          pretty: this.crawlPretty,
        });
      case 'agent':
        return buildAgentCommand({
          prompt: this.agentPrompt || '<prompt>',
          urls: this.agentUrls || undefined,
          model: this.agentModel,
          schema: this.agentSchema || undefined,
          maxCredits: this.agentMaxCredits || undefined,
          wait: this.agentWait,
          json: this.agentJson,
          pretty: this.agentPretty,
        });
      case 'browser':
        return buildBrowserCommand({
          code: this.browserCode || '<code>',
          profile: this.browserProfile || undefined,
          json: this.browserJson,
        });
      default:
        return 'firecrawl --help';
    }
  }

  private async runCommand(result: Promise<CommandResult>, cmd: string): Promise<void> {
    this.status = 'running';
    this.lastCommand = cmd;
    this.output = 'Running...';
    this.statusMessage = 'Running...';
    try {
      const r = await result;
      const sections = [r.stdout?.trim(), r.stderr?.trim() ? `stderr:\n${r.stderr.trim()}` : ''].filter(Boolean);
      this.output = sections.join('\n\n') || '(no output)';
      this.status = r.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = r.exitCode === 0 ? 'Completed' : `Failed (exit ${r.exitCode})`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private setTemporaryStatus(msg: string): void {
    this.statusMessage = msg;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = this.status === 'running' ? 'Running...' : this.status === 'success' ? 'Completed' : 'Ready';
      }, 2000);
    }
  }

  async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      this.setTemporaryStatus('Clipboard unavailable');
      return;
    }
    await navigator.clipboard.writeText(this.output);
    this.setTemporaryStatus('Copied!');
  }

  clearOutput(): void {
    this.output = 'Select a tab and fill in the form to build a command.';
    this.lastCommand = 'Ready...';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  // ── Tab renderers ─────────────────────────────────────────────────────────

  renderScrapeTab() {
    const cmd = this.buildCurrentCommand();
    const urlErr = this.scrapeUrlError;

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Scrape Options</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            URL <span class="text-danger text-xs">*</span>
            <input
              type="url"
              class={`cli-input w-full ${urlErr ? 'cli-input-invalid' : this.scrapeUrl ? 'cli-input-valid' : ''}`}
              placeholder="https://example.com"
              value={this.scrapeUrl}
              onInput={(e: Event) => {
                this.scrapeUrl = (e.target as HTMLInputElement).value;
                this.scrapeUrlError = validateUrl(this.scrapeUrl);
              }}
            />
            {urlErr && <span class="cli-validation-message invalid">{urlErr}</span>}
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Output format
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.scrapeFormat = (e.target as HTMLSelectElement).value;
              }}
            >
              {SCRAPE_FORMATS.map(f => (
                <option key={f.value} value={f.value} selected={this.scrapeFormat === f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            AI query (--query)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="Ask a question about the page..."
              value={this.scrapeQuery}
              onInput={(e: Event) => {
                this.scrapeQuery = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Wait before scraping (ms)
            <input
              type="number"
              class="cli-input w-32"
              min="0"
              max="60000"
              value={this.scrapeWaitFor || ''}
              placeholder="0"
              onInput={(e: Event) => {
                this.scrapeWaitFor = parseInt((e.target as HTMLInputElement).value) || 0;
              }}
            />
          </label>

          <div class="grid grid-cols-2 gap-2 mb-4">
            {[
              {
                label: 'Only main content',
                state: this.scrapeOnlyMain,
                set: (v: boolean) => {
                  this.scrapeOnlyMain = v;
                },
              },
              {
                label: 'Screenshot',
                state: this.scrapeScreenshot,
                set: (v: boolean) => {
                  this.scrapeScreenshot = v;
                },
              },
              {
                label: 'Full-page screenshot',
                state: this.scrapeFullPage,
                set: (v: boolean) => {
                  this.scrapeFullPage = v;
                },
              },
              {
                label: 'JSON output',
                state: this.scrapeJson,
                set: (v: boolean) => {
                  this.scrapeJson = v;
                },
              },
              {
                label: 'Pretty print',
                state: this.scrapePretty,
                set: (v: boolean) => {
                  this.scrapePretty = v;
                },
              },
            ].map(({ label, state, set }) => (
              <label key={label} class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={state}
                  onChange={(e: Event) => {
                    set((e.target as HTMLInputElement).checked);
                  }}
                />
                {label}
              </label>
            ))}
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              disabled={!!urlErr || !this.scrapeUrl}
              onClick={() => {
                const c = this.buildCurrentCommand();
                this.runCommand(
                  firecrawlService.scrape({
                    url: this.scrapeUrl,
                    format: this.scrapeFormat !== 'markdown' ? this.scrapeFormat : undefined,
                    onlyMainContent: this.scrapeOnlyMain,
                    waitFor: this.scrapeWaitFor || undefined,
                    screenshot: this.scrapeScreenshot,
                    fullPageScreenshot: this.scrapeFullPage,
                    query: this.scrapeQuery || undefined,
                    json: this.scrapeJson,
                    pretty: this.scrapePretty,
                  }),
                  c,
                );
              }}
            >
              Scrape
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear
            </button>
          </div>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Advanced Filters</h3>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Include tags (comma-separated)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="article,main"
              value={this.scrapeIncludeTags}
              onInput={(e: Event) => {
                this.scrapeIncludeTags = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Exclude tags (comma-separated)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="nav,footer,aside"
              value={this.scrapeExcludeTags}
              onInput={(e: Event) => {
                this.scrapeExcludeTags = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <h3 class="text-text2 text-base mb-2">Command Preview</h3>
          <div class="cli-cmd-preview">{cmd}</div>

          <div class="mt-4 flex justify-between items-center mb-1">
            <span class="text-text2 text-sm">
              Status: <span class={this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : ''}>{this.statusMessage}</span>
            </span>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
          </div>
          <pre class="cli-output">{this.output}</pre>
        </div>
      </div>
    );
  }

  renderSearchTab() {
    const cmd = this.buildCurrentCommand();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Search Options</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Search query <span class="text-danger text-xs">*</span>
            <input
              type="text"
              class="cli-input w-full"
              placeholder="What to search for..."
              value={this.searchQuery}
              onInput={(e: Event) => {
                this.searchQuery = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Max results
              <input
                type="number"
                class="cli-input w-full"
                min="1"
                max="100"
                value={this.searchLimit}
                onInput={(e: Event) => {
                  this.searchLimit = parseInt((e.target as HTMLInputElement).value) || 5;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Time filter
              <select
                class="cli-select w-full"
                onChange={(e: Event) => {
                  this.searchTbs = (e.target as HTMLSelectElement).value;
                }}
              >
                {SEARCH_TBS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} selected={this.searchTbs === o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Sources (comma-separated: web, images, news)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="web"
              value={this.searchSources}
              onInput={(e: Event) => {
                this.searchSources = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Location
            <input
              type="text"
              class="cli-input w-full"
              placeholder="San Francisco, California, United States"
              value={this.searchLocation}
              onInput={(e: Event) => {
                this.searchLocation = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="flex flex-wrap gap-3 mb-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.searchScrape}
                onChange={(e: Event) => {
                  this.searchScrape = (e.target as HTMLInputElement).checked;
                }}
              />
              Scrape results
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.searchJson}
                onChange={(e: Event) => {
                  this.searchJson = (e.target as HTMLInputElement).checked;
                }}
              />
              JSON output
            </label>
          </div>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            disabled={!this.searchQuery.trim()}
            onClick={() => {
              const c = this.buildCurrentCommand();
              this.runCommand(
                firecrawlService.search({
                  query: this.searchQuery,
                  limit: this.searchLimit !== 5 ? this.searchLimit : undefined,
                  sources: this.searchSources !== 'web' ? this.searchSources : undefined,
                  tbs: this.searchTbs || undefined,
                  location: this.searchLocation || undefined,
                  scrape: this.searchScrape,
                  json: this.searchJson,
                }),
                c,
              );
            }}
          >
            Search
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Command Preview</h3>
          <div class="cli-cmd-preview">{cmd}</div>
          <div class="mt-4 flex justify-between items-center mb-1">
            <span class="text-text2 text-sm">
              Status: <span class={this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : ''}>{this.statusMessage}</span>
            </span>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
          </div>
          <pre class="cli-output">{this.output}</pre>
        </div>
      </div>
    );
  }

  renderMapTab() {
    const cmd = this.buildCurrentCommand();
    const urlErr = this.mapUrlError;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Map Options</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            URL <span class="text-danger text-xs">*</span>
            <input
              type="url"
              class={`cli-input w-full ${urlErr ? 'cli-input-invalid' : this.mapUrl ? 'cli-input-valid' : ''}`}
              placeholder="https://example.com"
              value={this.mapUrl}
              onInput={(e: Event) => {
                this.mapUrl = (e.target as HTMLInputElement).value;
                this.mapUrlError = validateUrl(this.mapUrl);
              }}
            />
            {urlErr && <span class="cli-validation-message invalid">{urlErr}</span>}
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Filter URLs (--search)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="blog, docs, api..."
              value={this.mapSearch}
              onInput={(e: Event) => {
                this.mapSearch = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Max URLs
              <input
                type="number"
                class="cli-input w-full"
                min="1"
                placeholder="unlimited"
                value={this.mapLimit || ''}
                onInput={(e: Event) => {
                  const v = parseInt((e.target as HTMLInputElement).value) || 0;
                  const err = v ? validateLimit(v) : null;
                  if (!err) this.mapLimit = v;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Sitemap
              <select
                class="cli-select w-full"
                onChange={(e: Event) => {
                  this.mapSitemap = (e.target as HTMLSelectElement).value as 'only' | 'include' | 'skip';
                }}
              >
                {MAP_SITEMAP_MODES.map(m => (
                  <option key={m.value} value={m.value} selected={this.mapSitemap === m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div class="flex flex-wrap gap-3 mb-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.mapIncludeSubdomains}
                onChange={(e: Event) => {
                  this.mapIncludeSubdomains = (e.target as HTMLInputElement).checked;
                }}
              />
              Include subdomains
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.mapIgnoreQueryParams}
                onChange={(e: Event) => {
                  this.mapIgnoreQueryParams = (e.target as HTMLInputElement).checked;
                }}
              />
              Ignore query params
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.mapJson}
                onChange={(e: Event) => {
                  this.mapJson = (e.target as HTMLInputElement).checked;
                }}
              />
              JSON output
            </label>
          </div>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            disabled={!!urlErr || !this.mapUrl}
            onClick={() => {
              const c = this.buildCurrentCommand();
              this.runCommand(
                firecrawlService.map({
                  url: this.mapUrl,
                  limit: this.mapLimit || undefined,
                  search: this.mapSearch || undefined,
                  sitemap: this.mapSitemap,
                  includeSubdomains: this.mapIncludeSubdomains,
                  ignoreQueryParameters: this.mapIgnoreQueryParams,
                  json: this.mapJson,
                }),
                c,
              );
            }}
          >
            Discover URLs
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Command Preview</h3>
          <div class="cli-cmd-preview">{cmd}</div>
          <div class="mt-4 flex justify-between items-center mb-1">
            <span class="text-text2 text-sm">
              Status: <span class={this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : ''}>{this.statusMessage}</span>
            </span>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
          </div>
          <pre class="cli-output">{this.output}</pre>
        </div>
      </div>
    );
  }

  renderCrawlTab() {
    const cmd = this.buildCurrentCommand();
    const urlErr = this.crawlUrlError;
    const depthErr = this.crawlDepthError;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Crawl Options</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            URL <span class="text-danger text-xs">*</span>
            <input
              type="url"
              class={`cli-input w-full ${urlErr ? 'cli-input-invalid' : this.crawlUrl ? 'cli-input-valid' : ''}`}
              placeholder="https://example.com"
              value={this.crawlUrl}
              onInput={(e: Event) => {
                this.crawlUrl = (e.target as HTMLInputElement).value;
                this.crawlUrlError = validateUrl(this.crawlUrl);
              }}
            />
            {urlErr && <span class="cli-validation-message invalid">{urlErr}</span>}
          </label>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Max pages
              <input
                type="number"
                class="cli-input w-full"
                min="1"
                placeholder="unlimited"
                value={this.crawlLimit || ''}
                onInput={(e: Event) => {
                  this.crawlLimit = parseInt((e.target as HTMLInputElement).value) || 0;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Max depth
              <input
                type="number"
                class={`cli-input w-full ${depthErr ? 'cli-input-invalid' : ''}`}
                min="1"
                max="50"
                placeholder="unlimited"
                value={this.crawlMaxDepth || ''}
                onInput={(e: Event) => {
                  const v = parseInt((e.target as HTMLInputElement).value) || 0;
                  this.crawlMaxDepth = v;
                  this.crawlDepthError = v ? validateDepth(v) : null;
                }}
              />
              {depthErr && <span class="cli-validation-message invalid">{depthErr}</span>}
            </label>
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Exclude paths (comma-separated)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="/admin,/private"
              value={this.crawlExcludePaths}
              onInput={(e: Event) => {
                this.crawlExcludePaths = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Include paths (comma-separated)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="/blog,/docs"
              value={this.crawlIncludePaths}
              onInput={(e: Event) => {
                this.crawlIncludePaths = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <div class="grid grid-cols-2 gap-2 mb-4">
            {[
              {
                label: 'Allow external links',
                state: this.crawlAllowExternal,
                set: (v: boolean) => {
                  this.crawlAllowExternal = v;
                },
              },
              {
                label: 'Allow subdomains',
                state: this.crawlAllowSubdomains,
                set: (v: boolean) => {
                  this.crawlAllowSubdomains = v;
                },
              },
              {
                label: 'Crawl entire domain',
                state: this.crawlEntireDomain,
                set: (v: boolean) => {
                  this.crawlEntireDomain = v;
                },
              },
              {
                label: 'Wait for completion',
                state: this.crawlWait,
                set: (v: boolean) => {
                  this.crawlWait = v;
                },
              },
              {
                label: 'Show progress',
                state: this.crawlProgress,
                set: (v: boolean) => {
                  this.crawlProgress = v;
                },
              },
            ].map(({ label, state, set }) => (
              <label key={label} class="flex items-center gap-2 text-sm text-text2">
                <input
                  type="checkbox"
                  checked={state}
                  onChange={(e: Event) => {
                    set((e.target as HTMLInputElement).checked);
                  }}
                />
                {label}
              </label>
            ))}
          </div>

          <div class="grid grid-cols-2 gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Request delay (ms)
              <input
                type="number"
                class="cli-input w-full"
                min="0"
                placeholder="0"
                value={this.crawlDelay || ''}
                onInput={(e: Event) => {
                  this.crawlDelay = parseInt((e.target as HTMLInputElement).value) || 0;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Max concurrency
              <input
                type="number"
                class="cli-input w-full"
                min="1"
                placeholder="default"
                value={this.crawlMaxConcurrency || ''}
                onInput={(e: Event) => {
                  this.crawlMaxConcurrency = parseInt((e.target as HTMLInputElement).value) || 0;
                }}
              />
            </label>
          </div>

          <button
            type="button"
            class="cli-btn cli-btn-info"
            disabled={!!urlErr || !this.crawlUrl || !!depthErr}
            onClick={() => {
              const c = this.buildCurrentCommand();
              this.runCommand(
                firecrawlService.crawl({
                  url: this.crawlUrl,
                  limit: this.crawlLimit || undefined,
                  maxDepth: this.crawlMaxDepth || undefined,
                  excludePaths: this.crawlExcludePaths || undefined,
                  includePaths: this.crawlIncludePaths || undefined,
                  allowExternalLinks: this.crawlAllowExternal,
                  allowSubdomains: this.crawlAllowSubdomains,
                  crawlEntireDomain: this.crawlEntireDomain,
                  delay: this.crawlDelay || undefined,
                  maxConcurrency: this.crawlMaxConcurrency || undefined,
                  wait: this.crawlWait,
                  progress: this.crawlProgress,
                }),
                c,
              );
            }}
          >
            Start Crawl
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Command Preview</h3>
          <div class="cli-cmd-preview">{cmd}</div>
          <div class="mt-4 flex justify-between items-center mb-1">
            <span class="text-text2 text-sm">
              Status: <span class={this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : ''}>{this.statusMessage}</span>
            </span>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
          </div>
          <pre class="cli-output">{this.output}</pre>
        </div>
      </div>
    );
  }

  renderAgentTab() {
    const cmd = this.buildCurrentCommand();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Agent Options</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Prompt <span class="text-danger text-xs">*</span>
            <textarea
              class="cli-input w-full h-24 font-mono"
              placeholder="Extract all product names and prices from the page..."
              onInput={(e: Event) => {
                this.agentPrompt = (e.target as HTMLTextAreaElement).value;
              }}
            >
              {this.agentPrompt}
            </textarea>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Target URLs (comma-separated)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="https://example.com/products,..."
              value={this.agentUrls}
              onInput={(e: Event) => {
                this.agentUrls = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Model
            <select
              class="cli-select w-full"
              onChange={(e: Event) => {
                this.agentModel = (e.target as HTMLSelectElement).value as 'spark-1-mini' | 'spark-1-pro';
              }}
            >
              {AGENT_MODELS.map(m => (
                <option key={m.value} value={m.value} selected={this.agentModel === m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            JSON schema (optional, inline)
            <textarea
              class="cli-input w-full h-20 font-mono text-xs"
              placeholder={'{"type":"object","properties":{"name":{"type":"string"}}}'}
              onInput={(e: Event) => {
                this.agentSchema = (e.target as HTMLTextAreaElement).value;
              }}
            >
              {this.agentSchema}
            </textarea>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Max credits
            <input
              type="number"
              class="cli-input w-32"
              min="1"
              placeholder="unlimited"
              value={this.agentMaxCredits || ''}
              onInput={(e: Event) => {
                this.agentMaxCredits = parseInt((e.target as HTMLInputElement).value) || 0;
              }}
            />
          </label>

          <div class="flex flex-wrap gap-3 mb-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.agentWait}
                onChange={(e: Event) => {
                  this.agentWait = (e.target as HTMLInputElement).checked;
                }}
              />
              Wait for completion
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.agentJson}
                onChange={(e: Event) => {
                  this.agentJson = (e.target as HTMLInputElement).checked;
                }}
              />
              JSON output
            </label>
          </div>

          <button
            type="button"
            class="cli-btn cli-btn-info"
            disabled={!this.agentPrompt.trim()}
            onClick={() => {
              const c = this.buildCurrentCommand();
              this.runCommand(
                firecrawlService.agent({
                  prompt: this.agentPrompt,
                  urls: this.agentUrls || undefined,
                  model: this.agentModel,
                  schema: this.agentSchema || undefined,
                  maxCredits: this.agentMaxCredits || undefined,
                  wait: this.agentWait,
                  json: this.agentJson,
                }),
                c,
              );
            }}
          >
            Run Agent
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Command Preview</h3>
          <div class="cli-cmd-preview">{cmd}</div>
          <div class="mt-4 flex justify-between items-center mb-1">
            <span class="text-text2 text-sm">
              Status: <span class={this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : ''}>{this.statusMessage}</span>
            </span>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
          </div>
          <pre class="cli-output">{this.output}</pre>
        </div>
      </div>
    );
  }

  renderBrowserTab() {
    const cmd = this.buildCurrentCommand();
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Browser Presets</h3>
          <div class="flex flex-wrap gap-2 mb-4">
            {BROWSER_PRESETS.map(p => (
              <button
                key={p.code}
                type="button"
                class={`cli-btn cli-btn-sm ${this.browserCode === p.code ? 'cli-btn-info' : ''}`}
                onClick={() => {
                  this.browserCode = p.code;
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Command / code <span class="text-danger text-xs">*</span>
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="open https://example.com"
              value={this.browserCode}
              onInput={(e: Event) => {
                this.browserCode = (e.target as HTMLInputElement).value;
              }}
            />
            <span class="text-xs text-text2">e.g. snapshot, scrape, click @e5, open https://...</span>
          </label>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-3">
            Profile name (optional)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="my-session"
              value={this.browserProfile}
              onInput={(e: Event) => {
                this.browserProfile = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <label class="flex items-center gap-2 text-sm text-text2 mb-4">
            <input
              type="checkbox"
              checked={this.browserJson}
              onChange={(e: Event) => {
                this.browserJson = (e.target as HTMLInputElement).checked;
              }}
            />
            JSON output
          </label>

          <div class="p-3 bg-bg3 rounded-lg mb-4 text-xs text-text2">
            <span class="cli-badge-sip">Deprecated</span>
            <span class="ml-2">
              Prefer <code>firecrawl scrape</code> + <code>interact</code> for new workflows.
            </span>
          </div>

          <button
            type="button"
            class="cli-btn cli-btn-sm cli-btn-warning"
            disabled={!this.browserCode.trim()}
            onClick={() => {
              const c = this.buildCurrentCommand();
              this.runCommand(firecrawlService.browser({ code: this.browserCode, profile: this.browserProfile || undefined, json: this.browserJson }), c);
            }}
          >
            Execute Browser Command
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-text2 text-base mb-2">Command Preview</h3>
          <div class="cli-cmd-preview">{cmd}</div>
          <div class="mt-4 flex justify-between items-center mb-1">
            <span class="text-text2 text-sm">
              Status: <span class={this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : ''}>{this.statusMessage}</span>
            </span>
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
          </div>
          <pre class="cli-output">{this.output}</pre>
        </div>
      </div>
    );
  }

  renderTabs() {
    return TAB_DEFINITIONS.map(tab => (
      <button
        key={tab.id}
        type="button"
        class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`}
        onClick={() => {
          this.activeTab = tab.id;
        }}
      >
        {tab.label}
      </button>
    ));
  }

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🕷️</span> Firecrawl GUI
            <span class="cli-badge-safe">Web Scraping</span>
          </h2>
          <p class="text-text2 text-sm">Visual interface for Firecrawl — web scraping, crawling, and AI extraction</p>
        </header>

        <div class="border-b border-accent2 mb-4">{this.renderTabs()}</div>

        <div class="tab-content">
          {this.activeTab === 'scrape' && this.renderScrapeTab()}
          {this.activeTab === 'search' && this.renderSearchTab()}
          {this.activeTab === 'map' && this.renderMapTab()}
          {this.activeTab === 'crawl' && this.renderCrawlTab()}
          {this.activeTab === 'agent' && this.renderAgentTab()}
          {this.activeTab === 'browser' && this.renderBrowserTab()}
        </div>
      </div>
    );
  }
}
