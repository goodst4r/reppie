import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Repeat, Keyboard, Share2, Settings } from "lucide-react"

interface FeaturesProps {
  locale?: "en" | "ja"
}

const content = {
  en: {
    title: "Professional Features",
    subtitle: "Advanced tools designed for effective learning and skill development",
    features: [
      {
        icon: Repeat,
        title: "Precision Looping",
        description: "Set exact A and B points with frame-perfect accuracy for seamless section repetition",
      },
      {
        icon: Keyboard,
        title: "Smart Shortcuts",
        description: "Efficient keyboard controls: [ for A point, ] for B point, \\ to toggle loop mode",
      },
      {
        icon: Share2,
        title: "Collaborative Sharing",
        description: "Share your learning sessions with preserved A/B points, speed, and custom settings",
      },
      {
        icon: Settings,
        title: "Advanced Controls",
        description: "Fine-tune playback speed, audio levels, and loop timing with 0.1-second precision",
      },
    ],
  },
  ja: {
    title: "プロフェッショナル機能",
    subtitle: "効果的な学習とスキル開発のための高度なツール",
    features: [
      {
        icon: Repeat,
        title: "精密ループ",
        description: "フレーム完全精度で正確なA点とB点を設定し、シームレスな区間リピート",
      },
      {
        icon: Keyboard,
        title: "スマートショートカット",
        description: "効率的なキーボード制御：A点は[、B点は]、ループ切替は\\",
      },
      {
        icon: Share2,
        title: "コラボレーション共有",
        description: "A/B点、速度、カスタム設定を保持した学習セッションの共有",
      },
      {
        icon: Settings,
        title: "高度な制御",
        description: "0.1秒精度での再生速度、音声レベル、ループタイミングの微調整",
      },
    ],
  },
}

export function Features({ locale = "en" }: FeaturesProps) {
  const t = content[locale]

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-6 mb-20">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">{t.title}</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">{t.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {t.features.map((feature, index) => (
            <Card key={index} className="group text-center hover:shadow-xl transition-all duration-300 card-modern bg-card/80 backdrop-blur-sm border-primary/10 hover:border-primary/30 hover:-translate-y-2">
              <CardHeader className="pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-8 w-8 text-primary group-hover:text-accent transition-colors duration-300" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
