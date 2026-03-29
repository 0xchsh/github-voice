import { Star, GitBranch } from "@phosphor-icons/react/ssr"
import type { RepoData } from "@/lib/github"

export function RepoCard({ data }: { data: RepoData }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold text-foreground">{data.fullName}</h2>
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Star weight="fill" className="size-3 text-amber-400" />
          {data.stars.toLocaleString()}
        </div>
      </div>
      {data.description && (
        <p className="text-sm text-muted-foreground">{data.description}</p>
      )}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <GitBranch className="size-3" />
        {data.defaultBranch}
        <span className="mx-1">·</span>
        {data.releases.length > 0
          ? `${data.releases.length} release${data.releases.length > 1 ? "s" : ""} found`
          : `${data.commits.length} recent commits`}
      </div>
    </div>
  )
}
