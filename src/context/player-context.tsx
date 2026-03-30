"use client"

import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import type { RepoData, Release } from "@/lib/github"

export type Voice = { id: string; name: string; labels: Record<string, string> | null; previewUrl: string | null; imageUrl: string | null }

export type EpisodeStatus =
  | "idle"
  | "loading_script"
  | "loading_audio"
  | "ready"
  | "error"

export type Episode = {
  repoFullName: string
  tagName: string
  script: string | null
  audioUrl: string | null
  status: EpisodeStatus
}

type PlayerContextType = {
  episode: Episode | null
  play: (repoData: RepoData, release: Release, voiceId: string, mode?: "overview" | "episode") => Promise<void>
  pause: () => void
  resume: () => void
  isPlaying: boolean
  currentTime: number
  duration: number
  seek: (time: number) => void
  audioRef: React.RefObject<HTMLAudioElement | null>
  voices: Voice[]
  selectedVoiceId: string
  setSelectedVoiceId: (id: string) => void
  playbackRate: number
  setPlaybackRate: (rate: number) => void
}

const PlayerContext = createContext<PlayerContextType | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioBlobUrlRef = useRef<string | null>(null)

  const [episode, setEpisode] = useState<Episode | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const [voices, setVoices] = useState<Voice[]>([])
  const [selectedVoiceId, setSelectedVoiceIdState] = useState("")
  const [playbackRate, setPlaybackRateState] = useState(1)

  const setSelectedVoiceId = useCallback((id: string) => {
    setSelectedVoiceIdState(id)
    localStorage.setItem("gitwave_voice_id", id)
  }, [])

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate)
    if (audioRef.current) audioRef.current.playbackRate = rate
  }, [])

  // Fetch voices on mount
  useEffect(() => {
    fetch("/api/voices")
      .then((r) => r.json())
      .then((data) => {
        if (data.voices?.length) {
          setVoices(data.voices)
          const saved = localStorage.getItem("gitwave_voice_id")
          const match = saved && data.voices.find((v: Voice) => v.id === saved)
          setSelectedVoiceIdState(match ? saved : data.voices[0].id)
        }
      })
      .catch(() => {})
  }, [])

  // Sync audio element events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    function onTimeUpdate() {
      setCurrentTime(audio!.currentTime)
    }
    function onLoadedMetadata() {
      setDuration(audio!.duration)
    }
    function onEnded() {
      setIsPlaying(false)
    }
    function onPlay() {
      setIsPlaying(true)
    }
    function onPause() {
      setIsPlaying(false)
    }

    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
    }
  }, [])

  const play = useCallback(
    async (repoData: RepoData, release: Release, voiceId: string, mode: "overview" | "episode" = "episode") => {
      // Revoke previous blob
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current)
        audioBlobUrlRef.current = null
      }

      // Pause any current playback
      audioRef.current?.pause()
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)

      setEpisode({
        repoFullName: repoData.fullName,
        tagName: release.tagName,
        script: null,
        audioUrl: null,
        status: "loading_script",
      })

      try {
        // Step 1: Generate script for this single release
        const scriptRes = await fetch("/api/script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "overview"
              ? { ...repoData, mode: "overview" }
              : { ...repoData, releases: [release], pullRequests: [], issues: [], commits: [], mode: "episode" }
          ),
        })
        if (!scriptRes.ok) throw new Error("Failed to generate script")
        const { script } = await scriptRes.json()

        setEpisode((prev) =>
          prev ? { ...prev, script, status: "loading_audio" } : prev
        )

        // Step 2: Synthesize audio
        const audioRes = await fetch("/api/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ script, voiceId }),
        })
        if (!audioRes.ok) throw new Error("Failed to synthesize audio")

        const blob = await audioRes.blob()
        const blobUrl = URL.createObjectURL(blob)
        audioBlobUrlRef.current = blobUrl

        setEpisode((prev) =>
          prev ? { ...prev, audioUrl: blobUrl, status: "ready" } : prev
        )

        // Save to play history
        const HISTORY_KEY = "gitwave_play_history"
        try {
          const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")
          const entry = { repoFullName: repoData.fullName, tagName: release.tagName, generatedAt: new Date().toISOString() }
          const filtered = existing.filter((e: typeof entry) => !(e.repoFullName === entry.repoFullName && e.tagName === entry.tagName))
          localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...filtered].slice(0, 50)))
          window.dispatchEvent(new Event("gitwave_play_history_change"))
        } catch {}

        // Auto-play, preserving current playback rate
        if (audioRef.current) {
          audioRef.current.src = blobUrl
          audioRef.current.load()
          audioRef.current.playbackRate = playbackRate
          await audioRef.current.play()
        }
      } catch {
        setEpisode((prev) =>
          prev ? { ...prev, status: "error" } : prev
        )
      }
    },
    [playbackRate]
  )

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    audioRef.current?.play()
  }, [])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  return (
    <PlayerContext.Provider
      value={{
        episode,
        play,
        pause,
        resume,
        isPlaying,
        currentTime,
        duration,
        seek,
        audioRef,
        voices,
        selectedVoiceId,
        setSelectedVoiceId,
        playbackRate,
        setPlaybackRate,
      }}
    >
      {children}
      {/* Hidden audio element — controlled via audioRef */}
      <audio ref={audioRef} />
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider")
  return ctx
}
