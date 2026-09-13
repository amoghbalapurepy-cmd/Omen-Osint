import { getJson, ndjsonStream, type FetchResult } from "@/lib/server/net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WriteFn = (event: Record<string, unknown>) => void;

type ProviderSpec = {
  name: string;
  url: string;
  profile?: string;
  timeout?: number;
  miss?: (r: FetchResult) => boolean;
  parse: (data: unknown) => { exists: boolean; detail?: string; extra?: string };
};

function validUsername(u: string) {
  return /^[A-Za-z0-9._-]{2,64}$/.test(u);
}

async function checkProvider(spec: ProviderSpec, write: WriteFn) {
  write({ type: "checking", provider: spec.name });
  const r = await getJson(spec.url, spec.timeout || 8000);
  if (r.error) {
    write({
      type: "result",
      provider: spec.name,
      status: "unverified",
      reason: r.error,
      profile: spec.profile,
    });
    return;
  }
  if (spec.miss && spec.miss(r)) {
    write({ type: "result", provider: spec.name, status: "miss", http: r.status, profile: spec.profile });
    return;
  }
  if (!r.ok) {
    write({
      type: "result",
      provider: spec.name,
      status: "unverified",
      http: r.status,
      reason: "provider returned a non-success response; not treated as a miss",
      profile: spec.profile,
    });
    return;
  }
  try {
    const parsed = spec.parse(r.data);
    write({
      type: "result",
      provider: spec.name,
      status: parsed.exists ? "confirmed" : "miss",
      http: r.status,
      detail: parsed.detail || "",
      extra: parsed.extra || "",
      profile: spec.profile,
    });
  } catch {
    write({
      type: "result",
      provider: spec.name,
      status: "unverified",
      http: r.status,
      reason: "response format could not be verified",
      profile: spec.profile,
    });
  }
}

async function runRecon(username: string, write: WriteFn) {
  const enc = encodeURIComponent(username);
  const lower = username.toLowerCase();

  const specs: ProviderSpec[] = [
    {
      name: "GitHub",
      url: `https://api.github.com/users/${enc}`,
      profile: `https://github.com/${enc}`,
      miss: (r) => r.status === 404,
      parse: (d) => {
        const u = d as { login?: string; type?: string; public_repos?: number } | null;
        return {
          exists: !!(u && u.login),
          detail: u?.login ? `@${u.login} (${u.type || "User"})` : "",
          extra: u?.public_repos != null ? `public repos: ${u.public_repos}` : "",
        };
      },
    },
    {
      name: "GitLab",
      url: `https://gitlab.com/api/v4/users?username=${enc}`,
      profile: `https://gitlab.com/${enc}`,
      parse: (d) => {
        const arr = Array.isArray(d) ? (d as { username?: string }[]) : [];
        const hit = arr.find((x) => String(x.username || "").toLowerCase() === lower);
        return { exists: !!hit, detail: hit ? `@${hit.username}` : "" };
      },
    },
    {
      name: "Bluesky",
      url: `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${enc}`,
      profile: `https://bsky.app/profile/${enc}`,
      miss: (r) => r.status === 400 || r.status === 404,
      parse: (d) => {
        const u = d as { handle?: string; displayName?: string } | null;
        return {
          exists: !!(u && u.handle),
          detail: u?.handle ? `@${u.handle}` : "",
          extra: u?.displayName ? `display: ${u.displayName}` : "",
        };
      },
    },
    {
      name: "Keybase",
      url: `https://keybase.io/_/api/1.0/user/lookup.json?usernames=${enc}&fields=basics,proofs_summary`,
      profile: `https://keybase.io/${enc}`,
      parse: (d) => {
        const them = Array.isArray((d as { them?: unknown[] })?.them)
          ? ((d as { them: Record<string, unknown>[] }).them)
          : [];
        const hit = them.find((x) => {
          const basics = x?.basics as { username?: string } | undefined;
          return basics && String(basics.username || "").toLowerCase() === lower;
        });
        const proofs = (hit?.proofs_summary as { all?: unknown[] })?.all?.length;
        const basics = hit?.basics as { username?: string } | undefined;
        return {
          exists: !!hit,
          detail: basics ? `@${basics.username}` : "",
          extra: Number.isInteger(proofs) ? `public identity proofs: ${proofs}` : "",
        };
      },
    },
    {
      name: "Reddit",
      url: `https://www.reddit.com/user/${enc}/about.json?raw_json=1`,
      profile: `https://www.reddit.com/user/${enc}/`,
      miss: (r) => r.status === 404,
      parse: (d) => {
        const name = (d as { data?: { name?: string } })?.data?.name;
        return {
          exists: !!(name && String(name).toLowerCase() === lower),
          detail: name ? `@${name}` : "",
        };
      },
    },
  ];

  const tasks: Promise<void>[] = specs.map((s) => checkProvider(s, write));

  // npm maintainer evidence check
  tasks.push(
    (async () => {
      write({ type: "checking", provider: "npm" });
      const npmUrl = `https://registry.npmjs.org/-/v1/search?text=maintainer:${enc}&size=20`;
      const r = await getJson(npmUrl);
      if (r.error) {
        write({ type: "result", provider: "npm", status: "unverified", reason: r.error });
        return;
      }
      if (!r.ok) {
        write({
          type: "result",
          provider: "npm",
          status: "unverified",
          http: r.status,
          reason: "registry response unavailable; not treated as a miss",
        });
        return;
      }
      const objects = Array.isArray((r.data as { objects?: unknown[] })?.objects)
        ? ((r.data as { objects: Record<string, unknown>[] }).objects)
        : [];
      const exact = objects.filter((o) => {
        const pkg = o?.package as { maintainers?: { username?: string }[] } | undefined;
        return (pkg?.maintainers || []).some(
          (m) => String(m.username || "").toLowerCase() === lower,
        );
      });
      write({
        type: "result",
        provider: "npm",
        status: exact.length ? "evidence" : "none",
        http: r.status,
        count: exact.length,
        packages: exact
          .slice(0, 10)
          .map((o) => (o.package as { name?: string })?.name)
          .filter(Boolean),
      });
    })(),
  );

  await Promise.allSettled(tasks);
  write({ type: "done" });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = (searchParams.get("username") || "").trim().replace(/^@+/, "");
  if (!validUsername(username)) {
    return Response.json(
      {
        error:
          "Invalid username. Use 2-64 letters, numbers, dots, underscores, or hyphens.",
      },
      { status: 400 },
    );
  }
  return ndjsonStream(
    (write) => runRecon(username, write),
    (write) =>
      write({
        type: "meta",
        username,
        mode: "server-side public API verification",
        note: "A confirmed result means the provider itself returned an exact matching public account. HTTP errors are never converted into misses.",
      }),
  );
}
