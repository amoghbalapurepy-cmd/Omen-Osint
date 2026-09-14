import { ndjsonStream } from "@/lib/server/net";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import dns from "node:dns/promises";

const execPromise = promisify(exec);
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WriteFn = (event: Record<string, unknown>) => void;

function isValidTarget(target: string) {
  // Allow only hostnames/IPs: alphanumeric, dots, hyphens. Max length 253.
  return /^[a-zA-Z0-9.-]{1,253}$/.test(target);
}

async function runDiagnostics(target: string, write: WriteFn) {
  write({ type: "notice", message: `Running diagnostics for ${target}...` });

  // 1. DNS Resolution
  try {
    const addresses = await dns.resolve4(target);
    write({ type: "result", label: "Resolved IP", value: addresses[0], tone: "green" });
  } catch (e) {
    write({ type: "result", label: "Resolved IP", value: "could not resolve", tone: "error" });
  }

  // 2. Reachability & Latency (Ping)
  try {
    const flag = process.platform === "win32" ? "-n" : "-c";
    const { stdout } = await execPromise(`ping ${flag} 1 ${target}`);
    const match = stdout.match(/time[=<]\s*(\d+)\s*ms/);
    const latency = match ? `${match[1]} ms` : "reachable";
    write({ type: "result", label: "Reachability", value: "Online", tone: "green" });
    write({ type: "result", label: "Latency", value: latency, tone: "cyan" });
  } catch (e) {
    write({ type: "result", label: "Reachability", value: "Offline / Filtered", tone: "error" });
  }

  // 3. Basic HTTP/HTTPS Check
  try {
    const protocols = ["https", "http"];
    let success = false;
    for (const proto of protocols) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${proto}://${target}`, { signal: controller.signal });
        clearTimeout(timeout);
        write({ type: "result", label: `${proto.toUpperCase()} Status`, value: `${res.status} ${res.statusText}`, tone: res.ok ? "green" : "warning" });
        if (res.ok) success = true;
      } catch (e) {
        write({ type: "result", label: `${proto.toUpperCase()} Status`, value: "unreachable", tone: "warning" });
      }
    }
    if (!success) {
      write({ type: "notice", message: "Target is not reachable via standard web ports (80/443)." });
    }
  } catch (e) {
    write({ type: "result", label: "Web Check", value: "failed", tone: "error" });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = (searchParams.get("q") || "").trim();

  if (!target) {
    return Response.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  if (!isValidTarget(target)) {
    return Response.json({ error: "Invalid target. Please provide a valid hostname or IP address." }, { status: 400 });
  }

  return ndjsonStream(
    (write) => runDiagnostics(target, write),
    (write) => write({ type: "meta", target, mode: "Network Diagnostics" })
  );
}
