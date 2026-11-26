/**
 * Network layer for depvibe.
 *
 * Fetches package metadata from npm and GitHub.
 * Uses Node 18+ built-in fetch. No dependencies.
 *
 * Rate limits: GitHub 60 req/hr unauthenticated, 5000/hr with token.
 * Token: set GITHUB_TOKEN env var.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;

function githubHeaders() {
  const h = { "User-Agent": "depvibe", Accept: "application/vnd.github.v3+json" };
  if (GITHUB_TOKEN) h.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return h;
}

/**
 * Fetch npm package metadata.
 * @param {string} pkg - package name (e.g. "express" or "@scope/pkg")
 * @returns {Promise<{name, version, license, repository, description, homepage, time}>}
 */
export async function fetchNpm(pkg) {
  const url = `https://registry.npmjs.org/${encodeURIComponent(pkg).replace(/%40/g, "@")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`npm: ${res.status} ${res.statusText} for ${pkg}`);
  const data = await res.json();
  const latest = data["dist-tags"]?.latest;
  const info = data.versions?.[latest] || {};
  return {
    name: data.name || pkg,
    version: latest || "unknown",
    license: info.license || data.license || null,
    description: info.description || data.description || "",
    repository: info.repository?.url || data.repository?.url || null,
    homepage: info.homepage || data.homepage || null,
    time: data.time?.modified || null,
    dependencies: info.dependencies || {},
  };
}

/**
 * Parse a GitHub repo URL or "owner/repo" string into {owner, repo}.
 */
export function parseGitHubRepo(input) {
  if (!input) return null;
  // "owner/repo"
  if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(input)) {
    const [owner, repo] = input.split("/");
    return { owner, repo: repo.replace(/\.git$/, "") };
  }
  // URL
  const m = input.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (m) return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
  return null;
}

/**
 * Fetch GitHub repo metadata.
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<{pushed_at, open_issues_count, stargazers_count, forks_count, license, default_branch, archived, description}>}
 */
export async function fetchGitHub(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) throw new Error(`github: ${res.status} ${res.statusText} for ${owner}/${repo}`);
  const data = await res.json();
  return {
    pushed_at: data.pushed_at,
    open_issues_count: data.open_issues_count ?? 0,
    stargazers_count: data.stargazers_count ?? 0,
    forks_count: data.forks_count ?? 0,
    license: data.license?.spdx_id || null,
    default_branch: data.default_branch || "main",
    archived: data.archived || false,
    description: data.description || "",
    html_url: data.html_url,
  };
}

/**
 * Fetch recent issues (not PRs) to compute response time.
 * @param {string} owner
 * @param {string} repo
 * @param {number} [limit=30]
 * @returns {Promise<Array<{created_at, closed_at, first_response_at?}>>}
 */
export async function fetchIssues(owner, repo, limit = 10) {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=${limit}&sort=created&direction=desc`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) throw new Error(`github issues: ${res.status} ${res.statusText}`);
  const data = await res.json();
  const issues = data.filter((i) => !i.pull_request);

  // Fetch first comment timestamp for issues that have comments (best-effort, capped)
  const withComments = issues.filter((i) => i.comments > 0).slice(0, 5);
  const commentPromises = withComments.map(async (issue) => {
    try {
      const cRes = await fetch(issue.comments_url + "?per_page=1", { headers: githubHeaders() });
      if (!cRes.ok) return null;
      const comments = await cRes.json();
      if (Array.isArray(comments) && comments.length > 0) {
        return { issueNumber: issue.number, firstCommentAt: comments[0].created_at };
      }
    } catch {
      return null;
    }
    return null;
  });

  const commentResults = await Promise.allSettled(commentPromises);
  const commentMap = new Map();
  for (const r of commentResults) {
    if (r.status === "fulfilled" && r.value) {
      commentMap.set(r.value.issueNumber, r.value.firstCommentAt);
    }
  }

  return issues.map((i) => ({
    created_at: i.created_at,
    closed_at: i.closed_at,
    first_response_at: commentMap.get(i.number) || null,
  }));
}

/**
 * Fetch latest release date.
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<string|null>} ISO date string or null
 */
export async function fetchLatestRelease(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`github release: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.published_at || data.created_at || null;
}

/**
 * Full network check: npm + GitHub.
 * @param {string} pkg - npm package name or "owner/repo"
 * @returns {Promise<{npm, github, issues, release, repo}>}
 */
export async function networkCheck(pkg) {
  const result = { npm: null, github: null, issues: [], release: null, repo: null, errors: [] };

  // Try npm first
  let repoInfo = null;
  try {
    result.npm = await fetchNpm(pkg);
    repoInfo = parseGitHubRepo(result.npm.repository);
  } catch (e) {
    result.errors.push(`npm: ${e.message}`);
  }

  // If no npm result or no repo, try parsing pkg as owner/repo
  if (!repoInfo) repoInfo = parseGitHubRepo(pkg);

  if (repoInfo) {
    result.repo = `${repoInfo.owner}/${repoInfo.repo}`;
    try {
      result.github = await fetchGitHub(repoInfo.owner, repoInfo.repo);
    } catch (e) {
      result.errors.push(`github: ${e.message}`);
    }
    try {
      result.issues = await fetchIssues(repoInfo.owner, repoInfo.repo);
    } catch (e) {
      result.errors.push(`issues: ${e.message}`);
    }
    try {
      result.release = await fetchLatestRelease(repoInfo.owner, repoInfo.repo);
    } catch (e) {
      result.errors.push(`release: ${e.message}`);
    }
  }

  return result;
}
