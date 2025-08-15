import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Repeat, Keyboard, Share2, Settings } from "lucide-react"

interface FeaturesProps {
  locale?: "en" | "ja"
}

const content = {
  en: {
    title: "Powerful Features",
    subtitle: "Everything you need for precise video practice and learning",
    features: [
      {
        icon: Repeat,
        title: "AB Repeat",
        description: "Set precise A and B points to loop any section of your video with frame-perfect accuracy",
      },
      {
        icon: Keyboard,
        title: "Keyboard Shortcuts",
        description: "Use [ for A point, ] for B point, and \\ to toggle loop mode for lightning-fast control",
      },
      {
        icon: Share2,
        title: "Share Links",
        description: "Generate shareable URLs with your exact A/B points, speed, and settings preserved",
      },
      {
        icon: Settings,
        title: "Fine Control",
        description: "Adjust playback speed, volume, and fine-tune your loop points with ±0.1s precision",
      },
    ],
  },
  ja: {
    title: "強力な機能",
    subtitle: "精密な動画練習と学習に必要なすべての機能",
    features: [
      {
        icon: Repeat,
        title: "ABリピート",
        description: "動画の任意の区間に精密なA点とB点を設定し、フレーム単位の正確さでループ再生",
      },
      {
        icon: Keyboard,
        title: "キーボードショートカット",
        description: "A点は[、B点は]、ループ切替は\\キーで超高速制御",
      },
      {
        icon: Share2,
        title: "共有リンク",
        description: "正確なA/B点、速度、設定を保持した共有可能なURLを生成",
      },
      {
        icon: Settings,
        title: "精密制御",
        description: "再生速度、音量調整、±0.1秒精度でのループ点微調整",
      },
    ],
  },
}

export function Features({ locale = "en" }: FeaturesProps) {
  const t = content[locale]

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">{t.title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
