import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Fingerprint,
  Globe,
  Home,
  Link2,
  Mail,
  Network,
  ScanLine,
  ScrollText,
  Settings,
  TerminalSquare,
  UserSearch,
} from "lucide-react";

export type ModuleGroup =
  | "WORKSPACE"
  | "OSINT TOOLS"
  | "SECURITY TOOLS"
  | "UTILITIES";

/** How a module resolves data — determines which service runs. */
export type ModuleKind =
  | "dashboard"
  | "web" // real: Tavily public web search
  | "recon" // real: public username/profile verification
  | "generic" // placeholder service, clearly marked demo output
  | "settings"
  | "logs";

export type SearchMode = "Social" | "Domain" | "Web" | "IP" | "OSINT";

export type OmenModule = {
  id: string;
  label: string;
  group: ModuleGroup;
  icon: LucideIcon;
  short: string;
  placeholder: string;
  kind: ModuleKind;
  mode?: SearchMode;
};

export const MODULES: OmenModule[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    group: "WORKSPACE",
    icon: Home,
    short: "Command overview",
    placeholder: "Search anything... (username, domain, URL, keyword, etc.)",
    kind: "dashboard",
  },
  {
    id: "social",
    label: "Social Scan",
    group: "OSINT TOOLS",
    icon: ScanLine,
    short: "Find public profiles, posts and connections",
    placeholder: "Enter a public username or handle...",
    kind: "recon",
    mode: "Social",
  },
  {
    id: "username",
    label: "Username Lookup",
    group: "OSINT TOOLS",
    icon: Fingerprint,
    short: "Verify username presence across public providers",
    placeholder: "Enter a username (2-64 chars)...",
    kind: "recon",
    mode: "Social",
  },
  {
    id: "domain",
    label: "Domain / Email",
    group: "OSINT TOOLS",
    icon: Mail,
    short: "Domain info, email breaches, DNS",
    placeholder: "Enter a domain or email address...",
    kind: "generic",
    mode: "Domain",
  },
  {
    id: "web",
    label: "Web Search",
    group: "OSINT TOOLS",
    icon: Globe,
    short: "General public web search & intelligence",
    placeholder: "Enter a name, phrase, handle or keyword...",
    kind: "web",
    mode: "Web",
  },
  {
    id: "sources",
    label: "OSINT Sources",
    group: "OSINT TOOLS",
    icon: Boxes,
    short: "Public databases & open sources",
    placeholder: "Filter public OSINT sources...",
    kind: "generic",
    mode: "OSINT",
  },
  {
    id: "network",
    label: "Network Diagnostics",
    group: "SECURITY TOOLS",
    icon: Network,
    short: "IP lookup, latency, connectivity",
    placeholder: "Leave blank for your own IP, or enter a public IP...",
    kind: "generic",
    mode: "IP",
  },
  {
    id: "url",
    label: "URL Analysis",
    group: "SECURITY TOOLS",
    icon: Link2,
    short: "Scan links, detect malicious content",
    placeholder: "Enter a public URL to inspect...",
    kind: "generic",
    mode: "Web",
  },
  {
    id: "port",
    label: "Port Scanner",
    group: "SECURITY TOOLS",
    icon: TerminalSquare,
    short: "Inspect commonly exposed public ports",
    placeholder: "Enter a public host or IP you are authorized to test...",
    kind: "generic",
    mode: "IP",
  },
  {
    id: "whois",
    label: "Whois Lookup",
    group: "SECURITY TOOLS",
    icon: ScanLine,
    short: "Public registration records",
    placeholder: "Enter a domain name...",
    kind: "generic",
    mode: "Domain",
  },
  {
    id: "settings",
    label: "Settings",
    group: "UTILITIES",
    icon: Settings,
    short: "Providers, privacy and interface",
    placeholder: "",
    kind: "settings",
  },
  {
    id: "logs",
    label: "Logs",
    group: "UTILITIES",
    icon: ScrollText,
    short: "Local application activity",
    placeholder: "",
    kind: "logs",
  },
];

export const MODULE_MAP: Record<string, OmenModule> = Object.fromEntries(
  MODULES.map((m) => [m.id, m]),
);

export const NAV_GROUPS: ModuleGroup[] = [
  "WORKSPACE",
  "OSINT TOOLS",
  "SECURITY TOOLS",
  "UTILITIES",
];

/** Quick Access cards on the dashboard (6). */
export const QUICK_ACCESS_IDS = [
  "social",
  "domain",
  "web",
  "url",
  "network",
  "sources",
] as const;

export const QUICK_SEARCH_MODES: SearchMode[] = [
  "Social",
  "Domain",
  "Web",
  "IP",
  "OSINT",
];

/** Which module a quick-search mode routes to. */
export const MODE_TO_MODULE: Record<SearchMode, string> = {
  Social: "social",
  Domain: "domain",
  Web: "web",
  IP: "network",
  OSINT: "sources",
};

export type SystemStatusRow = {
  label: string;
  status: string;
  tone: "green" | "cyan";
};

export const SYSTEM_STATUS: SystemStatusRow[] = [
  { label: "Backend Server", status: "Online", tone: "green" },
  { label: "Public Web Search", status: "Online", tone: "cyan" },
  { label: "Provider Checks", status: "Online", tone: "cyan" },
  { label: "Local History", status: "Online", tone: "green" },
];

export type LogEntry = {
  id: string;
  time: string; // ISO
  action: string; // SCAN / LOOKUP / SEARCH
  module: string;
  query: string;
  status: "completed" | "running" | "empty" | "error";
};

/** Example activity so the panels never look dead before real use. */
export const SEED_LOG: LogEntry[] = [
  { id: "s1", time: iso("10:42"), action: "SEARCH", module: "Web Search", query: "Pokemon", status: "completed" },
  { id: "s2", time: iso("09:18"), action: "LOOKUP", module: "Domain / Email", query: "example.com", status: "completed" },
  { id: "s3", time: iso("08:53"), action: "SCAN", module: "Username Lookup", query: "github", status: "completed" },
  { id: "s4", time: iso("08:12"), action: "SCAN", module: "Network Diagnostics", query: "8.8.8.8", status: "completed" },
  { id: "s5", time: iso("07:46"), action: "SCAN", module: "URL Analysis", query: "https://example.com", status: "completed" },
];

function iso(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function formatClock(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatStamp(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
