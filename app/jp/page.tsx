import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { SupportedPlatforms } from "@/components/supported-platforms"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "reppie - ABリピート動画プレイヤー",
  description:
    "YouTube、Vimeo、Dailymotion、Twitch、HTML5動画に対応したABリピート機能付きプロフェッショナル動画プレイヤー",
  openGraph: {
    title: "reppie - ABリピート動画プレイヤー",
    description: "ABリピート機能付きプロフェッショナル動画プレイヤー",
    locale: "ja_JP",
  },
}

export default function JapaneseHomePage() {
  return (
    <main className="min-h-screen">
      <Hero locale="ja" />
      <Features locale="ja" />
      <SupportedPlatforms locale="ja" />
      <Footer locale="ja" />
    </main>
  )
}
