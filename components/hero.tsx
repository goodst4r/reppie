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
    title: "Perfect Video Learning with AB Repeat",
    subtitle:
      "Professional video player designed for language learning, music practice, and skill development. Supports YouTube, Vimeo, Dailymotion, Twitch, and HTML5 videos.",
    placeholder: "Enter your video URL to get started...",
    button: "Launch Player",
    features: [
      "Precision AB looping",
      "Multi-platform support",
      "Responsive design",
      "Keyboard shortcuts",
    ],
    adLabel: "Advertisement",
  },
  ja: {
    title: "ABリピートで動画をマスター",
    subtitle:
      "語学学習、楽器練習、スキル開発に特化したプロフェッショナル動画プレイヤー。YouTube、Vimeo、Dailymotion、Twitch、HTML5動画に対応。",
    placeholder: "動画URLを入力して開始...",
    button: "プレイヤー起動",
    features: [
      "精密なABループ制御",
      "複数プラットフォーム対応",
      "レスポンシブデザイン",
      "キーボードショートカット",
    ],
    adLabel: "広告",
  },
}

export function Hero({ locale = "en" }: HeroProps) {
  const [url, setUrl] = useState("")
  const t = content[locale]

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="relative bg-gradient-to-br from-background via-primary/5 to-accent/10 px-4 py-16">
        <div className="absolute top-6 right-6">
          <Link href={locale === "en" ? "/jp" : "/"}>
            <Button variant="outline" size="sm" className="gap-2 bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-colors">
              <Globe className="h-4 w-4" />
              {locale === "en" ? "日本語" : "English"}
            </Button>
          </Link>
        </div>

        {/* Advertisement Area - Top Banner */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">{t.adLabel}</p>
            <div className="h-20 bg-gradient-to-r from-muted/30 to-muted/60 rounded-md flex items-center justify-center">
              <span className="text-muted-foreground text-sm">728×90 Banner Ad Space</span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent leading-tight">{t.title}</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">{t.subtitle}</p>
          </div>

          <Card className="p-6 max-w-3xl mx-auto card-modern bg-card/80 backdrop-blur-sm border-primary/20">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="url"
                placeholder={t.placeholder}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 text-base h-12 bg-background/50 border-primary/20 focus:border-primary/40"
              />
              <div className="flex gap-2">
                <Button onClick={() => setUrl("")} variant="outline" className="h-12 px-6">
                  Clear
                </Button>
                <Button className="h-12 px-8 btn-gradient text-primary-foreground font-semibold">
                  {t.button}
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {t.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-sm bg-card/30 backdrop-blur-sm rounded-lg p-3 border border-border/30">
                <Repeat className="h-5 w-5 text-accent flex-shrink-0" />
                <span className="text-foreground/80">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Side Advertisement Areas */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 hidden xl:block z-10">
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-2">{t.adLabel}</p>
          <div className="w-32 h-64 bg-gradient-to-b from-muted/30 to-muted/60 rounded-md flex items-center justify-center">
            <span className="text-muted-foreground text-xs transform -rotate-90 whitespace-nowrap">160×600 Skyscraper</span>
          </div>
        </div>
      </div>

      <div className="fixed right-4 top-1/2 -translate-y-1/2 hidden xl:block z-10">
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-2">{t.adLabel}</p>
          <div className="w-32 h-64 bg-gradient-to-b from-muted/30 to-muted/60 rounded-md flex items-center justify-center">
            <span className="text-muted-foreground text-xs transform -rotate-90 whitespace-nowrap">160×600 Skyscraper</span>
          </div>
        </div>
      </div>

      {/* Video Player Section */}
      <section className="py-8 max-w-6xl mx-auto px-4">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh] bg-card/30 rounded-lg">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Loading player...</p>
          </div>
        </div>}>
          <VideoPlayer initialUrl={url} />
        </Suspense>
        
        {/* Bottom Advertisement */}
        <div className="mt-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground mb-3">{t.adLabel}</p>
          <div className="h-24 bg-gradient-to-r from-muted/30 to-muted/60 rounded-md flex items-center justify-center">
            <span className="text-muted-foreground text-sm">728×90 Bottom Banner Ad Space</span>
          </div>
        </div>
      </section>
    </div>
  )
}
