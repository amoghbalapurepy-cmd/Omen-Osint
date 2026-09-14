import { ndjsonStream } from "@/lib/server/net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WriteFn = (event: Record<string, unknown>) => void;

function isValidDomain(domain: string) {
  return /^[a-zA-Z0-9.-]{1,253}$/.test(domain);
}

async function runWhois(domain: string, write: WriteFn) {
  write({ type: "notice", message: `Querying RDAP for ${domain}...` });

  try {
    const response = await fetch(`https://rdap.org/domain/${domain}`);
    if (!response.ok) {
      write({ type: "result", label: "Status", value: `RDAP returned ${response.status}`, tone: "error" });
      return;
    }

    const data = await response.json();

    const events = (data.events || []).find((e: any) => e.eventAction === "registration");
    const registrationDate = events?.eventDate || "unknown";

    let registrar = "unknown";
    const registrarEntity = (data.entities || []).find((e: any) => e.roles?.includes("registrar"));
    if (registrarEntity && registrarEntity.vcardArray) {
      // vCard array parsing is complex; try to find the name in the structure
      // Usually: [ [ "n", [ "Last", "First", "Middle", "Prefix", "Suffix" ] ] ]
      const nameField = registrarEntity.vcardArray.find((field: any) => field[0] === "n");
      if (nameField && nameField[1]) {
        registrar = nameField[1].filter(Boolean).join(" ");
      }
    }

    write({ type: "result", label: "Domain", value: domain, tone: "cyan" });
    write({ type: "result", label: "Registrar", value: registrar || "unknown", tone: "green" });
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

  if (!isValidDomain(domain)) {
    return Response.json({ error: "Invalid domain name provided." }, { status: 400 });
  }

  return ndjsonStream(
    (write) => runWhois(domain, write),
    (write) => write({ type: "meta", target: domain, mode: "WHOIS Lookup" })
  );
}
