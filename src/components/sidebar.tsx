"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { House, MagnifyingGlass, GearSix } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

type LibraryItem = {
  fullName: string
  description: string | null
  stars: number
}

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

const LIBRARY_KEY = "gitwave_library"

export function getLibrary(): LibraryItem[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(LIBRARY_KEY) ?? "[]")
  } catch {
    return []
  }
}

function dispatchLibraryChange() {
  window.dispatchEvent(new Event("gitwave_library_change"))
}

export function saveToLibrary(item: LibraryItem) {
  const current = getLibrary()
  const exists = current.some((i) => i.fullName === item.fullName)
  if (!exists) {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify([...current, item]))
    dispatchLibraryChange()
  }
}

export function removeFromLibrary(fullName: string) {
  const current = getLibrary()
  localStorage.setItem(
    LIBRARY_KEY,
    JSON.stringify(current.filter((i) => i.fullName !== fullName))
  )
  dispatchLibraryChange()
}

export function isInLibrary(fullName: string): boolean {
  return getLibrary().some((i) => i.fullName === fullName)
}

export function Sidebar() {
  const pathname = usePathname()
  const [playHistory, setPlayHistory] = useState<PlayHistoryItem[]>([])

  useEffect(() => {
    setPlayHistory(getPlayHistory())
  }, [])

  useEffect(() => {
    function refresh() { setPlayHistory(getPlayHistory()) }
    window.addEventListener("gitwave_play_history_change", refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener("gitwave_play_history_change", refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [])

  const navLinks = [
    { href: "/", label: "Home", icon: House },
    { href: "/search", label: "Explore", icon: MagnifyingGlass },
    { href: "/settings", label: "Voices", icon: GearSix },
  ]

  return (
    <aside className="w-60 shrink-0 hidden md:flex flex-col bg-card border-r border-border h-full overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2 shrink-0">
        <Image src="/gitwave.svg" alt="Gitwave" width={24} height={24} priority />
        <span className="font-semibold text-base text-foreground tracking-tight">Gitwave</span>
      </div>

      {/* Nav */}
      <nav className="px-2 space-y-0.5 shrink-0">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon
              weight={pathname === href ? "fill" : "regular"}
              className="size-4 shrink-0"
            />
            {label}
          </Link>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 mt-4 mb-3 border-t border-border shrink-0" />

      {/* History */}
      <div className="px-2 flex-1 min-h-0 flex flex-col">
        <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
          History
        </div>
        <div className="flex-1 overflow-y-auto space-y-0.5 pb-4">
          {playHistory.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Generated audio will appear here.
            </p>
          ) : (
            playHistory.map((item) => {
              const [owner, repo] = item.repoFullName.split("/")
              const href = `/r/${owner}/${repo}`
              return (
                <Link
                  key={`${item.repoFullName}-${item.tagName}`}
                  href={href}
                  className={cn(
                    "flex flex-col gap-0.5 px-3 py-2 rounded-lg transition-colors",
                    pathname === href
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <span className="text-sm font-medium text-foreground truncate">{repo}</span>
                  <span className="text-xs text-muted-foreground truncate">{item.tagName}</span>
                </Link>
              )
            })
          )}
        </div>
      </div>

    </aside>
  )
}
