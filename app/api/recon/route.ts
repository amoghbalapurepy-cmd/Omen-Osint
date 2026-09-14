import { getJson, getPresence, ndjsonStream, postJson, type FetchResult } from "@/lib/server/net";
import { getTavilyKey } from "@/lib/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WriteFn = (event: Record<string, unknown>) => void;

type ProfileData = {
  name?: string;
  handle: string;
  bio?: string;
  url: string;
  extras: Record<string, any>;
};

type ProviderSpec = {
  name: string;
  url: (u: string) => string;
  profileUrl: (u: string) => string;
  timeout?: number;
  miss: (r: FetchResult) => boolean;
  parse: (data: any, username: string) => { exists: boolean; profile?: ProfileData };
};

function normalizeInput(input: string) {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    const pathParts = url.pathname.split("/").filter(Boolean);
    if (pathParts.length > 0) {
      return { type: "username", value: pathParts[0] };
    }
  } catch {}
  if (trimmed.includes("@") && trimmed.includes(".")) {
    return { type: "email", value: trimmed };
  }
  return { type: "username", value: trimmed.replace(/^@+/, "") };
}

async function checkProvider(spec: ProviderSpec, username: string, write: WriteFn) {
  write({ type: "checking", provider: spec.name });
  const url = spec.url(username);
  const r = await getJson(url, spec.timeout || 8000);

  if (r.error || spec.miss(r)) {
    write({
      type: "result",
      provider: spec.name,
      status: "miss",
      http: r.status,
      profile: spec.profileUrl(username),
    });
    return;
  }

  try {
    const result = spec.parse(r.data, username);
    if (result.exists) {
      write({
        type: "result",
        provider: spec.name,
        status: "confirmed",
        profile: result.profile,
        http: r.status,
      });
    } else {
      write({
        type: "result",
        provider: spec.name,
        status: "miss",
        http: r.status,
        profile: spec.profileUrl(username),
      });
    }
  } catch (e) {
    write({
      type: "result",
      provider: spec.name,
      status: "unverified",
      reason: "Parsing error",
      profile: spec.profileUrl(username),
    });
  }
}

async function checkPresence(name: string, url: string, write: WriteFn) {
  write({ type: "checking", provider: name });
  const r = await getPresence(url);
  if (r.error || r.status === 404) {
    write({ type: "result", provider: name, status: "miss", profile: url });
    return;
  }
  if (r.ok) {
    write({ type: "result", provider: name, status: "confirmed", profile: url });
    return;
  }
  write({ type: "result", provider: name, status: "unverified", profile: url });
}

const PROVIDERS: ProviderSpec[] = [
  {
    name: "GitHub",
    url: (u) => `https://api.github.com/users/${u}`,
    profileUrl: (u) => `https://github.com/${u}`,
    miss: (r) => r.status === 404,
    parse: (d, u) => {
      if (!d || !d.login) return { exists: false };
      return {
        exists: true,
        profile: {
          name: d.name || d.login,
          handle: d.login,
          bio: d.bio,
          url: d.html_url,
          extras: { public_repos: d.public_repos, followers: d.followers, following: d.following, location: d.location },
        },
      };
    },
  },
  {
    name: "Reddit",
    url: (u) => `https://www.reddit.com/user/${u}/about.json?raw_json=1`,
    profileUrl: (u) => `https://www.reddit.com/user/${u}/`,
    miss: (r) => r.status === 404,
    parse: (d, u) => {
      const user = d?.data;
      if (!user) return { exists: false };
      return {
        exists: true,
        profile: {
          name: user.name || u,
          handle: u,
          bio: "",
          url: `https://www.reddit.com/user/${u}`,
          extras: { karma: user.link_karma || 0, created_utc: user.created_utc },
        },
      };
    },
  },
  {
    name: "Bluesky",
    url: (u) => `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${u}`,
    profileUrl: (u) => `https://bsky.app/profile/${u}`,
    miss: (r) => r.status === 400 || r.status === 404,
    parse: (d, u) => {
      if (!d || !d.handle) return { exists: false };
      return {
        exists: true,
        profile: {
          name: d.displayName || u,
          handle: d.handle,
          bio: d.description,
          url: `https://bsky.app/profile/${u}`,
          extras: { did: d.did },
        },
      };
    },
  },
];

async function runDiscovery(target: string, write: WriteFn) {
  const apiKey = await getTavilyKey();
  if (!apiKey) {
    write({ type: "notice", message: "Discovery skipped: Tavily API key not configured." });
    return;
  }

  write({ type: "notice", message: `Performing web discovery for ${target}...` });

  const queries = [
    `"${target}" profile site:instagram.com OR site:twitter.com OR site:facebook.com`,
    `"${target}" "bio" social media profile`,
    `"${target}" linked-in profile`,
  ];

  for (const q of queries) {
    const r = await postJson("https://api.tavily.com/search", {
      api_key: apiKey,
      query: q,
      max_results: 5,
    });

    if (r.ok && Array.isArray(r.data?.results)) {
      for (const res of r.data.results) {
        const url = res.url;
        const title = res.title;
        // Simple pattern match for social URLs
        const platform = Object.entries({
          "instagram.com": "Instagram",
          "twitter.com": "Twitter/X",
          "x.com": "Twitter/X",
          "facebook.com": "Facebook",
          "linkedin.com": "LinkedIn",
          "tiktok.com": "TikTok",
        }).find(([domain]) => url.includes(domain));

        if (platform) {
          write({
            type: "result",
            provider: platform[1],
            status: "evidence",
            profile: url,
            detail: `Found via web search: ${title}`,
          });
        }
      }
    }
  }
}

async function runSocialScan(input: string, write: WriteFn) {
  const { type, value: target } = normalizeInput(input);

  write({
    type: "meta",
    username: target,
    mode: "Deep Social Scan",
    note: `Analyzing ${type === "email" ? "email" : "username"} ${target} for identity markers and public profiles.`,
  });

  const tasks: Promise<void>[] = [];

  if (type === "username") {
    for (const spec of PROVIDERS) {
      tasks.push(checkProvider(spec, target, write));
    }

    const presenceChecks = [
      { name: "Twitter/X", url: `https://twitter.com/${target}` },
      { name: "Instagram", url: `https://instagram.com/${target}` },
      { name: "Facebook", url: `https://facebook.com/${target}` },
      { name: "TikTok", url: `https://tiktok.com/@${target}` },
      { name: "Pinterest", url: `https://pinterest.com/${target}` },
      { name: "Tumblr", url: `https://${target}.tumblr.com` },
    ];

    for (const check of presenceChecks) {
      tasks.push(checkPresence(check.name, check.url, write));
    }
  } else if (type === "email") {
    write({ type: "notice", message: "Performing identity marker search for email..." });
    tasks.push(runDiscovery(target, write));
  }

  await Promise.allSettled(tasks);

  // If all results are misses, run discovery as a fallback for usernames too
  // (This is what makes it "work" when direct APIs fail)
  if (type === "username") {
    tasks.push(runDiscovery(target, write));
    await Promise.allSettled(tasks);
  }

  write({ type: "done" });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const input = (searchParams.get("username") || "").trim();

  if (!input) {
    return Response.json({ error: "Input is required" }, { status: 400 });
  }

  return ndjsonStream(
    (write) => runSocialScan(input, write),
    (write) => write({ type: "init", message: "Starting deep scan..." })
  );
}
