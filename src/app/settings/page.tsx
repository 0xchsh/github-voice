"use client"

import { useRef, useState } from "react"
import { Play, Pause, Check, SpeakerHigh } from "@phosphor-icons/react"
import { usePlayer } from "@/context/player-context"
import { cn } from "@/lib/utils"
import type { Voice } from "@/context/player-context"

const GRADIENTS = [
  "from-red-200 to-red-400",
  "from-orange-200 to-orange-400",
  "from-amber-200 to-amber-400",
  "from-yellow-200 to-yellow-400",
  "from-lime-200 to-lime-400",
  "from-green-200 to-green-400",
  "from-teal-200 to-teal-400",
  "from-cyan-200 to-cyan-400",
  "from-sky-200 to-sky-400",
  "from-blue-200 to-blue-400",
  "from-violet-200 to-violet-400",
  "from-pink-200 to-pink-400",
]

function getGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return GRADIENTS[hash % GRADIENTS.length]
}

function VoiceCard({
  voice,
  selected,
  onSelect,
}: {
  voice: Voice
  selected: boolean
  onSelect: () => void
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [previewing, setPreviewing] = useState(false)

  function togglePreview(e: React.MouseEvent) {
    e.stopPropagation()
    if (!voice.previewUrl) return
    if (!audioRef.current) {
      audioRef.current = new Audio(voice.previewUrl)
      audioRef.current.onended = () => setPreviewing(false)
    }
    if (previewing) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPreviewing(false)
    } else {
      audioRef.current.play()
      setPreviewing(true)
    }
  }

  const gradient = getGradient(voice.name)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={cn(
        "relative text-left rounded-xl border p-4 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-ring bg-muted"
          : "border-border bg-card hover:border-ring/40 hover:bg-muted/40"
      )}
    >
      {/* Selected check */}
      {selected && (
        <span className="absolute top-3 right-3 size-5 rounded-full bg-foreground flex items-center justify-center">
          <Check weight="bold" className="size-3 text-background" />
        </span>
      )}

      {/* Avatar */}
      <div className={cn("size-12 rounded-full mb-3 shrink-0 bg-gradient-to-br", gradient)} />

      {/* Name + preview icon */}
      <div className="flex items-center gap-1 mb-2 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight truncate">
          {voice.name.split(" - ")[0]}
        </p>
        {voice.previewUrl && (
          <button
            onClick={togglePreview}
            className={cn(
              "shrink-0 transition-colors ml-0.5",
              previewing ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={previewing ? "Stop preview" : "Preview voice"}
          >
            {previewing ? (
              <Pause weight="fill" className="size-3.5" />
            ) : (
              <SpeakerHigh className="size-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Meta tags — gender, accent, then up to 2 extras */}
      {voice.labels && (() => {
        const priority = ["gender", "accent"]
        const skip = new Set(["language", "age"])
        const ordered = [
          ...priority.flatMap((k) => (voice.labels![k] ? [[k, voice.labels![k]]] : [])),
          ...Object.entries(voice.labels).filter(([k]) => !priority.includes(k) && !skip.has(k)),
        ].slice(0, 4) as [string, string][]
        return ordered.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-[46px] overflow-hidden">
            {ordered.map(([key, val]) => (
              <span
                key={key}
                className="text-xs px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground capitalize"
              >
                {val.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        ) : null
      })()}

    </div>
  )
}

export default function SettingsPage() {
  const { voices, selectedVoiceId, setSelectedVoiceId } = usePlayer()

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Voices</h1>
        <p className="text-sm text-muted-foreground">Choose the default voice for all generated episodes.</p>
      </div>

      <section className="space-y-4">
        {voices.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3 animate-pulse">
                <div className="size-12 rounded-full bg-muted" />
                <div className="h-3.5 w-2/3 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {voices.map((voice) => (
              <VoiceCard
                key={voice.id}
                voice={voice}
                selected={selectedVoiceId === voice.id}
                onSelect={() => setSelectedVoiceId(voice.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
