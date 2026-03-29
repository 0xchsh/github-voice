import { NextResponse } from "next/server"

export type TrendingRepo = {
  fullName: string
  description: string | null
  stars: number
  language: string | null
  url: string
}

export async function GET() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  const token = process.env.GITHUB_TOKEN
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(
    `https://api.github.com/search/repositories?q=created:>${weekAgo}&sort=stars&order=desc&per_page=20`,
    { headers, next: { revalidate: 3600 } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch trending repos" }, { status: res.status })
  }

  const data = await res.json()
  const repos: TrendingRepo[] = data.items.map((r: Record<string, unknown>) => ({
    fullName: r.full_name as string,
    description: r.description as string | null,
    stars: r.stargazers_count as number,
    language: r.language as string | null,
    url: r.html_url as string,
  }))

  return NextResponse.json({ repos })
}
