import { ndjsonStream } from "@/lib/server/net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WriteFn = (event: Record<string, unknown>) => void;

async function runWhois(domain: string, write: WriteFn) {
  write({ type: "notice", message: `Querying RDAP for ${domain}...` });

  try {
    // RDAP is a standardized HTTP protocol for WHOIS
    const response = await fetch(`https://rdap.org/domain/${domain}`);
    if (!response.ok) {
      write({ type: "result", label: "Status", value: `RDAP returned ${response.status}`, tone: "error" });
      return;
    }

    const data = await response.json();

    // Extract basic info from RDAP response
    const events = (data.events || []).find((e: any) => e.eventAction === "registration");
    const registrationDate = events?.eventDate || "unknown";

    const entities = (data.entities || []).find((e: any) => e.roles.includes("registrar"));
    const registrar = entities?.vcardArray?.[0]?.[1]?.[0]?.[3] || "unknown";

    write({ type: "result", label: "Domain", value: domain, tone: "cyan" });
    write({ type: "result", label: "Registrar", value: registrar, tone: "green" });
    write({ type: "result", label: "Registration Date", value: registrationDate, tone: "green" });
    write({ type: "result", label: "Status", value: "Verified via RDAP", tone: "green" });

  } catch (e) {
    write({ type: "result", label: "Error", value: "RDAP query failed", tone: "error" });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domain = (searchParams.get("q") || "").trim();

  if (!domain) {
    return Response.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  return ndjsonStream(
    (write) => runWhois(domain, write),
    (write) => write({ type: "meta", target: domain, mode: "WHOIS Lookup" })
  );
}
