import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 })
  }

  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch voices" }, { status: res.status })
  }

  const data = await res.json()
  // Return only the fields we need
  const voices = (data.voices as Array<{
    voice_id: string
    name: string
    preview_url?: string
    labels?: Record<string, string>
    sharing?: { image_url?: string }
  }>).map((v) => ({
    id: v.voice_id,
    name: v.name,
    labels: v.labels ?? null,
    previewUrl: v.preview_url ?? null,
    imageUrl: v.sharing?.image_url ?? null,
  }))

  return NextResponse.json({ voices })
}
