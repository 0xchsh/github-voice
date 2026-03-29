"use client"

import { useState, useRef } from "react"
import type { RepoData } from "@/lib/github"

export type Status =
  | "idle"
  | "loading_repo"
  | "loading_script"
  | "loading_audio"
  | "ready"
  | "error"

export function useGitwave() {
  const [status, setStatus] = useState<Status>("idle")
  const [repoData, setRepoData] = useState<RepoData | null>(null)
  const [script, setScript] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const audioBlobRef = useRef<string | null>(null)

  async function submit(url: string, voiceId: string) {
    // Clean up previous audio blob
    if (audioBlobRef.current) {
      URL.revokeObjectURL(audioBlobRef.current)
      audioBlobRef.current = null
    }
    setAudioUrl(null)
    setRepoData(null)
    setScript(null)
    setError(null)

    try {
      // Step 1: Fetch repo data
      setStatus("loading_repo")
      const repoRes = await fetch(`/api/github?url=${encodeURIComponent(url)}`)
      if (!repoRes.ok) {
        const { error } = await repoRes.json()
        throw new Error(error || "Failed to fetch repository")
      }
      const repo: RepoData = await repoRes.json()
      setRepoData(repo)

      // Step 2: Generate script
      setStatus("loading_script")
      const scriptRes = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(repo),
      })
      if (!scriptRes.ok) throw new Error("Failed to generate script")
      const { script: generatedScript } = await scriptRes.json()
      setScript(generatedScript)

      // Step 3: Synthesize audio
      setStatus("loading_audio")
      const audioRes = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: generatedScript, voiceId }),
      })
      if (!audioRes.ok) throw new Error("Failed to generate audio")
      const blob = await audioRes.blob()
      const blobUrl = URL.createObjectURL(blob)
      audioBlobRef.current = blobUrl
      setAudioUrl(blobUrl)
      setStatus("ready")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setStatus("error")
    }
  }

  function reset() {
    if (audioBlobRef.current) {
      URL.revokeObjectURL(audioBlobRef.current)
      audioBlobRef.current = null
    }
    setStatus("idle")
    setRepoData(null)
    setScript(null)
    setAudioUrl(null)
    setError(null)
  }

  return { submit, reset, status, repoData, script, audioUrl, error }
}
