import { NextRequest, NextResponse } from "next/server"
import { parseGitHubUrl, fetchRepoData } from "@/lib/github"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  const parsed = parseGitHubUrl(url)
  if (!parsed) {
    return NextResponse.json({ error: "Invalid GitHub repository URL" }, { status: 422 })
  }

  try {
    const data = await fetchRepoData(parsed.owner, parsed.repo)
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch repository"
    const status = message.includes("not found") ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
