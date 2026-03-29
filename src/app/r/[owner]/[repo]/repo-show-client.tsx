"use client"

import { useEffect, useState } from "react"
import { Star, GitBranch, Play, BookmarkSimple, GitMerge, Bug, Tag, ArrowSquareOut } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { RepoData, Release, Commit, PullRequest, Issue } from "@/lib/github"
import { usePlayer } from "@/context/player-context"
import { addToHistory } from "@/app/page"
import { saveToLibrary, removeFromLibrary, isInLibrary } from "@/components/sidebar"

type TabType = "prs" | "issues" | "releases" | "commits"

type EpisodeItem =
  | { kind: "pr"; pr: PullRequest; index: number; total: number }
  | { kind: "issue"; issue: Issue; index: number; total: number }
  | { kind: "release"; release: Release; index: number; total: number }
  | { kind: "commit"; commit: Commit; index: number; total: number }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function EpisodeRow({
  item,
  onPlay,
  isCurrentEpisode,
  isLoading,
  repoFullName,
}: {
  item: EpisodeItem
  onPlay: () => void
  isCurrentEpisode: boolean
  isLoading: boolean
  repoFullName: string
}) {
  const rowClass = cn(
    "flex items-start gap-4 px-4 py-3 rounded-xl border transition-colors group",
    isCurrentEpisode
      ? "border-ring/40 bg-muted"
      : "border-transparent hover:border-border hover:bg-muted/40"
  )

  const externalUrl =
    item.kind === "pr"
      ? `https://github.com/${repoFullName}/pull/${item.pr.number}`
      : item.kind === "issue"
      ? `https://github.com/${repoFullName}/issues/${item.issue.number}`
      : item.kind === "release"
      ? `https://github.com/${repoFullName}/releases/tag/${item.release.tagName}`
      : `https://github.com/${repoFullName}/commit/${item.commit.sha}`

  const linkBtn = (
    <a
      href={externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
      aria-label="Open on GitHub"
      onClick={(e) => e.stopPropagation()}
    >
      <ArrowSquareOut className="size-3.5" />
    </a>
  )

  const playBtn = (
    <Button
      variant={isCurrentEpisode ? "default" : "outline"}
      size="icon-sm"
      onClick={onPlay}
      disabled={isLoading && !isCurrentEpisode}
      className="shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
    >
      {isLoading && isCurrentEpisode ? (
        <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        <Play weight="fill" className="size-3" />
      )}
    </Button>
  )

  if (item.kind === "pr") {
    const { pr } = item
    const excerpt = pr.body
      ? pr.body.replace(/[#*`[\]]/g, "").replace(/\n+/g, " ").slice(0, 180)
      : null
    return (
      <div className={rowClass}>
        <span className="w-10 shrink-0 text-xs text-muted-foreground tabular-nums text-right mt-0.5 font-mono">
          #{pr.number}
        </span>
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-sm font-medium text-foreground leading-snug">{pr.title}</p>
          <p className="text-xs text-muted-foreground">
            @{pr.authorLogin} · {formatDate(pr.mergedAt)}
          </p>
          {excerpt && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{excerpt}</p>
          )}
        </div>
        {linkBtn}
        {playBtn}
      </div>
    )
  }

  if (item.kind === "issue") {
    const { issue } = item
    const excerpt = issue.body
      ? issue.body.replace(/[#*`[\]]/g, "").replace(/\n+/g, " ").slice(0, 180)
      : null
    return (
      <div className={rowClass}>
        <span className="w-10 shrink-0 text-xs text-muted-foreground tabular-nums text-right mt-0.5 font-mono">
          #{issue.number}
        </span>
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-sm font-medium text-foreground leading-snug">{issue.title}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-muted-foreground">
              @{issue.authorLogin}{issue.closedAt ? ` · ${formatDate(issue.closedAt)}` : ""}
            </p>
            {issue.labels.slice(0, 3).map((label) => (
              <span key={label} className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                {label}
              </span>
            ))}
          </div>
          {excerpt && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{excerpt}</p>
          )}
        </div>
        {linkBtn}
        {playBtn}
      </div>
    )
  }

  if (item.kind === "release") {
    const { release } = item
    const excerpt = release.body
      ? release.body.replace(/[#*`[\]]/g, "").replace(/\n+/g, " ").slice(0, 180)
      : null
    return (
      <div className={rowClass}>
        <span className="w-10 shrink-0 text-xs text-muted-foreground tabular-nums text-right mt-0.5">
          {item.total - item.index}
        </span>
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">
              {release.name ?? release.tagName}
            </span>
            <span className="text-xs text-muted-foreground font-mono">{release.tagName}</span>
          </div>
          <p className="text-xs text-muted-foreground">{formatDate(release.publishedAt)}</p>
          {excerpt && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{excerpt}</p>
          )}
        </div>
        {linkBtn}
        {playBtn}
      </div>
    )
  }

  const { commit } = item
  return (
    <div className={rowClass}>
      <span className="w-10 shrink-0 text-xs text-muted-foreground tabular-nums text-right mt-0.5 font-mono">
        {commit.sha}
      </span>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-foreground truncate">{commit.message}</p>
        <p className="text-xs text-muted-foreground">
          {commit.authorName} · {formatDate(commit.date)}
        </p>
      </div>
      {playBtn}
    </div>
  )
}

export function RepoShowClient({ repoData }: { repoData: RepoData }) {
  const { play, episode, selectedVoiceId } = usePlayer()
  const [saved, setSaved] = useState(false)

  const defaultTab: TabType =
    repoData.pullRequests.length > 0 ? "prs" :
    repoData.releases.length > 0 ? "releases" : "commits"

  const [tab, setTab] = useState<TabType>(defaultTab)

  // Extra items loaded via "Load more"
  const [extraPrs, setExtraPrs] = useState<PullRequest[]>([])
  const [extraIssues, setExtraIssues] = useState<Issue[]>([])
  const [extraCommits, setExtraCommits] = useState<Commit[]>([])
  const [pageMap, setPageMap] = useState<Record<string, number>>({ prs: 1, issues: 1, commits: 1 })
  const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>({
    prs: repoData.pullRequests.length === 100,
    issues: repoData.issues.length === 100,
    commits: repoData.commits.length === 100,
  })
  const [loadingMore, setLoadingMore] = useState(false)

  const [owner, repoName] = repoData.fullName.split("/")

  async function loadMore() {
    setLoadingMore(true)
    const nextPage = pageMap[tab] + 1
    try {
      const res = await fetch(`/api/more?owner=${owner}&repo=${repoName}&type=${tab}&page=${nextPage}`)
      const data = await res.json()
      if (tab === "prs") setExtraPrs((p) => [...p, ...data.items])
      if (tab === "issues") setExtraIssues((p) => [...p, ...data.items])
      if (tab === "commits") setExtraCommits((p) => [...p, ...data.items])
      setPageMap((p) => ({ ...p, [tab]: nextPage }))
      setHasMoreMap((p) => ({ ...p, [tab]: data.hasMore }))
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setSaved(isInLibrary(repoData.fullName))
    addToHistory({ fullName: repoData.fullName, description: repoData.description })
  }, [repoData.fullName, repoData.description])

  function toggleSave() {
    if (saved) {
      removeFromLibrary(repoData.fullName)
      setSaved(false)
    } else {
      saveToLibrary({ fullName: repoData.fullName, description: repoData.description, stars: repoData.stars })
      setSaved(true)
    }
  }

  const allCounts = repoData.pullRequests.length + repoData.issues.length + repoData.releases.length + repoData.commits.length
  const rateLimited = allCounts === 0

  const tabs: { id: TabType; label: string; count: number; icon: React.ElementType }[] = (
    [
      { id: "prs" as TabType, label: "Pull Requests", count: repoData.pullRequests.length, icon: GitMerge },
      { id: "issues" as TabType, label: "Issues", count: repoData.issues.length, icon: Bug },
      { id: "releases" as TabType, label: "Releases", count: repoData.releases.length, icon: Tag },
      { id: "commits" as TabType, label: "Commits", count: repoData.commits.length, icon: GitBranch },
    ] as { id: TabType; label: string; count: number; icon: React.ElementType }[]
  ).filter((t) => t.count > 0)

  const allPrs = [...repoData.pullRequests, ...extraPrs]
  const allIssues = [...repoData.issues, ...extraIssues]
  const allCommits = [...repoData.commits, ...extraCommits]

  const episodes: EpisodeItem[] =
    tab === "prs"
      ? allPrs.map((pr, i) => ({ kind: "pr", pr, index: i, total: allPrs.length }))
      : tab === "issues"
      ? allIssues.map((issue, i) => ({ kind: "issue", issue, index: i, total: allIssues.length }))
      : tab === "releases"
      ? repoData.releases.map((release, i) => ({ kind: "release", release, index: i, total: repoData.releases.length }))
      : allCommits.map((commit, i) => ({ kind: "commit", commit, index: i, total: allCommits.length }))

  const isCurrentlyPlaying = (item: EpisodeItem): boolean => {
    if (!episode || episode.repoFullName !== repoData.fullName) return false
    if (item.kind === "pr") return episode.tagName === `pr-${item.pr.number}`
    if (item.kind === "issue") return episode.tagName === `issue-${item.issue.number}`
    if (item.kind === "release") return episode.tagName === item.release.tagName
    return episode.tagName === item.commit.sha
  }

  const isLoadingEpisode = (item: EpisodeItem): boolean =>
    isCurrentlyPlaying(item) &&
    (episode?.status === "loading_script" || episode?.status === "loading_audio")

  async function handlePlay(item: EpisodeItem) {
    if (item.kind === "pr") {
      const syntheticRelease: Release = {
        tagName: `pr-${item.pr.number}`,
        name: item.pr.title,
        body: item.pr.body,
        publishedAt: item.pr.mergedAt,
      }
      await play(
        { ...repoData, pullRequests: [item.pr], releases: [], commits: [] },
        syntheticRelease,
        selectedVoiceId
      )
    } else if (item.kind === "issue") {
      const syntheticRelease: Release = {
        tagName: `issue-${item.issue.number}`,
        name: item.issue.title,
        body: item.issue.body,
        publishedAt: item.issue.closedAt ?? new Date().toISOString(),
      }
      await play(
        { ...repoData, issues: [item.issue], pullRequests: [], releases: [], commits: [] },
        syntheticRelease,
        selectedVoiceId
      )
    } else if (item.kind === "release") {
      await play(
        { ...repoData, pullRequests: [], releases: [item.release], commits: [] },
        item.release,
        selectedVoiceId
      )
    } else {
      const syntheticRelease: Release = {
        tagName: item.commit.sha,
        name: item.commit.message,
        body: `Commit by ${item.commit.authorName}: ${item.commit.message}`,
        publishedAt: item.commit.date,
      }
      await play(
        { ...repoData, pullRequests: [], releases: [], commits: [item.commit] },
        syntheticRelease,
        selectedVoiceId
      )
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground break-all">{repoData.fullName}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const overviewRelease: Release = {
                  tagName: "overview",
                  name: `${repoData.fullName} overview`,
                  body: null,
                  publishedAt: new Date().toISOString(),
                }
                play(repoData, overviewRelease, selectedVoiceId, "overview")
              }}
              disabled={episode?.repoFullName === repoData.fullName && episode?.tagName === "overview" && (episode?.status === "loading_script" || episode?.status === "loading_audio")}
            >
              {episode?.repoFullName === repoData.fullName && episode?.tagName === "overview" && (episode?.status === "loading_script" || episode?.status === "loading_audio") ? (
                <span data-icon="inline-start" className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Play data-icon="inline-start" weight="fill" className="size-3.5" />
              )}
              Overview
            </Button>
            <Button variant="outline" size="sm" onClick={toggleSave}>
              <BookmarkSimple data-icon="inline-start" weight={saved ? "fill" : "regular"} className="size-3.5" />
              {saved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
        {repoData.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{repoData.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="size-3.5" />
            {repoData.stars.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <GitBranch className="size-3.5" />
            {repoData.defaultBranch}
          </span>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map(({ id, label, count, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {label}
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              tab === id ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Rate limit warning */}
      {rateLimited && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-6 text-center space-y-1">
          <p className="text-sm font-medium text-foreground">No data loaded</p>
          <p className="text-xs text-muted-foreground">
            GitHub rate limit likely hit. Add a <code className="font-mono bg-muted px-1 rounded">GITHUB_TOKEN</code> to <code className="font-mono bg-muted px-1 rounded">.env.local</code> to fix this.
          </p>
        </div>
      )}

      {/* Episodes */}
      <div className="space-y-1 -mx-4">
        {episodes.map((item, i) => (
          <EpisodeRow
            key={i}
            item={item}
            onPlay={() => handlePlay(item)}
            isCurrentEpisode={isCurrentlyPlaying(item)}
            isLoading={isLoadingEpisode(item)}
            repoFullName={repoData.fullName}
          />
        ))}
      </div>

      {/* Load more */}
      {tab !== "releases" && hasMoreMap[tab] && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? (
              <span className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : null}
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  )
}
