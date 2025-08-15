"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import ReactPlayer from "react-player"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, Share2, ArrowLeft, ArrowRight, Repeat } from "lucide-react"

interface ABSettings {
  a?: number
  b?: number
  loopMode: "off" | "finite" | "infinite"
  loopCount: number
  rate: number
  volume: number
}

export function VideoPlayer() {
  const searchParams = useSearchParams()
  const playerRef = useRef<ReactPlayer>(null)

  const [url, setUrl] = useState("")
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [settings, setSettings] = useState<ABSettings>({
    loopMode: "off",
    loopCount: 1,
    rate: 1,
    volume: 0.8,
  })

  // Initialize from URL params
  useEffect(() => {
    const src = searchParams.get("src")
    const a = searchParams.get("a")
    const b = searchParams.get("b")
    const loop = searchParams.get("loop")
    const rate = searchParams.get("rate")

    if (src) setUrl(src)
    if (a || b || loop || rate) {
      setSettings((prev) => ({
        ...prev,
        a: a ? Number.parseFloat(a) : undefined,
        b: b ? Number.parseFloat(b) : undefined,
        loopMode: loop === "inf" ? "infinite" : loop === "off" ? "off" : "finite",
        rate: rate ? Number.parseFloat(rate) : 1,
      }))
    }
  }, [searchParams])

  // AB Loop logic
  useEffect(() => {
    if (settings.loopMode !== "off" && settings.a !== undefined && settings.b !== undefined) {
      if (currentTime >= settings.b) {
        playerRef.current?.seekTo(settings.a)
      }
    }
  }, [currentTime, settings])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case "[":
          setSettings((prev) => ({ ...prev, a: currentTime }))
          break
        case "]":
          setSettings((prev) => ({ ...prev, b: currentTime }))
          break
        case "\\":
          setSettings((prev) => ({
            ...prev,
            loopMode: prev.loopMode === "off" ? "infinite" : "off",
          }))
          break
        case " ":
          e.preventDefault()
          setPlaying((prev) => !prev)
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentTime])

  const handleProgress = useCallback((state: { playedSeconds: number }) => {
    setCurrentTime(state.playedSeconds)
  }, [])

  const handleDuration = useCallback((duration: number) => {
    setDuration(duration)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const generateShareUrl = () => {
    const params = new URLSearchParams()
    params.set("src", url)
    if (settings.a !== undefined) params.set("a", settings.a.toString())
    if (settings.b !== undefined) params.set("b", settings.b.toString())
    if (settings.loopMode !== "off") params.set("loop", settings.loopMode === "infinite" ? "inf" : "finite")
    if (settings.rate !== 1) params.set("rate", settings.rate.toString())

    const shareUrl = `${window.location.origin}/player?${params.toString()}`
    navigator.clipboard.writeText(shareUrl)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* URL Input */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="Paste video URL (YouTube, Vimeo, Dailymotion, Twitch, or direct link)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => setUrl("")} variant="outline">
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Video Player */}
        {url && (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <ReactPlayer
                ref={playerRef}
                url={url}
                width="100%"
                height="100%"
                playing={playing}
                volume={settings.volume}
                playbackRate={settings.rate}
                onProgress={handleProgress}
                onDuration={handleDuration}
                controls={false}
              />
            </div>

            {/* Controls */}
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" size="sm" onClick={() => playerRef.current?.seekTo(currentTime - 10)}>
                    <ArrowLeft className="h-4 w-4" />
                    -10s
                  </Button>

                  <Button size="lg" onClick={() => setPlaying(!playing)} className="gap-2">
                    {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => playerRef.current?.seekTo(currentTime + 10)}>
                    +10s
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <Slider
                    value={[currentTime]}
                    max={duration}
                    step={0.1}
                    onValueChange={([value]) => playerRef.current?.seekTo(value)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* AB Controls */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    variant={settings.a !== undefined ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings((prev) => ({ ...prev, a: currentTime }))}
                    className="gap-2"
                  >
                    A: {settings.a !== undefined ? formatTime(settings.a) : "Set"}
                  </Button>

                  <Button
                    variant={settings.b !== undefined ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings((prev) => ({ ...prev, b: currentTime }))}
                    className="gap-2"
                  >
                    B: {settings.b !== undefined ? formatTime(settings.b) : "Set"}
                  </Button>

                  <Button
                    variant={settings.loopMode !== "off" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        loopMode: prev.loopMode === "off" ? "infinite" : "off",
                      }))
                    }
                    className="gap-2"
                  >
                    <Repeat className="h-4 w-4" />
                    Loop
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSettings((prev) => ({ ...prev, a: undefined, b: undefined, loopMode: "off" }))}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Speed: {settings.rate}x</label>
                    <Slider
                      value={[settings.rate]}
                      min={0.5}
                      max={2}
                      step={0.25}
                      onValueChange={([value]) => setSettings((prev) => ({ ...prev, rate: value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Volume: {Math.round(settings.volume * 100)}%</label>
                    <Slider
                      value={[settings.volume]}
                      min={0}
                      max={1}
                      step={0.1}
                      onValueChange={([value]) => setSettings((prev) => ({ ...prev, volume: value }))}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateShareUrl}
                      className="gap-2 w-full bg-transparent"
                    >
                      <Share2 className="h-4 w-4" />
                      Share Link
                    </Button>
                  </div>
                </div>

                {/* Status */}
                {settings.loopMode !== "off" && settings.a !== undefined && settings.b !== undefined && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Loop: {formatTime(settings.a)} - {formatTime(settings.b)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
              <div>
                <kbd className="bg-muted px-1 rounded">[</kbd> Set A point
              </div>
              <div>
                <kbd className="bg-muted px-1 rounded">]</kbd> Set B point
              </div>
              <div>
                <kbd className="bg-muted px-1 rounded">\</kbd> Toggle loop
              </div>
              <div>
                <kbd className="bg-muted px-1 rounded">Space</kbd> Play/Pause
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
