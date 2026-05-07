import { Component, h, State } from '@stencil/core';
import {
  buildBlockCmd,
  buildDaemonCmd,
  buildJoinGroupCmd,
  buildLinkCmd,
  buildListAccountsCmd,
  buildListContactsCmd,
  buildListDevicesCmd,
  buildListGroupsCmd,
  buildQuitGroupCmd,
  buildReceiveCmd,
  buildRegisterCmd,
  buildRemoveDeviceCmd,
  buildSendCmd,
  buildSendReactionCmd,
  buildTrustCmd,
  buildUnblockCmd,
  buildUpdateContactCmd,
  buildUpdateGroupCmd,
  buildUpdateProfileCmd,
  buildVerifyCmd,
  type CommandResult,
  isValidE164,
  runSignalCli,
  validateE164,
} from '../../signal-cli/signal-cli-service';

type Tab = 'register-link' | 'send' | 'receive' | 'contacts' | 'groups' | 'devices' | 'daemon';

const TABS: { id: Tab; label: string }[] = [
  { id: 'register-link', label: 'Register / Link' },
  { id: 'send', label: 'Send' },
  { id: 'receive', label: 'Receive / Listen' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'groups', label: 'Groups' },
  { id: 'devices', label: 'Devices' },
  { id: 'daemon', label: 'Daemon' },
];

@Component({
  tag: 'signal-cli-gui',
  styleUrl: 'signal-cli-gui.css',
  scoped: true,
})
export class SignalCliGui {
  // ── Shared ──────────────────────────────────────────────────────────────
  @State() activeTab: Tab = 'register-link';
  @State() lastCommand = 'Ready...';
  @State() output = 'Select a tab and fill in the fields to get started.';
  @State() status: 'idle' | 'running' | 'success' | 'error' = 'idle';
  @State() statusMessage = 'Ready';

  // ── Account ─────────────────────────────────────────────────────────────
  @State() accountPhone = '';
  @State() accountPhoneError: string | null = null;

  // ── Register / Link ──────────────────────────────────────────────────────
  @State() regVoice = false;
  @State() regCaptcha = '';
  @State() regReregister = false;
  @State() verifyCode = '';
  @State() verifyPin = '';
  @State() linkDeviceName = 'signal-cli';

  // ── Send ─────────────────────────────────────────────────────────────────
  @State() sendRecipients = '';
  @State() sendGroupId = '';
  @State() sendMessage = '';
  @State() sendAttachment = '';
  @State() sendNoteToSelf = false;
  @State() sendReactionRecipient = '';
  @State() sendReactionEmoji = '👍';
  @State() sendReactionAuthor = '';
  @State() sendReactionTimestamp = '';
  @State() sendReactionRemove = false;

  // ── Receive ───────────────────────────────────────────────────────────────
  @State() receiveTimeout = 5;
  @State() receiveMaxMessages = 0;
  @State() receiveIgnoreAttachments = false;

  // ── Contacts ──────────────────────────────────────────────────────────────
  @State() contactsShowAll = false;
  @State() contactsFilter = '';
  @State() contactTarget = '';
  @State() contactName = '';
  @State() contactExpiration = 0;
  @State() contactNote = '';
  @State() blockTarget = '';
  @State() blockGroupId = '';
  @State() trustTarget = '';
  @State() trustSafetyNumber = '';
  @State() trustAll = false;

  // ── Groups ────────────────────────────────────────────────────────────────
  @State() groupsDetailed = false;
  @State() joinGroupUri = '';
  @State() quitGroupId = '';
  @State() quitGroupDelete = false;
  @State() updateGroupId = '';
  @State() updateGroupName = '';
  @State() updateGroupDesc = '';
  @State() updateGroupAddMembers = '';
  @State() updateGroupRemoveMembers = '';
  @State() updateGroupExpiration = 0;
  @State() updateGroupLink: 'enabled' | 'enabled-with-approval' | 'disabled' = 'enabled';

  // ── Devices ───────────────────────────────────────────────────────────────
  @State() removeDeviceId = '';

  // ── Profile / Account ─────────────────────────────────────────────────────
  @State() profileGivenName = '';
  @State() profileFamilyName = '';
  @State() profileAbout = '';
  @State() profileAboutEmoji = '';
  @State() profileAvatar = '';
  @State() profileRemoveAvatar = false;

