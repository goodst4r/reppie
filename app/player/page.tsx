import { VideoPlayer } from "@/components/video-player"
import { Suspense } from "react"

export const metadata = {
  title: "Video Player - reppie",
  description: "Professional video player with AB repeat functionality",
}

export default function PlayerPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <VideoPlayer />
      </Suspense>
    </main>
  )
}
