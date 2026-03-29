"use client"

import { Play, Pause, Download, SpeakerNone, Waveform } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePlayer } from "@/context/player-context"

function formatTime(s: number) {
  if (!isFinite(s)) return "0:00"
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}

export function Player() {
  const {
    episode,
    isPlaying,
    pause,
    resume,
    currentTime,
    duration,
    seek,
    playbackRate,
    setPlaybackRate,
  } = usePlayer()

  const speeds = [1, 1.5, 2]

  const isLoading =
    episode?.status === "loading_script" || episode?.status === "loading_audio"
  const hasAudio = episode?.status === "ready" && episode.audioUrl !== null
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div suppressHydrationWarning className="h-24 shrink-0 border-t border-border bg-card flex items-center px-4 gap-4">
      {/* Left: Now playing info */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        {episode ? (
          <>
            <div
              className={cn(
                "size-9 shrink-0 rounded-lg bg-muted flex items-center justify-center",
                isLoading && "animate-pulse"
              )}
            >
              {isLoading ? (
                <Waveform className="size-4 text-muted-foreground" />
              ) : (
                <SpeakerNone weight="fill" className="size-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate leading-tight">
                {episode.repoFullName}
              </p>
              <p className="text-xs text-muted-foreground truncate leading-tight">
                {isLoading
                  ? episode.status === "loading_script"
                    ? "Writing script…"
                    : "Generating audio…"
                  : episode.status === "error"
                  ? "Error"
                  : episode.tagName}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="size-9 shrink-0 rounded-lg bg-muted" />
            <p className="text-xs text-muted-foreground">Nothing playing</p>
          </div>
        )}
      </div>

      {/* Center: Controls + scrubber */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1 min-w-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={isPlaying ? pause : resume}
            disabled={!hasAudio}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause weight="fill" className="size-4" />
            ) : (
              <Play weight="fill" className="size-4" />
            )}
          </Button>
        </div>

        {/* Scrubber */}
        <div className="w-full max-w-sm flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums w-8 text-right shrink-0">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 h-1 rounded-full bg-muted overflow-visible">
            <div
              className="absolute inset-y-0 left-0 bg-foreground rounded-full transition-all pointer-events-none"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              step={0.1}
              disabled={!hasAudio}
              onChange={(e) => seek(Number(e.target.value))}
              className={cn(
                "absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default",
                "[&::-webkit-slider-thumb]:appearance-none"
              )}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums w-8 shrink-0">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Voice picker + download */}
      <div className="shrink-0 flex items-center justify-end gap-2">
        {/* Speed control */}
        <div className="flex items-center gap-0.5">
          {speeds.map((rate) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              disabled={!hasAudio}
              className={cn(
                "text-sm px-2 py-1 rounded font-medium tabular-nums transition-colors disabled:opacity-30",
                playbackRate === rate
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {rate === 1 ? "1×" : `${rate}×`}
            </button>
          ))}
        </div>

        {hasAudio && episode?.audioUrl && (
          <a
            href={episode.audioUrl}
            download={`${episode.repoFullName.replace("/", "-")}-${episode.tagName}.mp3`}
          >
            <Button variant="ghost" size="icon-sm" aria-label="Download episode">
              <Download className="size-4" />
            </Button>
          </a>
        )}
      </div>
    </div>
  )
}