  // ── Daemon ────────────────────────────────────────────────────────────────
  @State() daemonSocket = false;
  @State() daemonTcp = false;
  @State() daemonHttp = false;
  @State() daemonDbus = false;
  @State() daemonDbusSystem = false;
  @State() daemonReceiveMode: 'on-start' | 'on-connection' | 'manual' = 'on-start';
  @State() daemonNoStdout = false;

  // ── Helpers ───────────────────────────────────────────────────────────────

  private setTemporaryStatus(message: string, resetTo = 'Ready', ms = 2000): void {
    this.statusMessage = message;
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.statusMessage = resetTo;
      }, ms);
    }
  }

  private async run(cmd: string, confirm?: string): Promise<void> {
    if (confirm && typeof window !== 'undefined' && !window.confirm(confirm)) return;

    this.lastCommand = cmd;
    this.status = 'running';
    this.output = 'Running...';
    this.statusMessage = 'Running...';

    try {
      const result: CommandResult = await runSignalCli(cmd);
      const parts = [result.stdout?.trim(), result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ''].filter(Boolean);
      this.output = parts.join('\n\n') || '(no output)';
      this.status = result.exitCode === 0 ? 'success' : 'error';
      this.statusMessage = result.exitCode === 0 ? 'Done' : `Exit ${result.exitCode}`;
    } catch (err) {
      this.output = `Error: ${err instanceof Error ? err.message : String(err)}`;
      this.status = 'error';
      this.statusMessage = 'Error';
    }
  }

  private validateAccount(): boolean {
    const err = validateE164(this.accountPhone);
    this.accountPhoneError = err;
    return err === null;
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
    this.output = 'Cleared.';
    this.lastCommand = 'Ready...';
    this.status = 'idle';
    this.statusMessage = 'Ready';
  }

  // ── Renderers ─────────────────────────────────────────────────────────────

  renderAccountBar() {
    return (
      <div class="cli-card mb-4 flex flex-wrap items-end gap-3">
        <div class="flex flex-col gap-1 flex-1 min-w-48">
          <label class="flex flex-col gap-1 text-xs text-text2">
            Account phone number (E.164)
            <input
              type="tel"
              class={`cli-input w-full ${this.accountPhoneError ? 'cli-input-invalid' : this.accountPhone && isValidE164(this.accountPhone) ? 'cli-input-valid' : ''}`}
              placeholder="+12125551234"
              value={this.accountPhone}
              onInput={(e: Event) => {
                this.accountPhone = (e.target as HTMLInputElement).value;
                this.accountPhoneError = validateE164(this.accountPhone);
              }}
            />
          </label>
          {this.accountPhoneError && <span class="cli-validation-message invalid">{this.accountPhoneError}</span>}
        </div>
        <span class="text-xs text-text2 pb-2">
          Used as <code class="font-mono">-a</code> global flag for all commands
        </span>
      </div>
    );
  }

  renderCommandPreview() {
    return (
      <div class="cli-card mt-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-text2">Command Preview</span>
          <span class={`text-xs ${this.status === 'error' ? 'text-danger' : this.status === 'success' ? 'text-success' : 'text-text2'}`}>{this.statusMessage}</span>
        </div>
        <div class="cli-cmd-preview">{this.lastCommand}</div>
        <div class="flex justify-between items-center mt-3 mb-1">
          <span class="text-sm text-text2">Output</span>
          <div class="flex gap-2">
            <button type="button" class="cli-btn cli-btn-sm" onClick={() => this.copyOutput()}>
              Copy
            </button>
            <button type="button" class="cli-btn cli-btn-sm cli-btn-warning" onClick={() => this.clearOutput()}>
              Clear
            </button>
          </div>
        </div>
        <pre class="cli-output">{this.output}</pre>
      </div>
    );
  }

  renderRegisterLinkTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Register */}
        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">Register new account</h3>
          <p class="text-xs text-text2 mb-4">Register a phone number with Signal. You will receive a verification SMS (or voice call).</p>

          <div class="flex flex-col gap-3 mb-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.regVoice}
                onChange={(e: Event) => {
                  this.regVoice = (e.target as HTMLInputElement).checked;
                }}
              />
              Use voice call instead of SMS
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.regReregister}
                onChange={(e: Event) => {
                  this.regReregister = (e.target as HTMLInputElement).checked;
                }}
              />
              Re-register (force even if already registered)
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Captcha token (if required)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="signalcaptcha://..."
                value={this.regCaptcha}
                onInput={(e: Event) => {
                  this.regCaptcha = (e.target as HTMLInputElement).value;
                }}
              />
              <span class="text-xs">Only needed if registration returns a captcha error. Get it from signal.org/android/apk.</span>
            </label>
          </div>

          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              if (!this.validateAccount()) return;
              const cmd = buildRegisterCmd(this.accountPhone, { voice: this.regVoice, captcha: this.regCaptcha || undefined, reregister: this.regReregister });
              this.run(cmd);
            }}
          >
            Register
          </button>
        </div>

        {/* Verify */}
        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">Verify SMS code</h3>
          <p class="text-xs text-text2 mb-4">Enter the 6-digit code you received after registering.</p>

          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Verification code
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="123456"
                value={this.verifyCode}
                onInput={(e: Event) => {
                  this.verifyCode = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Registration lock PIN (optional)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="optional PIN"
                value={this.verifyPin}
                onInput={(e: Event) => {
                  this.verifyPin = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          </div>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              if (!this.validateAccount()) return;
              if (!this.verifyCode.trim()) {
                this.output = 'Enter verification code first.';
                return;
              }
              this.run(buildVerifyCmd(this.accountPhone, this.verifyCode, this.verifyPin || undefined));
            }}
          >
            Verify
          </button>
        </div>

        {/* Link */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-base text-text2 mb-3">Link as secondary device</h3>
          <p class="text-xs text-text2 mb-4">
            Link this instance to an existing primary device (e.g. your phone). The command outputs a URL — display it as a QR code for the primary device to scan.
          </p>

          <div class="flex gap-3 items-end mb-4 flex-wrap">
            <label class="flex flex-col gap-1 text-sm text-text2 flex-1 min-w-40">
              Device name
              <input
                type="text"
                class="cli-input w-full"
                placeholder="signal-cli"
                value={this.linkDeviceName}
                onInput={(e: Event) => {
                  this.linkDeviceName = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                this.run(buildLinkCmd(this.linkDeviceName || 'signal-cli'));
              }}
            >
              Link Device
            </button>
          </div>
          <p class="text-xs text-info">
            The output will contain a <code>sgnl://linkdevice?...url=...</code> — encode it as a QR and scan with the Signal app on your primary device.
          </p>
        </div>

        {/* List accounts */}
        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">List accounts</h3>
          <p class="text-xs text-text2 mb-4">Show all locally registered accounts.</p>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              this.run(buildListAccountsCmd());
            }}
          >
            List Accounts
          </button>
        </div>

        {this.renderCommandPreview()}
      </div>
    );
  }

  renderSendTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Send message */}
        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">Send message</h3>
          <p class="text-xs text-warning mb-4">Privacy: message body is never logged in command previews — only a placeholder appears.</p>

          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Recipient phone numbers (space-separated, E.164)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="+12125551234 +447700900000"
                value={this.sendRecipients}
                onInput={(e: Event) => {
                  this.sendRecipients = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Group ID (leave blank for direct message)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="group-id-base64..."
                value={this.sendGroupId}
                onInput={(e: Event) => {
                  this.sendGroupId = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Message
              <textarea
                class="cli-input w-full font-mono h-24 resize-y"
                placeholder="Type your message... (not shown in command preview)"
                onInput={(e: Event) => {
                  this.sendMessage = (e.target as HTMLTextAreaElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Attachment path (optional)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="/path/to/file.jpg"
                value={this.sendAttachment}
                onInput={(e: Event) => {
                  this.sendAttachment = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.sendNoteToSelf}
                onChange={(e: Event) => {
                  this.sendNoteToSelf = (e.target as HTMLInputElement).checked;
                }}
              />
              Note to self (send to own devices)
            </label>
          </div>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              if (!this.validateAccount()) return;
              if (!this.sendMessage.trim()) {
                this.output = 'Enter a message.';
                return;
              }
              const recipients = this.sendRecipients.trim() ? this.sendRecipients.trim().split(/\s+/) : [];
              const cmd = buildSendCmd(this.accountPhone, this.sendMessage, recipients, {
                groupId: this.sendGroupId || undefined,
                attachments: this.sendAttachment ? [this.sendAttachment] : undefined,
                noteToSelf: this.sendNoteToSelf,
              });
              this.run(cmd);
            }}
          >
            Send
          </button>
        </div>

        {/* Send reaction */}
        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">Send reaction</h3>

          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Recipient phone
              <input
                type="tel"
                class="cli-input w-full font-mono"
                placeholder="+12125551234"
                value={this.sendReactionRecipient}
                onInput={(e: Event) => {
                  this.sendReactionRecipient = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Emoji
              <input
                type="text"
                class="cli-input w-24 font-mono text-xl"
                value={this.sendReactionEmoji}
                onInput={(e: Event) => {
                  this.sendReactionEmoji = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Target author phone
              <input
                type="tel"
                class="cli-input w-full font-mono"
                placeholder="+12125551234"
                value={this.sendReactionAuthor}
                onInput={(e: Event) => {
                  this.sendReactionAuthor = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Target message timestamp
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="1689000000000"
                value={this.sendReactionTimestamp}
                onInput={(e: Event) => {
                  this.sendReactionTimestamp = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.sendReactionRemove}
                onChange={(e: Event) => {
                  this.sendReactionRemove = (e.target as HTMLInputElement).checked;
                }}
              />
              Remove reaction
            </label>
          </div>

          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              if (!this.validateAccount()) return;
              if (!this.sendReactionRecipient || !this.sendReactionEmoji || !this.sendReactionAuthor || !this.sendReactionTimestamp) {
                this.output = 'Fill in all reaction fields.';
                return;
              }
              const cmd = buildSendReactionCmd(
                this.accountPhone,
                this.sendReactionRecipient,
                this.sendReactionEmoji,
                this.sendReactionAuthor,
                this.sendReactionTimestamp,
                this.sendReactionRemove,
              );
              this.run(cmd);
            }}
          >
            Send Reaction
          </button>
        </div>

        {this.renderCommandPreview()}
      </div>
    );
  }

  renderReceiveTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">Receive messages</h3>
          <p class="text-xs text-text2 mb-4">Poll for pending messages. Timeout 0 exits immediately; -1 waits forever.</p>

          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Timeout (seconds)
              <input
                type="number"
                class="cli-input w-32"
                value={this.receiveTimeout}
                min="-1"
                onInput={(e: Event) => {
                  this.receiveTimeout = parseInt((e.target as HTMLInputElement).value, 10) || 5;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Max messages (0 = unlimited)
              <input
                type="number"
                class="cli-input w-32"
                value={this.receiveMaxMessages}
                min="0"
                onInput={(e: Event) => {
                  this.receiveMaxMessages = parseInt((e.target as HTMLInputElement).value, 10) || 0;
                }}
              />
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.receiveIgnoreAttachments}
                onChange={(e: Event) => {
                  this.receiveIgnoreAttachments = (e.target as HTMLInputElement).checked;
                }}
              />
              Ignore attachments (--ignore-attachments)
            </label>
          </div>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              if (!this.validateAccount()) return;
              this.run(
                buildReceiveCmd(this.accountPhone, {
                  timeout: this.receiveTimeout,
                  maxMessages: this.receiveMaxMessages || undefined,
                  ignoreAttachments: this.receiveIgnoreAttachments,
                }),
              );
            }}
          >
            Receive
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">Notes</h3>
          <ul class="text-sm text-text2 list-disc pl-4 space-y-2">
            <li>
              For continuous listening, use the <strong>Daemon</strong> tab with JSON-RPC.
            </li>
            <li>Message bodies will appear in the output pane; they are never pre-logged here.</li>
            <li>
              Use <code>--output json</code> (add to account bar) for machine-readable output.
            </li>
          </ul>
        </div>

        {this.renderCommandPreview()}
      </div>
    );
  }

  renderContactsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* List contacts */}
        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">List contacts</h3>

          <div class="flex flex-col gap-3 mb-4">
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.contactsShowAll}
                onChange={(e: Event) => {
                  this.contactsShowAll = (e.target as HTMLInputElement).checked;
                }}
              />
              Include all recipients (--all-recipients)
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Filter by name
              <input
                type="text"
                class="cli-input w-full"
                placeholder="Alice"
                value={this.contactsFilter}
                onInput={(e: Event) => {
                  this.contactsFilter = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-success"
              onClick={() => {
                if (!this.validateAccount()) return;
                this.run(buildListContactsCmd(this.accountPhone, { all: this.contactsShowAll, name: this.contactsFilter || undefined }));
              }}
            >
              List All
            </button>
            <button
              type="button"
              class="cli-btn cli-btn-sm"
              onClick={() => {
                if (!this.validateAccount()) return;
                this.run(buildListContactsCmd(this.accountPhone, { blocked: true }));
              }}
            >
              Blocked Only
            </button>
          </div>
        </div>

        {/* Update contact */}
        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">Update contact</h3>

          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Contact phone (E.164)
              <input
                type="tel"
                class="cli-input w-full font-mono"
                placeholder="+12125551234"
                value={this.contactTarget}
                onInput={(e: Event) => {
                  this.contactTarget = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Display name
              <input
                type="text"
                class="cli-input w-full"
                placeholder="Alice"
                value={this.contactName}
                onInput={(e: Event) => {
                  this.contactName = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Note
              <input
                type="text"
                class="cli-input w-full"
                placeholder="Optional note"
                value={this.contactNote}
                onInput={(e: Event) => {
                  this.contactNote = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Message expiration (seconds, 0 = off)
              <input
                type="number"
                class="cli-input w-32"
                value={this.contactExpiration}
                min="0"
                onInput={(e: Event) => {
                  this.contactExpiration = parseInt((e.target as HTMLInputElement).value, 10) || 0;
                }}
              />
            </label>
          </div>

          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              if (!this.validateAccount()) return;
              if (!this.contactTarget.trim()) {
                this.output = 'Enter contact phone number.';
                return;
              }
              this.run(
                buildUpdateContactCmd(this.accountPhone, this.contactTarget, {
                  name: this.contactName || undefined,
                  expiration: this.contactExpiration || undefined,
                  note: this.contactNote || undefined,
                }),
              );
            }}
          >
            Update Contact
          </button>
        </div>

        {/* Block / Unblock */}
        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">Block / Unblock</h3>
          <p class="text-xs text-text2 mb-4">Block or unblock a contact or group. Blocking stops message delivery.</p>

          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Contact phone (E.164)
              <input
                type="tel"
                class="cli-input w-full font-mono"
                placeholder="+12125551234"
                value={this.blockTarget}
                onInput={(e: Event) => {
                  this.blockTarget = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Group ID (optional — overrides contact)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="group-id-base64"
                value={this.blockGroupId}
                onInput={(e: Event) => {
                  this.blockGroupId = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="cli-btn cli-btn-danger"
              onClick={() => {
                if (!this.validateAccount()) return;
                if (!this.blockTarget && !this.blockGroupId) {
                  this.output = 'Enter phone or group ID.';
                  return;
                }
                this.run(buildBlockCmd(this.accountPhone, this.blockTarget, this.blockGroupId || undefined), `Block ${this.blockGroupId || this.blockTarget}?`);
              }}
            >
              Block
            </button>
            <button
              type="button"
              class="cli-btn"
              onClick={() => {
                if (!this.validateAccount()) return;
                if (!this.blockTarget && !this.blockGroupId) {
                  this.output = 'Enter phone or group ID.';
                  return;
                }
                this.run(buildUnblockCmd(this.accountPhone, this.blockTarget, this.blockGroupId || undefined));
              }}
            >
              Unblock
            </button>
          </div>
        </div>

        {/* Trust */}
        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">Trust / Safety numbers</h3>
          <p class="text-xs text-text2 mb-4">Verify a contact's safety number. Prefer --verified-safety-number over --trust-all-known-keys for production use.</p>

          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Recipient phone (E.164)
              <input
                type="tel"
                class="cli-input w-full font-mono"
                placeholder="+12125551234"
                value={this.trustTarget}
                onInput={(e: Event) => {
                  this.trustTarget = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Verified safety number (from out-of-band comparison)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="safety number..."
                value={this.trustSafetyNumber}
                onInput={(e: Event) => {
                  this.trustSafetyNumber = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.trustAll}
                onChange={(e: Event) => {
                  this.trustAll = (e.target as HTMLInputElement).checked;
                }}
              />
              Trust all known keys (<span class="text-warning">testing only</span>)
            </label>
          </div>

          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              if (!this.validateAccount()) return;
              if (!this.trustTarget.trim()) {
                this.output = 'Enter recipient phone number.';
                return;
              }
              this.run(
                buildTrustCmd(this.accountPhone, this.trustTarget, {
                  trustAll: this.trustAll,
                  safetyNumber: this.trustSafetyNumber || undefined,
                }),
              );
            }}
          >
            Trust
          </button>
        </div>

        {/* Update Profile */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-base text-text2 mb-3">Update profile</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Given name
              <input
                type="text"
                class="cli-input w-full"
                placeholder="Alice"
                value={this.profileGivenName}
                onInput={(e: Event) => {
                  this.profileGivenName = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Family name
              <input
                type="text"
                class="cli-input w-full"
                placeholder="Smith"
                value={this.profileFamilyName}
                onInput={(e: Event) => {
                  this.profileFamilyName = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              About
              <input
                type="text"
                class="cli-input w-full"
                placeholder="Hey there! I'm using Signal."
                value={this.profileAbout}
                onInput={(e: Event) => {
                  this.profileAbout = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              About emoji
              <input
                type="text"
                class="cli-input w-24 text-xl"
                placeholder="👋"
                value={this.profileAboutEmoji}
                onInput={(e: Event) => {
                  this.profileAboutEmoji = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Avatar path
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="/path/to/avatar.png"
                value={this.profileAvatar}
                onInput={(e: Event) => {
                  this.profileAvatar = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex items-center gap-2 text-sm text-text2 pt-5">
              <input
                type="checkbox"
                checked={this.profileRemoveAvatar}
                onChange={(e: Event) => {
                  this.profileRemoveAvatar = (e.target as HTMLInputElement).checked;
                }}
              />
              Remove avatar
            </label>
          </div>

          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              if (!this.validateAccount()) return;
              this.run(
                buildUpdateProfileCmd(this.accountPhone, {
                  givenName: this.profileGivenName || undefined,
                  familyName: this.profileFamilyName || undefined,
                  about: this.profileAbout || undefined,
                  aboutEmoji: this.profileAboutEmoji || undefined,
                  avatar: this.profileAvatar || undefined,
                  removeAvatar: this.profileRemoveAvatar,
                }),
              );
            }}
          >
            Update Profile
          </button>
        </div>

        {this.renderCommandPreview()}
      </div>
    );
  }

  renderGroupsTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* List groups */}
        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">List groups</h3>

          <label class="flex items-center gap-2 text-sm text-text2 mb-4">
            <input
              type="checkbox"
              checked={this.groupsDetailed}
              onChange={(e: Event) => {
                this.groupsDetailed = (e.target as HTMLInputElement).checked;
              }}
            />
            Detailed (--detailed)
          </label>

          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              if (!this.validateAccount()) return;
              this.run(buildListGroupsCmd(this.accountPhone, this.groupsDetailed));
            }}
          >
            List Groups
          </button>
        </div>

        {/* Join group */}
        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">Join group</h3>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Invite link URI
            <input
              type="text"
              class="cli-input w-full font-mono"
              placeholder="https://signal.group/#..."
              value={this.joinGroupUri}
              onInput={(e: Event) => {
                this.joinGroupUri = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              if (!this.validateAccount()) return;
              if (!this.joinGroupUri.trim()) {
                this.output = 'Enter group invite URI.';
                return;
              }
              this.run(buildJoinGroupCmd(this.accountPhone, this.joinGroupUri));
            }}
          >
            Join Group
          </button>
        </div>

        {/* Update group */}
        <div class="cli-card xl:col-span-2">
          <h3 class="text-base text-text2 mb-3">Create / update group</h3>
          <p class="text-xs text-text2 mb-4">Leave group ID blank to create a new group.</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Group ID (blank = create new)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="base64groupid"
                value={this.updateGroupId}
                onInput={(e: Event) => {
                  this.updateGroupId = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Group name
              <input
                type="text"
                class="cli-input w-full"
                placeholder="Team Alpha"
                value={this.updateGroupName}
                onInput={(e: Event) => {
                  this.updateGroupName = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2 md:col-span-2">
              Description
              <input
                type="text"
                class="cli-input w-full"
                placeholder="Optional description"
                value={this.updateGroupDesc}
                onInput={(e: Event) => {
                  this.updateGroupDesc = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Add members (space-separated phones)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="+1... +44..."
                value={this.updateGroupAddMembers}
                onInput={(e: Event) => {
                  this.updateGroupAddMembers = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Remove members (space-separated phones)
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="+1... +44..."
                value={this.updateGroupRemoveMembers}
                onInput={(e: Event) => {
                  this.updateGroupRemoveMembers = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Expiration (seconds, 0 = off)
              <input
                type="number"
                class="cli-input w-32"
                value={this.updateGroupExpiration}
                min="0"
                onInput={(e: Event) => {
                  this.updateGroupExpiration = parseInt((e.target as HTMLInputElement).value, 10) || 0;
                }}
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-text2">
              Invite link
              <select
                class="cli-select w-full"
                onChange={(e: Event) => {
                  this.updateGroupLink = (e.target as HTMLSelectElement).value as typeof this.updateGroupLink;
                }}
              >
                <option value="enabled">Enabled</option>
                <option value="enabled-with-approval">Enabled with approval</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              if (!this.validateAccount()) return;
              this.run(
                buildUpdateGroupCmd(this.accountPhone, this.updateGroupId, {
                  name: this.updateGroupName || undefined,
                  description: this.updateGroupDesc || undefined,
                  addMembers: this.updateGroupAddMembers.trim() ? this.updateGroupAddMembers.trim().split(/\s+/) : undefined,
                  removeMembers: this.updateGroupRemoveMembers.trim() ? this.updateGroupRemoveMembers.trim().split(/\s+/) : undefined,
                  expiration: this.updateGroupExpiration || undefined,
                  link: this.updateGroupLink,
                }),
              );
            }}
          >
            {this.updateGroupId ? 'Update Group' : 'Create Group'}
          </button>
        </div>

        {/* Quit group */}
        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">Quit group</h3>

          <div class="flex flex-col gap-3 mb-4">
            <label class="flex flex-col gap-1 text-sm text-text2">
              Group ID
              <input
                type="text"
                class="cli-input w-full font-mono"
                placeholder="base64groupid"
                value={this.quitGroupId}
                onInput={(e: Event) => {
                  this.quitGroupId = (e.target as HTMLInputElement).value;
                }}
              />
            </label>
            <label class="flex items-center gap-2 text-sm text-danger">
              <input
                type="checkbox"
                checked={this.quitGroupDelete}
                onChange={(e: Event) => {
                  this.quitGroupDelete = (e.target as HTMLInputElement).checked;
                }}
              />
              Also delete local group data (--delete, irreversible)
            </label>
          </div>

          <button
            type="button"
            class="cli-btn cli-btn-danger"
            onClick={() => {
              if (!this.validateAccount()) return;
              if (!this.quitGroupId.trim()) {
                this.output = 'Enter group ID.';
                return;
              }
              this.run(buildQuitGroupCmd(this.accountPhone, this.quitGroupId, { delete: this.quitGroupDelete }), `Quit group ${this.quitGroupId}?`);
            }}
          >
            Quit Group
          </button>
        </div>

        {this.renderCommandPreview()}
      </div>
    );
  }

  renderDevicesTab() {
    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* List devices */}
        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">List linked devices</h3>
          <p class="text-xs text-text2 mb-4">Shows all devices linked to this account.</p>
          <button
            type="button"
            class="cli-btn cli-btn-success"
            onClick={() => {
              if (!this.validateAccount()) return;
              this.run(buildListDevicesCmd(this.accountPhone));
            }}
          >
            List Devices
          </button>
        </div>

        {/* Remove device */}
        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">Remove linked device</h3>
          <p class="text-xs text-text2 mb-4">Deauthorises a secondary device. Find the device ID via List Devices.</p>

          <label class="flex flex-col gap-1 text-sm text-text2 mb-4">
            Device ID
            <input
              type="number"
              class="cli-input w-32"
              placeholder="2"
              value={this.removeDeviceId}
              onInput={(e: Event) => {
                this.removeDeviceId = (e.target as HTMLInputElement).value;
              }}
            />
          </label>

          <button
            type="button"
            class="cli-btn cli-btn-danger"
            onClick={() => {
              if (!this.validateAccount()) return;
              const id = parseInt(this.removeDeviceId, 10);
              if (!id) {
                this.output = 'Enter a valid device ID.';
                return;
              }
              this.run(buildRemoveDeviceCmd(this.accountPhone, id), `Remove device ${id}?`);
            }}
          >
            Remove Device
          </button>
        </div>

        {this.renderCommandPreview()}
      </div>
    );
  }

  renderDaemonTab() {
    const daemonCmd = buildDaemonCmd({
      socket: this.daemonSocket,
      tcp: this.daemonTcp,
      http: this.daemonHttp,
      dbus: this.daemonDbus,
      dbusSystem: this.daemonDbusSystem,
      receiveMode: this.daemonReceiveMode,
      noReceiveStdout: this.daemonNoStdout,
    });

    return (
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">Daemon mode</h3>
          <p class="text-xs text-text2 mb-4">
            Run signal-cli as a long-lived daemon that exposes a JSON-RPC or D-Bus interface. Useful for integrations and scripts that need to continuously receive messages.
          </p>

          <div class="flex flex-col gap-3 mb-4">
            <span class="text-sm font-medium text-text2">Transport</span>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.daemonSocket}
                onChange={(e: Event) => {
                  this.daemonSocket = (e.target as HTMLInputElement).checked;
                }}
              />
              UNIX socket (default path: $XDG_RUNTIME_DIR/signal-cli/socket)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.daemonTcp}
                onChange={(e: Event) => {
                  this.daemonTcp = (e.target as HTMLInputElement).checked;
                }}
              />
              TCP JSON-RPC (default localhost:7583)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.daemonHttp}
                onChange={(e: Event) => {
                  this.daemonHttp = (e.target as HTMLInputElement).checked;
                }}
              />
              HTTP JSON-RPC (default localhost:8080)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.daemonDbus}
                onChange={(e: Event) => {
                  this.daemonDbus = (e.target as HTMLInputElement).checked;
                }}
              />
              D-Bus user bus (--dbus)
            </label>
            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.daemonDbusSystem}
                onChange={(e: Event) => {
                  this.daemonDbusSystem = (e.target as HTMLInputElement).checked;
                }}
              />
              D-Bus system bus (--dbus-system)
            </label>

            <label class="flex flex-col gap-1 text-sm text-text2">
              Receive mode
              <select
                class="cli-select w-48"
                onChange={(e: Event) => {
                  this.daemonReceiveMode = (e.target as HTMLSelectElement).value as typeof this.daemonReceiveMode;
                }}
              >
                <option value="on-start">on-start</option>
                <option value="on-connection">on-connection</option>
                <option value="manual">manual</option>
              </select>
            </label>

            <label class="flex items-center gap-2 text-sm text-text2">
              <input
                type="checkbox"
                checked={this.daemonNoStdout}
                onChange={(e: Event) => {
                  this.daemonNoStdout = (e.target as HTMLInputElement).checked;
                }}
              />
              Don't print received messages to stdout (--no-receive-stdout)
            </label>
          </div>

          <div class="cli-cmd-preview mb-4">{daemonCmd}</div>

          <button
            type="button"
            class="cli-btn"
            onClick={() => {
              this.lastCommand = daemonCmd;
              this.output =
                'Daemon commands are long-running processes. Copy the command above and run it in a terminal.\n\nThe native bridge must handle process lifecycle (start/stop/restart).';
              this.status = 'idle';
              this.statusMessage = 'See output';
            }}
          >
            Preview Command
          </button>
        </div>

        <div class="cli-card">
          <h3 class="text-base text-text2 mb-3">JSON-RPC usage</h3>
          <p class="text-xs text-text2 mb-2">Once the daemon is running, send newline-delimited JSON-RPC requests:</p>
          <pre class="cli-output text-xs">{`# List accounts via TCP
echo '{"jsonrpc":"2.0","method":"listAccounts","id":1}' \\
  | nc localhost 7583

# Send a message
echo '{"jsonrpc":"2.0","method":"send","params":{\\
  "recipient":["+12125551234"],\\
  "message":"[body omitted]"},"id":2}' \\
  | nc localhost 7583`}</pre>

          <p class="text-xs text-text2 mt-4">
            Alternatively use <code class="font-mono">signal-cli jsonRpc</code> to feed commands on stdin.
          </p>
        </div>

        {this.renderCommandPreview()}
      </div>
    );
  }

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
        {tab.label}
      </button>
    ));
  }

  renderTabContent() {
    switch (this.activeTab) {
      case 'register-link':
        return this.renderRegisterLinkTab();
      case 'send':
        return this.renderSendTab();
      case 'receive':
        return this.renderReceiveTab();
      case 'contacts':
        return this.renderContactsTab();
      case 'groups':
        return this.renderGroupsTab();
      case 'devices':
        return this.renderDevicesTab();
      case 'daemon':
        return this.renderDaemonTab();
      default:
        return null;
    }
  }

  render() {
    return (
      <div class="min-h-screen">
        <header class="mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <span>📨</span> signal-cli GUI
          </h2>
          <p class="text-text2 text-sm">Visual interface for Signal Messenger CLI (github.com/AsamK/signal-cli)</p>
        </header>

        {this.renderAccountBar()}

        <div class="border-b border-accent2 mb-4 flex flex-wrap gap-1">{this.renderTabs()}</div>

        <div class="tab-content">{this.renderTabContent()}</div>
      </div>
    );
  }
}
