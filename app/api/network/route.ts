import { ndjsonStream } from "@/lib/server/net";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import dns from "node:dns/promises";

const execPromise = promisify(exec);
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WriteFn = (event: Record<string, unknown>) => void;

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
    // Windows ping: -n 1 (one packet)
    const { stdout } = await execPromise(`ping -n 1 ${target}`);
    const match = stdout.match(/time[=<]\s*(\d+)\s*ms/);
    const latency = match ? `${match[1]} ms` : "reachable";
    write({ type: "result", label: "Reachability", value: "Online", tone: "green" });
    write({ type: "result", label: "Latency", value: latency, tone: "cyan" });
  } catch (e) {
    write({ type: "result", label: "Reachability", value: "Offline / Filtered", tone: "error" });
  }

  // 3. Basic HTTP Check
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`http://${target}`, { signal: controller });
    clearTimeout(timeout);
    write({ type: "result", label: "HTTP Status", value: `${res.status} ${res.statusText}`, tone: res.ok ? "green" : "warning" });
  } catch (e) {
    write({ type: "result", label: "HTTP Status", value: "not reachable on port 80", tone: "warning" });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = (searchParams.get("q") || "").trim();

  if (!target) {
    return Response.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  return ndjsonStream(
    (write) => runDiagnostics(target, write),
    (write) => write({ type: "meta", target, mode: "Network Diagnostics" })
  );
}
