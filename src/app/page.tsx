"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GithubLogo, ArrowRight, Clock } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { parseGitHubUrl } from "@/lib/github"

const GITHUB_URL_RE = /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/
const HISTORY_KEY = "gitwave_history"
const HISTORY_MAX = 6

type HistoryItem = {
  fullName: string
  description: string | null
  visitedAt: string
}

function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")
  } catch {
    return []
  }
}

export function addToHistory(item: Omit<HistoryItem, "visitedAt">) {
  const current = getHistory().filter((i) => i.fullName !== item.fullName)
  const next = [{ ...item, visitedAt: new Date().toISOString() }, ...current].slice(
    0,
    HISTORY_MAX
  )
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}

export default function Home() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [history, setHistory] = useState<HistoryItem[]>([])

  const isValidUrl = GITHUB_URL_RE.test(url)

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidUrl) return
    const parsed = parseGitHubUrl(url)
    if (!parsed) return
    router.push(`/r/${parsed.owner}/${parsed.repo}`)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
      {/* Greeting */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Good evening</h1>
        <p className="text-sm text-muted-foreground">
          Paste a GitHub URL to start listening to a repo&apos;s changelog.
        </p>
      </div>

      {/* Search / paste URL */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <GithubLogo className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="url"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-8"
            autoFocus
          />
        </div>
        <Button type="submit" disabled={!isValidUrl}>
          <ArrowRight data-icon="inline-end" />
          Open repo
        </Button>
      </form>

      {/* Recently played */}
      {history.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="size-4 text-muted-foreground" />
            Recently played
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((item) => {
              const [owner, repo] = item.fullName.split("/")
              return (
                <button
                  key={item.fullName}
                  onClick={() => router.push(`/r/${owner}/${repo}`)}
                  className={cn(
                    "text-left rounded-xl border border-border bg-card p-4",
                    "hover:bg-muted/50 transition-colors group"
                  )}
                >
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-foreground">
                    {item.fullName}
                  </p>
                  {item.description ? (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground italic">No description</p>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {history.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">No recent repos yet</p>
          <p className="text-xs text-muted-foreground">
            Paste a GitHub URL above and press Open repo to get started.
          </p>
        </div>
      )}
    </div>
  )
}
