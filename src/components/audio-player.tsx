"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Pause, Download } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}

export function AudioPlayer({ audioUrl, repoName }: { audioUrl: string; repoName: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    setPlaying(false)
    setCurrent(0)
    setDuration(0)
  }, [audioUrl])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
    setPlaying(!playing)
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button size="icon" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause weight="fill" /> : <Play weight="fill" />}
          </Button>
          <div>
            <p className="text-sm font-medium text-foreground">{repoName}</p>
            <p className="text-xs text-muted-foreground">
              {formatTime(current)} / {formatTime(duration)}
            </p>
          </div>
        </div>
        <a href={audioUrl} download={`${repoName}-podcast.mp3`}>
          <Button variant="ghost" size="icon" aria-label="Download">
            <Download />
          </Button>
        </a>
      </div>

      {/* Scrubber */}
      <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={current}
          onChange={(e) => {
            const audio = audioRef.current
            if (!audio) return
            audio.currentTime = Number(e.target.value)
            setCurrent(Number(e.target.value))
          }}
          className={cn(
            "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
            "[&::-webkit-slider-thumb]:appearance-none"
          )}
        />
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  )
}
