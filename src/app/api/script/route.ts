import { NextRequest, NextResponse } from "next/server"
import type { RepoData } from "@/lib/github"

function buildPrompt(data: RepoData): string {
  const parts: string[] = [`Repository: ${data.fullName}`]

  if (data.pullRequests?.length > 0) {
    parts.push("\n## Merged Pull Request")
    const pr = data.pullRequests[0]
    parts.push(`PR #${pr.number} — ${pr.title} (@${pr.authorLogin}, merged ${new Date(pr.mergedAt).toLocaleDateString()})`)
    if (pr.body) parts.push(pr.body)
  } else if (data.issues?.length > 0) {
    parts.push("\n## Closed Issue")
    const issue = data.issues[0]
    parts.push(`Issue #${issue.number} — ${issue.title} (@${issue.authorLogin}${issue.closedAt ? `, closed ${new Date(issue.closedAt).toLocaleDateString()}` : ""})`)
    if (issue.labels.length) parts.push(`Labels: ${issue.labels.join(", ")}`)
    if (issue.body) parts.push(issue.body)
  } else if (data.releases.length > 0) {
    parts.push("\n## Release")
    const r = data.releases[0]
    parts.push(`${r.tagName}${r.name ? ` — ${r.name}` : ""} (${new Date(r.publishedAt).toLocaleDateString()})`)
    if (r.body) parts.push(r.body.slice(0, 600))
  } else {
    parts.push("\n## Recent Commits")
    for (const c of data.commits.slice(0, 10)) {
      parts.push(`- ${c.sha} ${c.message} (${c.authorName}, ${new Date(c.date).toLocaleDateString()})`)
    }
  }

  return parts.join("\n")
}

function standardOpener(data: RepoData): string {
  if (data.pullRequests?.length > 0) {
    return `PR number ${data.pullRequests[0].number}.`
  }
  if (data.issues?.length > 0) {
    return `Issue number ${data.issues[0].number}.`
  }
  if (data.releases.length > 0) {
    return `${data.releases[0].tagName}.`
  }
  return `${data.name}.`
}

function templateScript(data: RepoData): string {
  const opener = standardOpener(data)
  if (data.pullRequests && data.pullRequests.length > 0) {
    const pr = data.pullRequests[0]
    return `${opener} ${pr.title}${pr.body ? " — " + pr.body.replace(/[#*`]/g, "").slice(0, 200) : "."}`
  }
  const latest = data.releases[0]
  if (latest?.body) {
    return `${opener} ${latest.body.replace(/[#*`]/g, "").slice(0, 300)}`
  }
  return `${opener} ${data.commits.slice(0, 3).map((c) => c.message).join(". ")}.`
}

function buildOverviewPrompt(data: RepoData): string {
  const parts: string[] = [
    `Repository: ${data.fullName}`,
    data.description ? `Description: ${data.description}` : "",
    `Stars: ${data.stars.toLocaleString()}`,
  ]

  if (data.releases.length > 0) {
    parts.push("\n## Recent Releases")
    for (const r of data.releases) {
      parts.push(`${r.tagName} — ${new Date(r.publishedAt).toLocaleDateString()}`)
      if (r.body) parts.push(r.body.slice(0, 400))
    }
  }
  if (data.pullRequests.length > 0) {
    parts.push("\n## Recent Merged PRs")
    for (const pr of data.pullRequests.slice(0, 8)) {
      parts.push(`#${pr.number} ${pr.title} (@${pr.authorLogin})`)
      if (pr.body) parts.push(pr.body.slice(0, 200))
    }
  }
  if (data.commits.length > 0) {
    parts.push("\n## Recent Commits")
    for (const c of data.commits.slice(0, 10)) {
      parts.push(`- ${c.message} (${c.authorName})`)
    }
  }
  return parts.filter(Boolean).join("\n")
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { mode, ...data } = body as RepoData & { mode?: "overview" | "episode" }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ script: templateScript(data) })
  }

  if (mode === "overview") {
    const prompt = buildOverviewPrompt(data)
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://gitwave.app",
        "X-Title": "Gitwave",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content:
              "You are creating a spoken audio overview of a GitHub repository. Your goal is to give the listener a clear picture of what this project actually does, why it exists, and what's been happening lately — not just list facts. Explain things simply, like you're describing it to a smart friend who doesn't code. Highlight what makes this project interesting or useful. Maximum 500 words. Spoken prose only — no bullet points, no markdown.",
          },
          { role: "user", content: prompt },
        ],
      }),
    })
    if (res.ok) {
      const json = await res.json()
      const script = json.choices?.[0]?.message?.content ?? templateScript(data)
      return NextResponse.json({ script })
    }
    return NextResponse.json({ script: templateScript(data) })
  }

  const opener = standardOpener(data)
  const prompt = buildPrompt(data)

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://gitwave.app",
      "X-Title": "Gitwave",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      max_tokens: 350,
      messages: [
        {
          role: "system",
          content:
            "You are creating a short spoken audio summary for a GitHub PR, issue, release, or commit. Your job is to explain what actually matters — not just repeat the title or description. Focus on the real-world impact: what problem does this solve, what changed for users or developers, and why should someone care? Use plain language a high school student could understand. Avoid jargon, acronyms, and technical noise unless you explain them simply. Maximum 250 words. Spoken prose only — no bullet points, no markdown, no headers. You will be given an opener line — always start with it verbatim, then continue naturally.",
        },
        {
          role: "user",
          content: `Start with this exact opener: "${opener}"\n\n${prompt}`,
        },
      ],
    }),
  })

  if (!res.ok) {
    console.error("OpenRouter error:", await res.text())
    return NextResponse.json({ script: templateScript(data) })
  }

  const json = await res.json()
  const script = json.choices?.[0]?.message?.content ?? templateScript(data)
  return NextResponse.json({ script })
}
