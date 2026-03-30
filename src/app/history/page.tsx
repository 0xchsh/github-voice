"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ClockCounterClockwise } from "@phosphor-icons/react"

type PlayHistoryItem = {
  repoFullName: string
  tagName: string
  generatedAt: string
}

const PLAY_HISTORY_KEY = "gitwave_play_history"

function getPlayHistory(): PlayHistoryItem[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(PLAY_HISTORY_KEY) ?? "[]")
  } catch {
    return []
  }
}

export default function HistoryPage() {
  const [history, setHistory] = useState<PlayHistoryItem[]>([])

  useEffect(() => {
    setHistory(getPlayHistory())
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">History</h1>
        <p className="text-sm text-muted-foreground">Audio you&apos;ve generated.</p>
      </div>

      {history.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
          <ClockCounterClockwise className="size-6 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium text-foreground">No history yet</p>
          <p className="text-xs text-muted-foreground">Generated audio will appear here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {history.map((item) => {
            const [owner, repo] = item.repoFullName.split("/")
            const href = `/r/${owner}/${repo}`
            const date = new Date(item.generatedAt)
            return (
              <Link
                key={`${item.repoFullName}-${item.tagName}-${item.generatedAt}`}
                href={href}
                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.repoFullName}</p>
                  <p className="text-xs text-muted-foreground">{item.tagName}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-4">
                  {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
