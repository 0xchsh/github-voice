import { NextRequest, NextResponse } from "next/server"

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech"

export async function POST(request: NextRequest) {
  const { script, voiceId } = await request.json()

  if (!script) {
    return NextResponse.json({ error: "Missing script" }, { status: 400 })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 })
  }

  const selectedVoiceId = voiceId || process.env.ELEVENLABS_VOICE_ID || "nPczCjzI2devNBz1zQrb"

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)

  try {
    const res = await fetch(`${ELEVENLABS_API_URL}/${selectedVoiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `ElevenLabs error: ${err}` }, { status: res.status })
    }

    const audioBuffer = await res.arrayBuffer()
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    })
  } finally {
    clearTimeout(timeout)
  }
}
