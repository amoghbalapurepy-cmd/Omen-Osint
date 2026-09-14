import { ndjsonStream } from "@/lib/server/net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WriteFn = (event: Record<string, unknown>) => void;

async function analyzeUrl(urlStr: string, write: WriteFn) {
  write({ type: "notice", message: `Analyzing URL ${urlStr}...` });

  try {
    const url = new URL(urlStr);
    write({ type: "result", label: "Scheme", value: url.protocol.replace(":", ""), tone: "green" });
    write({ type: "result", label: "Hostname", value: url.hostname, tone: "cyan" });

    const response = await fetch(urlStr, { redirect: "manual" });

    // Redirect check
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      write({ type: "result", label: "Redirect", value: `Found redirect to ${location}`, tone: "warning" });
    } else {
      write({ type: "result", label: "Redirect", value: "No redirect detected", tone: "green" });
    }

    // Header analysis
    const securityHeaders = {
      "Content-Security-Policy": "CSP",
      "X-Frame-Options": "Clickjacking protection",
      "Strict-Transport-Security": "HSTS",
      "X-Content-Type-Options": "MIME sniffing protection",
      "Referrer-Policy": "Referrer control",
    };

    let missing = [];
    for (const [header, label] of Object.entries(securityHeaders)) {
      if (response.headers.get(header)) {
        write({ type: "result", label: label, value: "present", tone: "green" });
      } else {
        missing.push(label);
      }
    }

    if (missing.length > 0) {
      write({ type: "result", label: "Missing Headers", value: missing.join(", "), tone: "warning" });
    }

    write({ type: "result", label: "HTTP Status", value: `${response.status} ${response.statusText}`, tone: response.ok ? "green" : "warning" });

  } catch (e) {
    write({ type: "result", label: "Error", value: "Invalid URL or connection failed", tone: "error" });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = (searchParams.get("q") || "").trim();

  if (!url) {
    return Response.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  return ndjsonStream(
    (write) => analyzeUrl(url, write),
    (write) => write({ type: "meta", target: url, mode: "URL Analysis" })
  );
}
