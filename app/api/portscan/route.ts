import { ndjsonStream } from "@/lib/server/net";
import net from "node:net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WriteFn = (event: Record<string, unknown>) => void;

async function checkPort(host: string, port: number): Promise<"open" | "closed" | "filtered"> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);

    socket.on("connect", () => {
      socket.destroy();
      resolve("open");
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve("filtered");
    });

    socket.on("error", () => {
      socket.destroy();
      resolve("closed");
    });

    socket.connect(port, host);
  });
}

async function runPortScan(target: string, write: WriteFn) {
  write({ type: "notice", message: `Scanning common ports for ${target}...` });

  const commonPorts = [
    { port: 21, name: "FTP" },
    { port: 22, name: "SSH" },
    { port: 23, name: "Telnet" },
    { port: 25, name: "SMTP" },
    { port: 53, name: "DNS" },
    { port: 80, name: "HTTP" },
    { port: 110, name: "POP3" },
    { port: 143, name: "IMAP" },
    { port: 443, name: "HTTPS" },
    { port: 3306, name: "MySQL" },
    { port: 3389, name: "RDP" },
    { port: 5432, name: "PostgreSQL" },
    { port: 8080, name: "HTTP-Proxy" },
  ];

  for (const { port, name } of commonPorts) {
    const status = await checkPort(target, port);
    const tone = status === "open" ? "green" : status === "filtered" ? "warning" : "cyan";
    write({
      type: "result",
      label: `${name} (${port})`,
      value: status,
      tone: tone,
    });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = (searchParams.get("q") || "").trim();

  if (!target) {
    return Response.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  return ndjsonStream(
    (write) => runPortScan(target, write),
    (write) => write({ type: "meta", target, mode: "Port Scanner" })
  );
}
