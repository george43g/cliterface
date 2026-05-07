import { Component, h, State } from '@stencil/core';
import {
  buildNmapCommand,
  defaultNmapOptions,
  isValidCidr,
  isValidPortSpec,
  isValidTarget,
  type NmapOptions,
  NSE_CATEGORIES,
  type PortMode,
  SCAN_TECHNIQUES,
  type ScanTechnique,
  type TargetMode,
  TIMING_TEMPLATES,
} from '../../nmap/nmap-command-builders';
import { type CommandResult, nmapService } from '../../nmap/nmap-service';

const TABS = [
  { id: 'targets', label: 'Targets' },
  { id: 'scan', label: 'Scan Type' },
  { id: 'ports', label: 'Ports' },
  { id: 'timing', label: 'Timing' },
  { id: 'output', label: 'Output' },
  { id: 'nse', label: 'NSE Scripts' },
  { id: 'evasion', label: 'Evasion' },
  { id: 'legal', label: 'Legal / Ethics' },
] as const;

type TabId = (typeof TABS)[number]['id'];

@Component({
  tag: 'nmap-gui',
  styleUrl: 'nmap-gui.css',
  scoped: true,
})
export class NmapGui {
  @State() activeTab: TabId = 'targets';
  @State() opts: NmapOptions = defaultNmapOptions();
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() lastCommand = '';
  @State() output = 'Configure a target and click Execute to run nmap.';
  @State() statusMessage = 'Ready';
  @State() targetError = '';
  @State() portError = '';

  // ── Helpers ───────────────────────────────────────────────────────────────

  private get commandPreview(): string {
    return buildNmapCommand(this.opts);
  }

  private updateTarget(patch: Partial<NmapOptions['target']>): void {
    this.opts = { ...this.opts, target: { ...this.opts.target, ...patch } };
  }

  private updateScan(patch: Partial<NmapOptions['scan']>): void {
    this.opts = { ...this.opts, scan: { ...this.opts.scan, ...patch } };
  }

  private updatePorts(patch: Partial<NmapOptions['ports']>): void {
    this.opts = { ...this.opts, ports: { ...this.opts.ports, ...patch } };
  }

  private updateTiming(patch: Partial<NmapOptions['timing']>): void {
    this.opts = { ...this.opts, timing: { ...this.opts.timing, ...patch } };
  }

  private updateOutput(patch: Partial<NmapOptions['output']>): void {
    this.opts = { ...this.opts, output: { ...this.opts.output, ...patch } };
  }

  private updateNse(patch: Partial<NmapOptions['nse']>): void {
    this.opts = { ...this.opts, nse: { ...this.opts.nse, ...patch } };
  }

  private updateEvasion(patch: Partial<NmapOptions['evasion']>): void {
    this.opts = { ...this.opts, evasion: { ...this.opts.evasion, ...patch } };
  }

  private validateBeforeRun(): boolean {
    this.targetError = '';
    this.portError = '';

    const { mode, target, inputFile, randomCount } = this.opts.target;

    if (mode === 'file' && !inputFile.trim()) {
      this.targetError = 'Enter a path to the host-list file.';
      return false;
    }
    if (mode === 'random' && (!randomCount.trim() || Number.isNaN(parseInt(randomCount, 10)))) {
      this.targetError = 'Enter a valid number of random hosts.';
      return false;
    }
    if (mode !== 'file' && mode !== 'random') {
      if (!target.trim()) {
        this.targetError = 'Enter a target (IP, CIDR, hostname, or range).';
        return false;
      }
      if (!isValidTarget(target.trim())) {
        this.targetError = 'Target contains invalid characters.';
        return false;
      }
      if (mode === 'cidr' && !isValidCidr(target.trim())) {
        this.targetError = 'Enter a valid CIDR (e.g. 192.168.1.0/24).';
        return false;
      }
    }

    if (this.opts.ports.mode === 'specific' && this.opts.ports.portList) {
      if (!isValidPortSpec(this.opts.ports.portList.trim())) {
        this.portError = 'Invalid port spec (e.g. 22, 1-1024, 80,443).';
        return false;
      }
    }

    return true;
  }

