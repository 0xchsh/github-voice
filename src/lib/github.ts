export type Release = {
  tagName: string
  name: string | null
  body: string | null
  publishedAt: string
}

export type Commit = {
  sha: string
  message: string
  authorName: string
  date: string
}

export type PullRequest = {
  number: number
  title: string
  body: string | null
  mergedAt: string
  authorLogin: string
}

export type Issue = {
  number: number
  title: string
  body: string | null
  closedAt: string | null
  authorLogin: string
  labels: string[]
}

export type RepoData = {
  name: string
  fullName: string
  description: string | null
  stars: number
  defaultBranch: string
  releases: Release[]
  commits: Commit[]
  pullRequests: PullRequest[]
  issues: Issue[]
  changelog: string | null
}

function githubFetch(path: string) {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  const token = process.env.GITHUB_TOKEN
  if (token) headers["Authorization"] = `Bearer ${token}`

  return fetch(`https://api.github.com${path}`, { headers, next: { revalidate: 60 } })
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url)
    if (u.hostname !== "github.com") return null
    const parts = u.pathname.replace(/^\//, "").split("/")
    if (parts.length < 2) return null
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") }
  } catch {
    return null
  }
}

export async function fetchRepoData(owner: string, repo: string): Promise<RepoData> {
  const [repoRes, releasesRes, commitsRes, prsRes, issuesRes] = await Promise.all([
    githubFetch(`/repos/${owner}/${repo}`),
    githubFetch(`/repos/${owner}/${repo}/releases?per_page=10`),
    githubFetch(`/repos/${owner}/${repo}/commits?per_page=100`),
    githubFetch(`/repos/${owner}/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=100`),
    githubFetch(`/repos/${owner}/${repo}/issues?state=all&sort=updated&direction=desc&per_page=100`),
  ])

  if (!repoRes.ok) {
    if (repoRes.status === 404) throw new Error("Repository not found")
    if (repoRes.status === 403 || repoRes.status === 429)
      throw new Error("GitHub rate limit hit — add a GITHUB_TOKEN to .env.local to increase it")
    throw new Error(`Failed to fetch repository (HTTP ${repoRes.status})`)
  }

  const repoJson = await repoRes.json()

  const releases: Release[] = releasesRes.ok
    ? (await releasesRes.json()).map((r: Record<string, unknown>) => ({
        tagName: r.tag_name as string,
        name: r.name as string | null,
        body: r.body as string | null,
        publishedAt: r.published_at as string,
      }))
    : []

  const commits: Commit[] = commitsRes.ok
    ? (await commitsRes.json()).map((c: Record<string, unknown>) => {
        const commit = c.commit as Record<string, unknown>
        const author = commit.author as Record<string, unknown>
        return {
          sha: (c.sha as string).slice(0, 7),
          message: (commit.message as string).split("\n")[0],
          authorName: author.name as string,
          date: author.date as string,
        }
      })
    : []

  const pullRequests: PullRequest[] = prsRes.ok
    ? (await prsRes.json())
        .filter((pr: Record<string, unknown>) => pr.merged_at !== null)
        .map((pr: Record<string, unknown>) => ({
          number: pr.number as number,
          title: pr.title as string,
          body: pr.body ? (pr.body as string).slice(0, 400) : null,
          mergedAt: pr.merged_at as string,
          authorLogin: (pr.user as Record<string, unknown>).login as string,
        }))
    : []

  // Issues endpoint returns both issues and PRs — filter out PRs (they have pull_request key)
  const issues: Issue[] = issuesRes.ok
    ? (await issuesRes.json())
        .filter((i: Record<string, unknown>) => !i.pull_request)
        .map((i: Record<string, unknown>) => ({
          number: i.number as number,
          title: i.title as string,
          body: i.body ? (i.body as string).slice(0, 400) : null,
          closedAt: (i.closed_at as string | null) ?? null,
          authorLogin: (i.user as Record<string, unknown>).login as string,
          labels: ((i.labels as Array<Record<string, unknown>>) ?? []).map((l) => l.name as string),
        }))
    : []

  // Try to find CHANGELOG file
  let changelog: string | null = null
  const changelogFiles = ["CHANGELOG.md", "CHANGELOG", "CHANGES.md", "HISTORY.md"]
  for (const file of changelogFiles) {
    const res = await githubFetch(`/repos/${owner}/${repo}/contents/${file}`)
    if (res.ok) {
      const json = await res.json()
      if (json.content) {
        changelog = Buffer.from(json.content, "base64").toString("utf-8").slice(0, 3000)
      }
      break
    }
  }

  return {
    name: repoJson.name,
    fullName: repoJson.full_name,
    description: repoJson.description,
    stars: repoJson.stargazers_count,
    defaultBranch: repoJson.default_branch,
    releases,
    commits,
    pullRequests,
    issues,
    changelog,
  }
}
