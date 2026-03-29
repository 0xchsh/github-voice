import type { Metadata } from "next"
import "./globals.css"
import { PlayerProvider } from "@/context/player-context"
import { Sidebar } from "@/components/sidebar"
import { Player } from "@/components/player"
import { Agentation } from "agentation"

export const metadata: Metadata = {
  title: "GHVoice — GitHub repos as podcasts",
  description: "Turn any public GitHub repo's changelog into a podcast episode using AI.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full overflow-hidden bg-background">
        <PlayerProvider>
          <div className="flex h-full overflow-hidden">
            {/* Left sidebar */}
            <Sidebar />

            {/* Main content column */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
              {/* Scrollable main area */}
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>

              {/* Persistent bottom player */}
              <Player />
            </div>
          </div>
        </PlayerProvider>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  )
}
