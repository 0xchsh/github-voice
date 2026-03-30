"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MagnifyingGlass, ArrowRight, Star, TrendUp } from "@phosphor-icons/react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { parseGitHubUrl } from "@/lib/github"
import type { TrendingRepo } from "@/app/api/trending/route"

const GITHUB_URL_RE = /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/

const CARD_COLORS = [
  "bg-red-200",
  "bg-orange-200",
  "bg-amber-200",
  "bg-yellow-200",
  "bg-lime-200",
  "bg-green-200",
  "bg-teal-200",
  "bg-cyan-200",
  "bg-sky-200",
  "bg-blue-200",
  "bg-violet-200",
  "bg-pink-200",
]

function getCardColor(index: number): string {
  // Ensure no two adjacent cards share the same color
  let i = index % CARD_COLORS.length
  if (i === (index - 1 < 0 ? -1 : (index - 1) % CARD_COLORS.length)) {
    i = (i + 1) % CARD_COLORS.length
  }
  return CARD_COLORS[i]
}

function RepoCard({ repo, onClick, index }: { repo: TrendingRepo; onClick: () => void; index: number }) {
  const [owner, repoName] = repo.fullName.split("/")
  const bgColor = getCardColor(index)
  const avatarUrl = `https://avatars.githubusercontent.com/${owner}`

  return (
    <button
      onClick={onClick}
      className="text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-xl"
    >
      {/* Album cover */}
      <div
        className={`relative w-full aspect-square rounded-xl overflow-hidden mb-3 transition-transform duration-200 group-hover:scale-[1.02] ${bgColor}`}
      >
        {/* Blurred background avatar */}
        <div className="absolute inset-0 scale-150">
          <Image
            src={avatarUrl}
            alt=""
            fill
            className="object-cover blur-2xl opacity-60"
            sizes="30vw"
            unoptimized
          />
        </div>

        {/* Owner avatar — centered */}
        <div className="absolute inset-0 flex items-center justify-center -translate-y-3">
          <div className="relative size-[38%] rounded-full overflow-hidden shadow-2xl">
            <Image
              src={avatarUrl}
              alt={owner}
              fill
              className="object-cover"
              sizes="30vw"
              unoptimized
            />
          </div>
        </div>

        {/* Repo name bottom-left */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-lg font-black leading-tight text-white drop-shadow truncate">
            /{repoName}
          </p>
        </div>
      </div>

      {/* Below card: owner + stars */}
      <div className="space-y-0.5 px-0.5">
        <p className="text-xs text-muted-foreground truncate">{owner}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star weight="fill" className="size-3 text-amber-400" />
          {repo.stars.toLocaleString()}
        </div>
      </div>
    </button>
  )
}

export default function ExplorePage() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [repos, setRepos] = useState<TrendingRepo[]>([])
  const [loading, setLoading] = useState(true)
  const isValid = GITHUB_URL_RE.test(url)

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then((data) => { if (data.repos) setRepos(data.repos) })
      .finally(() => setLoading(false))
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseGitHubUrl(url)
    if (!parsed) return
    router.push(`/r/${parsed.owner}/${parsed.repo}`)
  }

  function openRepo(fullName: string) {
    const [owner, repo] = fullName.split("/")
    router.push(`/r/${owner}/${repo}`)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Explore</h1>
        <p className="text-sm text-muted-foreground">
          Paste a GitHub URL or browse what&apos;s trending this week.
        </p>
      </div>

      {/* URL input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="url"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-8"
            autoFocus
          />
        </div>
        <Button type="submit" disabled={!isValid}>
          <ArrowRight data-icon="inline-end" />
          Open repo
        </Button>
      </form>

      {/* Trending grid */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <TrendUp className="size-4 text-muted-foreground" />
          Trending this week
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="w-full aspect-square rounded-xl bg-muted" />
                <div className="space-y-1.5 px-0.5">
                  <div className="h-3.5 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {repos.map((repo, i) => (
              <RepoCard
                key={repo.fullName}
                repo={repo}
                index={i}
                onClick={() => openRepo(repo.fullName)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