  async execute(): Promise<void> {
    if (!this.validateBeforeRun()) return;

    const cmd = this.commandPreview;
    this.status = 'running';
    this.lastCommand = cmd;
    this.output = 'Scanning…';
    this.statusMessage = 'Running…';

    try {
      const result: CommandResult = await nmapService.execute(cmd.replace(/^nmap\s+/, ''));
      const sections = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);

      this.output = sections.join('\n\n') || JSON.stringify(result, null, 2);
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Completed' : `Failed (exit ${result.exitCode})`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  clearOutput(): void {
    this.output = 'Configure a target and click Execute to run nmap.';
    this.lastCommand = '';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  async copyOutput(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(this.output);
  }

  async copyCommand(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(this.commandPreview);
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  renderTabs() {
    return TABS.map(tab => (
      <button
        key={tab.id}
        type="button"
        class={`cli-tab ${this.activeTab === tab.id ? 'cli-tab-active' : ''}`}
        onClick={() => {
          this.activeTab = tab.id;
        }}
      >
        {tab.id === 'legal' ? '⚠️ ' : ''}
        {tab.label}
      </button>
    ));
  }

  renderLegalBanner() {
    return (
      <div class="legal-banner">
        <span class="legal-icon">⚠️</span>
        <span>
          <strong>Authorisation required.</strong> Scanning networks or hosts you do not own or have explicit written permission to test may be <strong>illegal</strong> in your
          jurisdiction and can violate computer-fraud laws (CFAA, Computer Misuse Act, etc.). Always obtain written authorisation before scanning any target you do not personally
          own and operate.
        </span>
      </div>
    );
  }

  renderCommandPreview() {
    const cmd = this.commandPreview;
    return (
      <div class="cli-card mt-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-text2 text-sm font-medium">Command Preview</span>
          <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyCommand()}>
            Copy
          </button>
        </div>
        <div class="cli-cmd-preview">
          <span class="cmd-seg-command">nmap</span>
          {cmd.length > 5 ? <span class="cmd-seg-rest">{cmd.slice(4)}</span> : <span class="text-text2"> (no target set)</span>}
        </div>
        <div class="flex flex-wrap gap-2 mt-3">
          <button type="button" class="cli-btn cli-btn-success" onClick={() => this.execute()} disabled={this.status === 'running'}>
            {this.status === 'running' ? 'Scanning…' : '▶ Execute'}
          </button>
          <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
            Clear
          </button>
        </div>
      </div>
    );
  }

  renderOutputPanel() {
    const statusColor = this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : 'text-text2';

    return (
      <div class="cli-card mt-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-text2 text-sm">
            Status: <span class={statusColor}>{this.statusMessage}</span>
          </span>
          <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
            Copy Output
          </button>
        </div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  // ── Tab: Targets ──────────────────────────────────────────────────────────

  renderTargetsTab() {
    const { mode, target, inputFile, randomCount, exclude, skipDiscovery, noDns, traceroute } = this.opts.target;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Target Specification</h3>

          <label class="field-label mb-3">
            Target Mode
            <select class="cli-select w-full" onChange={(e: Event) => this.updateTarget({ mode: (e.target as HTMLSelectElement).value as TargetMode })}>
              <option value="single" selected={mode === 'single'}>
                Single host / IP
              </option>
              <option value="cidr" selected={mode === 'cidr'}>
                CIDR range (192.168.1.0/24)
              </option>
              <option value="range" selected={mode === 'range'}>
                Octet range (10.0.0-5.1-254)
              </option>
              <option value="file" selected={mode === 'file'}>
                -iL Host list file
              </option>
              <option value="random" selected={mode === 'random'}>
                -iR Random hosts
              </option>
            </select>
          </label>

          {(mode === 'single' || mode === 'cidr' || mode === 'range') && (
            <label class="field-label mb-3">
              Target
              <input
                type="text"
                class={`cli-input w-full ${this.targetError ? 'cli-input-invalid' : ''}`}
                placeholder={mode === 'cidr' ? '192.168.1.0/24' : mode === 'range' ? '10.0.0-5.1-254' : 'scanme.nmap.org or 192.168.1.1'}
                value={target}
                onInput={(e: Event) => {
                  this.targetError = '';
                  this.updateTarget({ target: (e.target as HTMLInputElement).value });
                }}
              />
              {this.targetError && <span class="cli-validation-message invalid">{this.targetError}</span>}
            </label>
          )}

          {mode === 'file' && (
            <label class="field-label mb-3">
              Host-list file path (-iL)
              <input
                type="text"
                class={`cli-input w-full ${this.targetError ? 'cli-input-invalid' : ''}`}
                placeholder="/path/to/hosts.txt"
                value={inputFile}
                onInput={(e: Event) => {
                  this.targetError = '';
                  this.updateTarget({ inputFile: (e.target as HTMLInputElement).value });
                }}
              />
              {this.targetError && <span class="cli-validation-message invalid">{this.targetError}</span>}
            </label>
          )}

          {mode === 'random' && (
            <label class="field-label mb-3">
              Number of random hosts (-iR)
              <input
                type="number"
                class={`cli-input w-full ${this.targetError ? 'cli-input-invalid' : ''}`}
                min="1"
                placeholder="100"
                value={randomCount}
                onInput={(e: Event) => {
                  this.targetError = '';
                  this.updateTarget({ randomCount: (e.target as HTMLInputElement).value });
                }}
              />
              {this.targetError && <span class="cli-validation-message invalid">{this.targetError}</span>}
            </label>
          )}

          {(mode === 'single' || mode === 'cidr' || mode === 'range') && (
            <label class="field-label mb-3">
              Exclude hosts (--exclude)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="192.168.1.5,192.168.1.10"
                value={exclude}
                onInput={(e: Event) => this.updateTarget({ exclude: (e.target as HTMLInputElement).value })}
              />
            </label>
          )}

          <div class="flex flex-col gap-2 mt-2">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={skipDiscovery} onChange={(e: Event) => this.updateTarget({ skipDiscovery: (e.target as HTMLInputElement).checked })} />
              -Pn — Treat all hosts as online (skip discovery)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={noDns} onChange={(e: Event) => this.updateTarget({ noDns: (e.target as HTMLInputElement).checked })} />
              -n — Never do DNS resolution
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={traceroute} onChange={(e: Event) => this.updateTarget({ traceroute: (e.target as HTMLInputElement).checked })} />
              --traceroute — Trace hop path to each host
            </label>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          {this.renderCommandPreview()}
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  // ── Tab: Scan Type ────────────────────────────────────────────────────────

  renderScanTab() {
    const { technique, versionIntensity, osDetection, osGuess } = this.opts.scan;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Scan Technique</h3>

          <div class="flex flex-col gap-2 mb-4">
            {SCAN_TECHNIQUES.map(st => (
              <label key={st.id} class="technique-option">
                <input type="radio" name="technique" value={st.id} checked={technique === st.id} onChange={() => this.updateScan({ technique: st.id as ScanTechnique })} />
                <div class="flex-1">
                  <span class="font-mono text-sm">{st.label}</span>
                  {st.rootRequired && <span class="cli-badge-sip ml-1">root</span>}
                  <p class="text-xs text-text2 mt-0.5">{st.description}</p>
                </div>
              </label>
            ))}
          </div>

          {technique === '-sV' && (
            <label class="field-label mb-3">
              Version intensity (--version-intensity 0–9)
              <input
                type="number"
                class="cli-input w-24"
                min="0"
                max="9"
                placeholder="5"
                value={versionIntensity}
                onInput={(e: Event) => this.updateScan({ versionIntensity: (e.target as HTMLInputElement).value })}
              />
            </label>
          )}

          {technique !== '-A' && technique !== '-O' && (
            <div class="flex flex-col gap-2 mt-3">
              <label class="flex items-center gap-2 text-sm text-text2">
                <input type="checkbox" checked={osDetection} onChange={(e: Event) => this.updateScan({ osDetection: (e.target as HTMLInputElement).checked })} />
                -O OS detection <span class="cli-badge-sip ml-1">root</span>
              </label>
              {osDetection && (
                <label class="flex items-center gap-2 text-sm text-text2 ml-4">
                  <input type="checkbox" checked={osGuess} onChange={(e: Event) => this.updateScan({ osGuess: (e.target as HTMLInputElement).checked })} />
                  --osscan-guess (guess aggressively)
                </label>
              )}
            </div>
          )}
        </div>

        <div class="flex flex-col gap-4">
          {this.renderCommandPreview()}
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  // ── Tab: Ports ─────────────────────────────────────────────────────────────

  renderPortsTab() {
    const { mode, portList, topPorts, sequential, excludePorts } = this.opts.ports;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Port Specification</h3>

          <label class="field-label mb-4">
            Port mode
            <select class="cli-select w-full" onChange={(e: Event) => this.updatePorts({ mode: (e.target as HTMLSelectElement).value as PortMode })}>
              <option value="default" selected={mode === 'default'}>
                Default (top 1000 ports)
              </option>
              <option value="specific" selected={mode === 'specific'}>
                -p Specific ports
              </option>
              <option value="top" selected={mode === 'top'}>
                --top-ports N most common
              </option>
              <option value="fast" selected={mode === 'fast'}>
                -F Fast (top 100)
              </option>
              <option value="all" selected={mode === 'all'}>
                -p- All 65535 ports
              </option>
            </select>
          </label>

          {mode === 'specific' && (
            <label class="field-label mb-4">
              Port list (-p)
              <input
                type="text"
                class={`cli-input w-full ${this.portError ? 'cli-input-invalid' : ''}`}
                placeholder="22,80,443 or 1-1024 or U:53,T:80"
                value={portList}
                onInput={(e: Event) => {
                  this.portError = '';
                  this.updatePorts({ portList: (e.target as HTMLInputElement).value });
                }}
              />
              {this.portError && <span class="cli-validation-message invalid">{this.portError}</span>}
              <span class="text-xs text-text2">Formats: 22 | 1-1024 | 80,443 | U:53,T:80</span>
            </label>
          )}

          {mode === 'top' && (
            <label class="field-label mb-4">
              Number of top ports (--top-ports)
              <input
                type="number"
                class="cli-input w-32"
                min="1"
                max="65535"
                placeholder="100"
                value={topPorts}
                onInput={(e: Event) => this.updatePorts({ topPorts: (e.target as HTMLInputElement).value })}
              />
            </label>
          )}

          <label class="field-label mb-4">
            Exclude ports (--exclude-ports)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="21,23"
              value={excludePorts}
              onInput={(e: Event) => this.updatePorts({ excludePorts: (e.target as HTMLInputElement).value })}
            />
          </label>

          <label class="flex items-center gap-2 text-sm text-text2">
            <input type="checkbox" checked={sequential} onChange={(e: Event) => this.updatePorts({ sequential: (e.target as HTMLInputElement).checked })} />
            -r Scan ports sequentially (no randomisation)
          </label>
        </div>

        <div class="flex flex-col gap-4">
          {this.renderCommandPreview()}
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  // ── Tab: Timing ───────────────────────────────────────────────────────────

  renderTimingTab() {
    const { template, minRate, maxRetries, hostTimeout, scanDelay } = this.opts.timing;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Timing &amp; Performance</h3>

          <div class="field-label mb-4">
            Timing template (-T)
            <div class="flex flex-wrap gap-2 mt-1">
              {TIMING_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  class={`cli-btn cli-btn-sm ${template === t.id ? 'cli-btn-info' : ''}`}
                  title={t.description}
                  onClick={() => this.updateTiming({ template: t.id })}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p class="text-xs text-text2 mt-1">{TIMING_TEMPLATES.find(t => t.id === template)?.description ?? ''}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <label class="field-label">
              Min rate (pkts/sec)
              <input
                type="number"
                class="cli-input w-full"
                min="1"
                placeholder="100"
                value={minRate}
                onInput={(e: Event) => this.updateTiming({ minRate: (e.target as HTMLInputElement).value })}
              />
            </label>
            <label class="field-label">
              Max retries
              <input
                type="number"
                class="cli-input w-full"
                min="0"
                placeholder="3"
                value={maxRetries}
                onInput={(e: Event) => this.updateTiming({ maxRetries: (e.target as HTMLInputElement).value })}
              />
            </label>
            <label class="field-label">
              Host timeout (e.g. 5m, 30s)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="5m"
                value={hostTimeout}
                onInput={(e: Event) => this.updateTiming({ hostTimeout: (e.target as HTMLInputElement).value })}
              />
            </label>
            <label class="field-label">
              Scan delay (e.g. 100ms)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="100ms"
                value={scanDelay}
                onInput={(e: Event) => this.updateTiming({ scanDelay: (e.target as HTMLInputElement).value })}
              />
            </label>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          {this.renderCommandPreview()}
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  // ── Tab: Output ────────────────────────────────────────────────────────────

  renderOutputTab() {
    const { verbose, debug, reason, openOnly, packetTrace, outputFormat, outputFile } = this.opts.output;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Output Options</h3>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <label class="field-label">
              Verbosity (-v / -vv)
              <select class="cli-select w-full" onChange={(e: Event) => this.updateOutput({ verbose: parseInt((e.target as HTMLSelectElement).value, 10) })}>
                <option value="0" selected={verbose === 0}>
                  None
                </option>
                <option value="1" selected={verbose === 1}>
                  -v
                </option>
                <option value="2" selected={verbose === 2}>
                  -vv
                </option>
                <option value="3" selected={verbose === 3}>
                  -vvv
                </option>
              </select>
            </label>
            <label class="field-label">
              Debug level (-d / -dd)
              <select class="cli-select w-full" onChange={(e: Event) => this.updateOutput({ debug: parseInt((e.target as HTMLSelectElement).value, 10) })}>
                <option value="0" selected={debug === 0}>
                  None
                </option>
                <option value="1" selected={debug === 1}>
                  -d
                </option>
                <option value="2" selected={debug === 2}>
                  -dd
                </option>
              </select>
            </label>
          </div>

          <div class="flex flex-col gap-2 mb-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={reason} onChange={(e: Event) => this.updateOutput({ reason: (e.target as HTMLInputElement).checked })} />
              --reason — Show why each port is in its state
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={openOnly} onChange={(e: Event) => this.updateOutput({ openOnly: (e.target as HTMLInputElement).checked })} />
              --open — Only show open (or possibly open) ports
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={packetTrace} onChange={(e: Event) => this.updateOutput({ packetTrace: (e.target as HTMLInputElement).checked })} />
              --packet-trace — Show all packets sent/received
            </label>
          </div>

          <label class="field-label mb-3">
            Save output format
            <select class="cli-select w-full" onChange={(e: Event) => this.updateOutput({ outputFormat: (e.target as HTMLSelectElement).value as '' | 'N' | 'X' | 'G' | 'A' })}>
              <option value="" selected={outputFormat === ''}>
                None
              </option>
              <option value="N" selected={outputFormat === 'N'}>
                -oN Normal text
              </option>
              <option value="X" selected={outputFormat === 'X'}>
                -oX XML
              </option>
              <option value="G" selected={outputFormat === 'G'}>
                -oG Grepable
              </option>
              <option value="A" selected={outputFormat === 'A'}>
                -oA All three formats
              </option>
            </select>
          </label>

          {outputFormat && (
            <label class="field-label">
              Output filename / basename
              <input
                type="text"
                class="cli-input w-full"
                placeholder="scan_results"
                value={outputFile}
                onInput={(e: Event) => this.updateOutput({ outputFile: (e.target as HTMLInputElement).value })}
              />
            </label>
          )}
        </div>

        <div class="flex flex-col gap-4">
          {this.renderCommandPreview()}
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  // ── Tab: NSE Scripts ──────────────────────────────────────────────────────

  renderNseTab() {
    const { script, scriptArgs, scriptTrace } = this.opts.nse;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">NSE Script Engine</h3>
          <p class="text-text2 text-sm mb-4">
            nmap's scripting engine (NSE) extends scanning with Lua scripts for service detection, vulnerability checks, authentication, and more.
          </p>

          <label class="field-label mb-3">
            Script / Category (--script)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="default, vuln, smb-vuln-ms17-010"
              value={script}
              onInput={(e: Event) => this.updateNse({ script: (e.target as HTMLInputElement).value })}
            />
            <span class="text-xs text-text2">Enter a category, script name, or comma-separated list</span>
          </label>

          <div class="mb-4">
            <p class="text-sm text-text2 mb-2">Quick-select category:</p>
            <div class="flex flex-wrap gap-2">
              {NSE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  class={`cli-btn cli-btn-sm ${script === cat.id ? 'cli-btn-info' : ''} ${cat.id === 'intrusive' || cat.id === 'dos' || cat.id === 'exploit' ? 'nse-danger' : ''}`}
                  title={cat.description}
                  onClick={() => this.updateNse({ script: script === cat.id ? '' : (cat.id as string) })}
                >
                  {cat.label}
                  {(cat.id === 'intrusive' || cat.id === 'dos' || cat.id === 'exploit') && ' ⚠'}
                </button>
              ))}
            </div>
          </div>

          <label class="field-label mb-3">
            Script args (--script-args)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="user=admin,pass=1234"
              value={scriptArgs}
              onInput={(e: Event) => this.updateNse({ scriptArgs: (e.target as HTMLInputElement).value })}
            />
          </label>

          <label class="flex items-center gap-2 text-sm text-text2">
            <input type="checkbox" checked={scriptTrace} onChange={(e: Event) => this.updateNse({ scriptTrace: (e.target as HTMLInputElement).checked })} />
            --script-trace — Show all data sent and received by scripts
          </label>
        </div>

        <div class="flex flex-col gap-4">
          {this.renderCommandPreview()}
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  // ── Tab: Evasion ──────────────────────────────────────────────────────────

  renderEvasionTab() {
    const { fragment, mtu, decoys, spoofSource, iface, sourcePort, ttl, spoofMac, dataLength } = this.opts.evasion;
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-text2 text-base mb-3">Firewall / IDS Evasion &amp; Spoofing</h3>

          <div class="evasion-warning mb-4">
            <strong>⚠ Use only on networks you own or are authorised to test.</strong> Evasion and spoofing features can trigger legal and ethical issues.
          </div>

          <div class="flex flex-col gap-2 mb-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input type="checkbox" checked={fragment} onChange={(e: Event) => this.updateEvasion({ fragment: (e.target as HTMLInputElement).checked })} />
              -f Fragment packets (8-byte chunks)
            </label>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <label class="field-label">
              MTU (--mtu)
              <input
                type="number"
                class="cli-input w-full"
                min="8"
                step="8"
                placeholder="24"
                value={mtu}
                onInput={(e: Event) => this.updateEvasion({ mtu: (e.target as HTMLInputElement).value })}
              />
              <span class="text-xs text-text2">Must be multiple of 8</span>
            </label>
            <label class="field-label">
              TTL (--ttl)
              <input
                type="number"
                class="cli-input w-full"
                min="1"
                max="255"
                placeholder="64"
                value={ttl}
                onInput={(e: Event) => this.updateEvasion({ ttl: (e.target as HTMLInputElement).value })}
              />
            </label>
          </div>

          <label class="field-label mb-3">
            Decoys (-D)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="RND:5 or 192.168.1.5,ME,192.168.1.9"
              value={decoys}
              onInput={(e: Event) => this.updateEvasion({ decoys: (e.target as HTMLInputElement).value })}
            />
            <span class="text-xs text-text2">Cloak scan with decoy IPs. Use ME for your real position.</span>
          </label>

          <label class="field-label mb-3">
            Spoof source IP (-S)
            <input
              type="text"
              class="cli-input w-full"
              placeholder="10.0.0.1"
              value={spoofSource}
              onInput={(e: Event) => this.updateEvasion({ spoofSource: (e.target as HTMLInputElement).value })}
            />
          </label>

          <div class="grid grid-cols-2 gap-4 mb-3">
            <label class="field-label">
              Interface (-e)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="eth0"
                value={iface}
                onInput={(e: Event) => this.updateEvasion({ iface: (e.target as HTMLInputElement).value })}
              />
            </label>
            <label class="field-label">
              Source port (-g)
              <input
                type="number"
                class="cli-input w-full"
                min="1"
                max="65535"
                placeholder="53"
                value={sourcePort}
                onInput={(e: Event) => this.updateEvasion({ sourcePort: (e.target as HTMLInputElement).value })}
              />
            </label>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <label class="field-label">
              Spoof MAC (--spoof-mac)
              <input
                type="text"
                class="cli-input w-full"
                placeholder="Apple or 0 (random)"
                value={spoofMac}
                onInput={(e: Event) => this.updateEvasion({ spoofMac: (e.target as HTMLInputElement).value })}
              />
            </label>
            <label class="field-label">
              Append random data (--data-length)
              <input
                type="number"
                class="cli-input w-full"
                min="0"
                placeholder="25"
                value={dataLength}
                onInput={(e: Event) => this.updateEvasion({ dataLength: (e.target as HTMLInputElement).value })}
              />
            </label>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          {this.renderCommandPreview()}
          {this.renderOutputPanel()}
        </div>
      </div>
    );
  }

  // ── Tab: Legal / Ethics ───────────────────────────────────────────────────

  renderLegalTab() {
    return (
      <div class="grid grid-cols-1 gap-5">
        <div class="cli-card">
          <h3 class="text-xl font-semibold mb-4 text-danger">Legal &amp; Ethical Obligations</h3>

          <div class="legal-section">
            <h4 class="legal-heading">Authorisation is mandatory</h4>
            <p>
              Port scanning, host discovery, and service enumeration — even passive techniques — may be illegal without explicit written permission from the network/system owner.
              This applies even if the target is reachable from the public internet.
            </p>
          </div>

          <div class="legal-section">
            <h4 class="legal-heading">Laws that may apply</h4>
            <ul class="legal-list">
              <li>
                <strong>USA</strong> — Computer Fraud and Abuse Act (CFAA), 18 U.S.C. § 1030
              </li>
              <li>
                <strong>UK</strong> — Computer Misuse Act 1990
              </li>
              <li>
                <strong>EU</strong> — Directive on Attacks Against Information Systems (2013/40/EU)
              </li>
              <li>
                <strong>Canada</strong> — Criminal Code s. 342.1
              </li>
              <li>
                <strong>Australia</strong> — Criminal Code Act 1995, Part 10.7
              </li>
              <li>
                <strong>Other</strong> — Most countries have comparable legislation
              </li>
            </ul>
          </div>

          <div class="legal-section">
            <h4 class="legal-heading">Safe targets for practice</h4>
            <ul class="legal-list">
              <li>
                <a class="legal-link" href="https://scanme.nmap.org" target="_blank" rel="noopener">
                  scanme.nmap.org
                </a>{' '}
                — Nmap's official authorised scan target (limited use)
              </li>
              <li>Your own local network (192.168.x.x / 10.x.x.x) — only devices you own</li>
              <li>Dedicated home lab VMs/containers</li>
              <li>CTF / Hack The Box / TryHackMe environments with explicit permission</li>
            </ul>
          </div>

          <div class="legal-section">
            <h4 class="legal-heading">Best practices</h4>
            <ul class="legal-list">
              <li>
                Always obtain <strong>written</strong> authorisation before scanning
              </li>
              <li>Scope your engagement carefully — only scan systems listed in the authorisation</li>
              <li>Document all scans with timestamps</li>
              <li>Use -T2 or lower timing on production systems to minimise impact</li>
              <li>Avoid destructive NSE categories (dos, exploit) unless explicitly permitted</li>
              <li>Consult a lawyer if uncertain about your jurisdiction</li>
            </ul>
          </div>

          <div class="legal-section legal-disclaimer">
            <strong>Disclaimer:</strong> This tool is provided for educational and authorised security testing purposes only. The authors and contributors accept no liability for
            misuse.
          </div>
        </div>
      </div>
    );
  }

  // ── Root render ───────────────────────────────────────────────────────────

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>🛰️</span> nmap
            <span class="text-sm font-normal text-text2">Network mapper / port scanner</span>
          </h2>
          <p class="text-text2 text-sm">Visual interface for nmap — enumerate hosts, ports, services, OS, and vulnerabilities.</p>
        </header>

        {this.renderLegalBanner()}

        <div class="border-b border-accent2 mb-4 flex flex-wrap gap-1">{this.renderTabs()}</div>

        <div class="tab-content">
          {this.activeTab === 'targets' && this.renderTargetsTab()}
          {this.activeTab === 'scan' && this.renderScanTab()}
          {this.activeTab === 'ports' && this.renderPortsTab()}
          {this.activeTab === 'timing' && this.renderTimingTab()}
          {this.activeTab === 'output' && this.renderOutputTab()}
          {this.activeTab === 'nse' && this.renderNseTab()}
          {this.activeTab === 'evasion' && this.renderEvasionTab()}
          {this.activeTab === 'legal' && this.renderLegalTab()}
        </div>
      </div>
    );
  }
}
