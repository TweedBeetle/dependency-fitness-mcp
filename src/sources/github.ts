/**
 * GitHub repo-status client — catches "deceptive deprecation": a package the
 * registry still reports as active whose source repo is archived or long-stale.
 * Best-effort and unauthenticated by default (60 req/hr); set GITHUB_TOKEN to
 * raise the limit. A failure degrades confidence, never fails the verdict.
 */

export interface GithubResult {
  ok: boolean;
  archived: boolean | null;
  pushedAt: string | null;
  staleMonths: number | null;
  reason: string | null;
}

const FAIL = (reason: string): GithubResult => ({
  ok: false,
  archived: null,
  pushedAt: null,
  staleMonths: null,
  reason,
});

export function parseRepo(url: string | null): { owner: string; repo: string } | null {
  if (!url) return null;
  const m = url.match(/github\.com[/:]([^/]+)\/([^/#]+?)(?:\.git)?(?:[/#?].*)?$/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

export async function fetchGithub(
  repoUrl: string | null,
  now: Date,
  signal?: AbortSignal,
): Promise<GithubResult> {
  const parsed = parseRepo(repoUrl);
  if (!parsed) return FAIL("no GitHub repository in package metadata");

  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": "dependency-fitness-mcp",
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, { headers, signal });
  } catch (e) {
    return FAIL(`github request failed: ${(e as Error).message}`);
  }
  if (res.status === 403 || res.status === 429) {
    return FAIL("github rate-limited (set GITHUB_TOKEN to raise the limit)");
  }
  if (res.status === 404) return FAIL("github repo not found (renamed or deleted)");
  if (!res.ok) return FAIL(`github returned ${res.status}`);

  const d = (await res.json()) as Record<string, any>;
  const pushedAt: string | null = typeof d.pushed_at === "string" ? d.pushed_at : null;
  let staleMonths: number | null = null;
  if (pushedAt) {
    const ms = now.getTime() - new Date(pushedAt).getTime();
    staleMonths = Math.floor(ms / (1000 * 60 * 60 * 24 * 30.44));
  }
  return {
    ok: true,
    archived: typeof d.archived === "boolean" ? d.archived : null,
    pushedAt,
    staleMonths,
    reason: null,
  };
}
