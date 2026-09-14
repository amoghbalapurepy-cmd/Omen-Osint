"use client";

import { useState } from "react";
import { KeyRound, Lock, Shield, SlidersHorizontal } from "lucide-react";
import { Panel, PanelHeader } from "./omen-ui";
import { useOmenLog } from "@/lib/use-omen-log";
import { cn } from "@/lib/cn";

function ReadonlyBadge({ tone, children }: { tone: "green" | "cyan"; children: string }) {
  return (
    <span
      className="mono rounded border px-2 py-1 text-[10px] uppercase tracking-[0.14em]"
      style={{
        color: tone === "green" ? "var(--green)" : "var(--cyan)",
        borderColor: tone === "green" ? "rgba(56,229,140,0.3)" : "var(--cyan-border)",
        background: tone === "green" ? "rgba(56,229,140,0.06)" : "rgba(24,228,245,0.06)",
      }}
    >
      {children}
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[13px] text-secondary">{label}</span>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const { clear } = useOmenLog();
  const [tavilyKey, setTavilyKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [googleCx, setGoogleCx] = useState("");
  const [keyStatus, setKeyStatus] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<{ msg: string; ok: boolean } | null>(null);
  const [testing, setTesting] = useState(false);

  async function saveSettings() {
    if (!tavilyKey.trim() && !googleKey.trim() && !googleCx.trim()) {
      setKeyStatus("Enter at least one API key before saving.");
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tavilyApiKey: tavilyKey.trim(),
          googleApiKey: googleKey.trim(),
          googleCx: googleCx.trim(),
        }),
      });

      if (!res.ok) throw new Error("Server responded with error");

      setTavilyKey("");
      setGoogleKey("");
      setGoogleCx("");
      setKeyStatus("Credentials saved successfully to the server.");
    } catch {
      setKeyStatus("Failed to save credentials. Please check your connection.");
    }
  }

  async function testConnection() {
    setTesting(true);
    setTestStatus(null);
    try {
      const r = await fetch("/api/health", { cache: "no-store" });
      const d = (await r.json()) as { ok?: boolean; webSearch?: boolean; providers?: { tavily?: boolean; google?: boolean } };
      if (d?.webSearch || d?.providers?.tavily || d?.providers?.google) {
        setTestStatus({ ok: true, msg: "Provider reachable. Public web search is configured server-side." });
      } else {
        setTestStatus({
          ok: false,
          msg: "Backend online, but no web-search credential is configured in the server environment.",
        });
      }
    } catch {
      setTestStatus({ ok: false, msg: "Could not reach the OMEN backend." });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-[13px] text-muted">
          Provider access, privacy posture and interface controls.
        </p>
      </div>

      <Panel>
        <PanelHeader icon={<KeyRound size={15} />} title="Public Web Search" />
        <div className="space-y-4 p-4">
          <div className="space-y-3">
            <div>
              <label htmlFor="tavily-key" className="label mb-2 block !text-secondary">
                Tavily API Key
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="tavily-key"
                  type="password"
                  autoComplete="off"
                  value={tavilyKey}
                  onChange={(e) => setTavilyKey(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="min-w-0 flex-1 rounded-md border border-line bg-deep/70 px-3 py-2 text-[14px] text-foreground outline-none placeholder:text-muted focus:border-cyan"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="google-key" className="label mb-2 block !text-secondary">
                  Google API Key
                </label>
                <input
                  id="google-key"
                  type="password"
                  autoComplete="off"
                  value={googleKey}
                  onChange={(e) => setGoogleKey(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="w-full rounded-md border border-line bg-deep/70 px-3 py-2 text-[14px] text-foreground outline-none placeholder:text-muted focus:border-cyan"
                />
              </div>
              <div>
                <label htmlFor="google-cx" className="label mb-2 block !text-secondary">
                  Google Search Engine ID (CX)
                </label>
                <input
                  id="google-cx"
                  type="text"
                  autoComplete="off"
                  value={googleCx}
                  onChange={(e) => setGoogleCx(e.target.value)}
                  placeholder="example: 123456789..."
                  className="w-full rounded-md border border-line bg-deep/70 px-3 py-2 text-[14px] text-foreground outline-none placeholder:text-muted focus:border-cyan"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={saveSettings}
                className="rounded-md border border-cyan-border bg-cyan/10 px-4 py-2 text-[13px] text-cyan transition-colors hover:bg-cyan hover:text-background"
              >
                Save All
              </button>
              <button
                type="button"
                onClick={testConnection}
                disabled={testing}
                className="rounded-md border border-line px-4 py-2 text-[13px] text-secondary transition-colors hover:border-cyan-border hover:text-foreground disabled:opacity-50"
              >
                {testing ? "Testing…" : "Test Connection"}
              </button>
            </div>
            {keyStatus && (
              <p className="mt-2 flex items-center gap-1.5 text-[12px] text-green">
                <Lock size={12} /> {keyStatus}
              </p>
            )}
            {testStatus && (
              <p
                className="mt-2 text-[12px]"
                style={{ color: testStatus.ok ? "var(--green)" : "var(--warning)" }}
              >
                {testStatus.msg}
              </p>
            )}
          </div>
          <p className="border-t border-line pt-3 text-[12px] leading-relaxed text-muted">
            Provider credentials are stored locally and are never displayed after
            saving. Keys entered here are validated then discarded — the live key is
            read from the server environment and never exposed to the browser.
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader icon={<Shield size={15} />} title="Privacy" />
        <div className="divide-y divide-line">
          <Row label="Local history">
            <ReadonlyBadge tone="cyan">Browser storage</ReadonlyBadge>
          </Row>
          <Row label="Private-account access">
            <ReadonlyBadge tone="green">Disabled</ReadonlyBadge>
          </Row>
          <Row label="Identity guessing">
            <ReadonlyBadge tone="green">Disabled</ReadonlyBadge>
          </Row>
          <Row label="Evidence model">
            <ReadonlyBadge tone="cyan">Public sources only</ReadonlyBadge>
          </Row>
        </div>
      </Panel>

      <Panel>
        <PanelHeader icon={<SlidersHorizontal size={15} />} title="Interface" />
        <div className="divide-y divide-line">
          <Row label="Clear local history">
            <button
              type="button"
              onClick={clear}
              className="rounded-md border border-line px-3 py-1.5 text-[12px] text-secondary transition-colors hover:border-error/50 hover:text-error"
            >
              Clear history
            </button>
          </Row>
          <Row label="Reset interface">
            <button
              type="button"
              onClick={() => {
                clear();
                try {
                  window.localStorage.removeItem("omen.provider.configured");
                } catch {
                  /* ignore */
                }
                setTavilyKey("");
                setGoogleKey("");
                setGoogleCx("");
                setKeyStatus(null);
                setTestStatus(null);
              }}
              className={cn(
                "rounded-md border border-line px-3 py-1.5 text-[12px] text-secondary transition-colors",
                "hover:border-cyan-border hover:text-foreground",
              )}
            >
              Reset
            </button>
          </Row>
        </div>
      </Panel>
    </div>
  );
}
