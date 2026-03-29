import { NextRequest, NextResponse } from "next/server"
import type { PullRequest, Commit, Issue } from "@/lib/github"

function githubFetch(path: string) {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  const token = process.env.GITHUB_TOKEN
  if (token) headers["Authorization"] = `Bearer ${token}`
  return fetch(`https://api.github.com${path}`, { headers })
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const owner = searchParams.get("owner")
  const repo = searchParams.get("repo")
  const type = searchParams.get("type") as "prs" | "issues" | "commits" | null
  const page = parseInt(searchParams.get("page") ?? "2", 10)

  if (!owner || !repo || !type) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  if (type === "prs") {
    const res = await githubFetch(
      `/repos/${owner}/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=100&page=${page}`
    )
    if (!res.ok) return NextResponse.json({ items: [] })
    const data = await res.json()
    const items: PullRequest[] = data
      .filter((pr: Record<string, unknown>) => pr.merged_at !== null)
      .map((pr: Record<string, unknown>) => ({
        number: pr.number as number,
        title: pr.title as string,
        body: pr.body ? (pr.body as string).slice(0, 400) : null,
        mergedAt: pr.merged_at as string,
        authorLogin: (pr.user as Record<string, unknown>).login as string,
      }))
    return NextResponse.json({ items, hasMore: data.length === 100 })
  }

  if (type === "issues") {
    const res = await githubFetch(
      `/repos/${owner}/${repo}/issues?state=all&sort=updated&direction=desc&per_page=100&page=${page}`
    )
    if (!res.ok) return NextResponse.json({ items: [] })
    const data = await res.json()
    const items: Issue[] = data
      .filter((i: Record<string, unknown>) => !i.pull_request)
      .map((i: Record<string, unknown>) => ({
        number: i.number as number,
        title: i.title as string,
        body: i.body ? (i.body as string).slice(0, 400) : null,
        closedAt: (i.closed_at as string | null) ?? null,
        authorLogin: (i.user as Record<string, unknown>).login as string,
        labels: ((i.labels as Array<Record<string, unknown>>) ?? []).map((l) => l.name as string),
      }))
    return NextResponse.json({ items, hasMore: data.length === 100 })
  }

  if (type === "commits") {
    const res = await githubFetch(
      `/repos/${owner}/${repo}/commits?per_page=100&page=${page}`
    )
    if (!res.ok) return NextResponse.json({ items: [] })
    const data = await res.json()
    const items: Commit[] = data.map((c: Record<string, unknown>) => {
      const commit = c.commit as Record<string, unknown>
      const author = commit.author as Record<string, unknown>
      return {
        sha: (c.sha as string).slice(0, 7),
        message: (commit.message as string).split("\n")[0],
        authorName: author.name as string,
        date: author.date as string,
      }
    })
    return NextResponse.json({ items, hasMore: data.length === 100 })
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 })
}
