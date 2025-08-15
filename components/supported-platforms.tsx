import { Card, CardContent } from "@/components/ui/card"

interface SupportedPlatformsProps {
  locale?: "en" | "ja"
}

const content = {
  en: {
    title: "Supported Platforms",
    subtitle: "Works seamlessly with all major video platforms",
    platforms: [
      { name: "YouTube", description: "Full support including shorts and live streams" },
      { name: "Vimeo", description: "Professional videos with high-quality playback" },
      { name: "Dailymotion", description: "European video platform integration" },
      { name: "Twitch", description: "Gaming streams and VODs" },
      { name: "HTML5", description: "Direct MP4, WebM, and HLS stream support" },
    ],
  },
  ja: {
    title: "対応プラットフォーム",
    subtitle: "主要な動画プラットフォームとシームレスに連携",
    platforms: [
      { name: "YouTube", description: "ショート動画やライブストリームを含む完全対応" },
      { name: "Vimeo", description: "高品質再生対応のプロフェッショナル動画" },
      { name: "Dailymotion", description: "ヨーロッパ系動画プラットフォーム統合" },
      { name: "Twitch", description: "ゲーミングストリームとVOD" },
      { name: "HTML5", description: "MP4、WebM、HLSストリーム直接対応" },
    ],
  },
}

export function SupportedPlatforms({ locale = "en" }: SupportedPlatformsProps) {
  const t = content[locale]

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">{t.title}</h2>
          <p className="text-lg text-muted-foreground">{t.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.platforms.map((platform, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">{platform.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{platform.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
