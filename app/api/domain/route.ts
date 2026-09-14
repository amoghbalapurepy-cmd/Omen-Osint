import { ndjsonStream } from "@/lib/server/net";
import dns from "node:dns/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WriteFn = (event: Record<string, unknown>) => void;

async function checkDNS(domain: string, write: WriteFn) {
  write({ type: "notice", message: `Analyzing DNS records for ${domain}...` });

  // 1. A Record
  try {
    const addresses = await dns.resolve4(domain);
    write({ type: "result", label: "A Record", value: addresses.join(", "), tone: "green" });
  } catch (e) {
    write({ type: "result", label: "A Record", value: "not found", tone: "warning" });
  }

  // 2. MX Records
  try {
    const mx = await dns.resolveMx(domain);
    const mxList = mx.map(m => `${m.exchange} (priority: ${m.priority})`).join(", ");
    write({ type: "result", label: "MX Record", value: mxList || "none", tone: mxList ? "green" : "warning" });
  } catch (e) {
    write({ type: "result", label: "MX Record", value: "not found", tone: "warning" });
  }

  // 3. SPF Record
  try {
    const txt = await dns.resolveTxt(domain);
    const spf = txt.flat().find(r => r.startsWith("v=spf1"));
    if (spf) {
      write({ type: "result", label: "SPF Record", value: spf, tone: "green" });
    } else {
      write({ type: "result", label: "SPF Record", value: "not found", tone: "warning" });
    }
  } catch (e) {
    write({ type: "result", label: "SPF Record", value: "not found", tone: "warning" });
  }

  // 4. DMARC Record
  try {
    const dmarcTxt = await dns.resolveTxt(`_dmarc.${domain}`);
    const dmarc = dmarcTxt.flat().find(r => r.startsWith("v=DMARC1"));
    if (dmarc) {
      write({ type: "result", label: "DMARC Record", value: dmarc, tone: "green" });
    } else {
      write({ type: "result", label: "DMARC Record", value: "not found", tone: "warning" });
    }
  } catch (e) {
    write({ type: "result", label: "DMARC Record", value: "not found", tone: "warning" });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = (searchParams.get("q") || "").trim();

  if (!target) {
    return Response.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  return ndjsonStream(
    (write) => checkDNS(target, write),
    (write) => write({ type: "meta", target, mode: "Live DNS Analysis" })
  );
}
