const API = "https://api.github.com";

export type GhRepo = {
  full_name: string;
  name: string;
  owner: { login: string };
  html_url: string;
  homepage: string | null;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  license: { spdx_id: string | null } | null;
  topics?: string[];
  language: string | null;
  default_branch: string;
  pushed_at: string;
  archived: boolean;
  fork: boolean;
};

type GqlRepo = {
  nameWithOwner: string;
  name: string;
  url: string;
  homepageUrl: string | null;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  isArchived: boolean;
  isFork: boolean;
  pushedAt: string;
  owner: { login: string };
  licenseInfo: { spdxId: string | null } | null;
  primaryLanguage: { name: string } | null;
  defaultBranchRef: { name: string } | null;
  repositoryTopics: { nodes: { topic: { name: string } }[] };
};

export type GhTreeEntry = { path: string; type: "blob" | "tree"; size?: number };

export class GitHub {
  constructor(private token = process.env.GITHUB_TOKEN) {}

  private async api<T>(path: string, init?: RequestInit): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(`${API}${path}`, {
        ...init,
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "airsc-crawler",
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          ...init?.headers,
        },
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) return (await res.json()) as T;
      if (res.status === 403 || res.status === 429) {
        const reset = Number(res.headers.get("x-ratelimit-reset") ?? 0) * 1000;
        const retryAfter = Number(res.headers.get("retry-after") ?? 0) * 1000;
        const wait = Math.min(Math.max(retryAfter, reset - Date.now(), 2000), 65_000);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw new Error(`GitHub ${res.status} ${path}`);
    }
    throw new Error(`GitHub rate limited: ${path}`);
  }

  async searchRepos(q: string, pages = 1): Promise<GhRepo[]> {
    const out: GhRepo[] = [];
    for (let page = 1; page <= pages; page++) {
      const data = await this.api<{ items: GhRepo[] }>(
        `/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=100&page=${page}`,
      );
      out.push(...data.items);
      if (data.items.length < 100) break;
    }
    return out;
  }

  async tree(fullName: string, branch: string): Promise<{ sha: string; entries: GhTreeEntry[] }> {
    const data = await this.api<{ sha: string; tree: GhTreeEntry[] }>(
      `/repos/${fullName}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    );
    return { sha: data.sha, entries: data.tree };
  }

  /** Code search returns files; we only need the distinct repositories (requires a token) */
  async searchCodeRepos(q: string, pages = 1): Promise<string[]> {
    const repos = new Set<string>();
    for (let page = 1; page <= pages; page++) {
      const data = await this.api<{ items: { repository: { full_name: string } }[] }>(
        `/search/code?q=${encodeURIComponent(q)}&per_page=100&page=${page}`,
      );
      data.items.forEach((i) => repos.add(i.repository.full_name));
      if (data.items.length < 100) break;
    }
    return [...repos];
  }

  /** Batch repo metadata through GraphQL: 50 repos per request, a few requests in parallel */
  async reposByName(fullNames: string[], concurrency = 4): Promise<GhRepo[]> {
    const chunks: string[][] = [];
    for (let i = 0; i < fullNames.length; i += 50) chunks.push(fullNames.slice(i, i + 50));
    const out: GhRepo[] = [];
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(concurrency, chunks.length) }, async () => {
        while (next < chunks.length) out.push(...(await this.gqlRepos(chunks[next++])));
      }),
    );
    return out;
  }

  private async gqlRepos(chunk: string[]): Promise<GhRepo[]> {
    const fields =
      "nameWithOwner name url homepageUrl description stargazerCount forkCount isArchived isFork pushedAt " +
      "owner { login } licenseInfo { spdxId } primaryLanguage { name } defaultBranchRef { name } " +
      "repositoryTopics(first: 20) { nodes { topic { name } } }";
    const query = `query { ${chunk
      .map((fn, j) => {
        const [owner, name] = fn.split("/");
        return `r${j}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { ${fields} }`;
      })
      .join("\n")} }`;
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json", "User-Agent": "airsc-crawler" },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`);
    const { data } = (await res.json()) as { data: Record<string, GqlRepo | null> | null };
    return Object.values(data ?? {})
      .filter((r): r is GqlRepo => !!r) // renamed, deleted or private repos come back null
      .map((r) => ({
        full_name: r.nameWithOwner,
        name: r.name,
        owner: { login: r.owner.login },
        html_url: r.url,
        homepage: r.homepageUrl,
        description: r.description,
        stargazers_count: r.stargazerCount,
        forks_count: r.forkCount,
        license: r.licenseInfo ? { spdx_id: r.licenseInfo.spdxId } : null,
        topics: r.repositoryTopics.nodes.map((n) => n.topic.name),
        language: r.primaryLanguage?.name ?? null,
        default_branch: r.defaultBranchRef?.name ?? "main",
        pushed_at: r.pushedAt,
        archived: r.isArchived,
        fork: r.isFork,
      }));
  }

  /** raw.githubusercontent.com does not count against the REST rate limit */
  async raw(fullName: string, branch: string, path: string, maxBytes = 200_000): Promise<string | null> {
    const res = await fetch(
      `https://raw.githubusercontent.com/${fullName}/${encodeURIComponent(branch)}/${path
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
      { headers: { "User-Agent": "airsc-crawler" }, signal: AbortSignal.timeout(20_000) },
    );
    if (!res.ok) return null;
    const text = await res.text();
    return text.length > maxBytes ? text.slice(0, maxBytes) : text;
  }
}
