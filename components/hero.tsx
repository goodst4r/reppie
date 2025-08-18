"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Repeat, Globe } from "lucide-react"
import { useState, Suspense } from "react"
import Link from "next/link"

import { VideoPlayer } from "@/components/video-player"

interface HeroProps {
  locale?: "en" | "ja"
}

const content = {
  en: {
    title: "Master Any Video with AB Repeat",
    subtitle:
      "Professional video player with precise loop controls for YouTube, Vimeo, Dailymotion, Twitch, and HTML5 videos",
    placeholder: "Paste a video URL here...",
    button: "Start Playing",
    features: [
      "Precise AB loop controls",
      "Multiple platform support",
      "Mobile-optimized interface",
      "Keyboard shortcuts",
    ],
  },
  ja: {
    title: "ABリピートで動画をマスター",
    subtitle:
      "YouTube、Vimeo、Dailymotion、Twitch、HTML5動画に対応した精密なループ制御機能付きプロフェッショナル動画プレイヤー",
    placeholder: "動画URLを貼り付けてください...",
    button: "再生開始",
    features: [
      "精密なABループ制御",
      "複数プラットフォーム対応",
      "モバイル最適化インターface",
      "キーボードショートカット",
    ],
  },
}

export function Hero({ locale = "en" }: HeroProps) {
  const [url, setUrl] = useState("")
  const t = content[locale]

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="relative bg-gradient-to-br from-background to-muted px-4 py-12">
        <div className="absolute top-4 right-4">
          <Link href={locale === "en" ? "/jp" : "/"}>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Globe className="h-4 w-4" />
              {locale === "en" ? "日本語" : "English"}
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">{t.title}</h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{t.subtitle}</p>
          </div>

          <Card className="p-4 max-w-2xl mx-auto">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder={t.placeholder}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 text-base"
              />
              <Button onClick={() => setUrl("")} variant="outline">
                Clear
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {t.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Repeat className="h-4 w-4 text-accent" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Player Section */}
      <section className="py-6">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]">Loading...</div>}>
          <VideoPlayer initialUrl={url} />
        </Suspense>
      </section>
    </div>
  )
}
