"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import ReactPlayer from "react-player/lib"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface VideoPlayerProps {
  initialUrl?: string
}

interface PlayerError {
  message: string
  type: string
}

// Dailymotion utility functions
const isDailymotionUrl = (url: string): boolean => {
  return /dailymotion\.com\/video\//.test(url)
}

const extractDailymotionVideoId = (url: string): string | null => {
  const match = url.match(/dailymotion\.com\/video\/([^?&]+)/)
  return match ? match[1] : null
}

export function VideoPlayer({ initialUrl }: VideoPlayerProps = {}) {
  const searchParams = useSearchParams()
  const playerRef = useRef<ReactPlayer>(null)

  const [url, setUrl] = useState(initialUrl || "")
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<PlayerError | null>(null)
  const [settings, setSettings] = useState<ABSettings>({
    loopMode: "off",
    loopCount: 1,
    rate: 1,
    volume: 0.8,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragTarget, setDragTarget] = useState<'progress' | 'a' | 'b' | null>(null)

  // Update URL when initialUrl changes (realtime reflection)
  useEffect(() => {
    if (initialUrl !== undefined) {
      setUrl(initialUrl)
      setError(null)
      setIsReady(false)
    }
  }, [initialUrl])

  // Initialize from URL params (for direct /player page access)
  useEffect(() => {
    const src = searchParams.get("src")
    const a = searchParams.get("a")
    const b = searchParams.get("b")
    const loop = searchParams.get("loop")
    const rate = searchParams.get("rate")

    if (src && !initialUrl) {
      setUrl(src)
      setError(null)
      setIsReady(false)
    }
    if (a || b || loop || rate) {
      setSettings((prev) => ({
        ...prev,
        a: a ? Number.parseFloat(a) : undefined,
        b: b ? Number.parseFloat(b) : undefined,
        loopMode: loop === "inf" ? "infinite" : loop === "off" ? "off" : "finite",
        rate: rate ? Number.parseFloat(rate) : 1,
      }))
    }
  }, [searchParams, initialUrl])

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

  const handleReady = useCallback(() => {
    setIsReady(true)
    setError(null)
  }, [])

  const handleError = useCallback((error: any) => {
    console.error('ReactPlayer error:', error)
    setError({
      message: 'ビデオの読み込みに失敗しました。URLが正しいか確認してください。',
      type: 'loading_error'
    })
    setIsReady(false)
  }, [])

  const isValidUrl = (url: string) => {
    if (!url) return false
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

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

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration
    playerRef.current?.seekTo(newTime)
  }

  const handleMarkerDrag = (e: React.MouseEvent<HTMLDivElement>, marker: 'a' | 'b') => {
    e.preventDefault()
    setIsDragging(true)
    setDragTarget(marker)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const progressBar = (moveEvent.target as HTMLElement).closest('.progress-bar')
      if (!progressBar || !duration) return

      const rect = progressBar.getBoundingClientRect()
      const x = moveEvent.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const newTime = percentage * duration

      setSettings((prev) => ({
        ...prev,
        [marker]: newTime,
      }))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setDragTarget(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className="min-h-[50vh] bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Video Player - Show placeholder when no URL */}
        {url && isValidUrl(url) ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Video */}
            <div className="space-y-4">
              {error ? (
                <div className="flex items-center justify-center bg-muted rounded-lg" style={{ aspectRatio: "16/9" }}>
                  <div className="text-center text-muted-foreground p-8">
                    <Play className="h-12 w-12 mx-auto opacity-50 mb-4" />
                    <p className="text-lg font-medium mb-2">動画の読み込みエラー</p>
                    <p className="text-sm">{error.message}</p>
                    <Button 
                      onClick={() => {
                        setError(null)
                        setIsReady(false)
                      }} 
                      variant="outline" 
                      className="mt-4"
                    >
                      再試行
                    </Button>
                  </div>
                </div>
              ) : isDailymotionUrl(url) ? (
                <div className="relative">
                  <iframe
                    src={`https://www.dailymotion.com/embed/video/${extractDailymotionVideoId(url)}`}
                    width="100%"
                    height="315"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture"
                    style={{ aspectRatio: "16/9", borderRadius: "8px" }}
                    onLoad={() => {
                      setIsReady(true)
                      setError(null)
                    }}
                    onError={() => {
                      setError({
                        message: 'Dailymotion動画の読み込みに失敗しました。URLが正しいか確認してください。',
                        type: 'dailymotion_error'
                      })
                      setIsReady(false)
                    }}
                  />
                  {!isReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <Play className="h-8 w-8 mx-auto opacity-50 mb-2 animate-pulse" />
                        <p className="text-sm">Dailymotion動画を読み込み中...</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <ReactPlayer
                    ref={playerRef}
                    url={url}
                    playing={playing}
                    volume={settings.volume}
                    playbackRate={settings.rate}
                    onProgress={handleProgress}
                    onDurationChange={handleDuration}
                    onReady={handleReady}
                    onError={handleError}
                    controls={false}
                    width="100%"
                    height="auto"
                    style={{ aspectRatio: "16/9" }}
                    config={{
                      youtube: {
                        playerVars: {
                          showinfo: 1,
                          origin: typeof window !== 'undefined' ? window.location.origin : undefined
                        }
                      }
                    }}
                  />
                  {!isReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <Play className="h-8 w-8 mx-auto opacity-50 mb-2 animate-pulse" />
                        <p className="text-sm">動画を読み込み中...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Progress Bar */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  {/* Progress Bar with A/B Markers */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <div 
                      className="progress-bar relative h-8 bg-gray-300 dark:bg-gray-700 rounded-lg cursor-pointer group border border-gray-400 dark:border-gray-600"
                      onClick={handleProgressBarClick}
                    >
                      {/* Progress Track */}
                      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                      
                      {/* Played Progress */}
                      <div 
                        className="absolute left-0 top-0 h-full bg-blue-500 dark:bg-blue-400 rounded-lg transition-all duration-100 z-10"
                        style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                      />
                      
                      {/* A-B Loop Section */}
                      {settings.a !== undefined && settings.b !== undefined && (
                        <div
                          className="absolute top-0 h-full bg-yellow-400/50 dark:bg-yellow-300/40 rounded-lg z-20"
                          style={{
                            left: `${(settings.a / duration) * 100}%`,
                            width: `${((settings.b - settings.a) / duration) * 100}%`,
                          }}
                        />
                      )}
                      
                      {/* A Marker */}
                      {settings.a !== undefined && (
                        <div
                          className="absolute top-0 h-full w-1 cursor-grab active:cursor-grabbing z-30"
                          style={{ left: `${(settings.a / duration) * 100}%` }}
                          onMouseDown={(e) => handleMarkerDrag(e, 'a')}
                        >
                          <div className="w-4 h-8 bg-green-600 dark:bg-green-500 rounded-sm -ml-2 flex items-center justify-center shadow-lg">
                            <span className="text-xs font-bold text-white">A</span>
                          </div>
                          <div className="absolute top-9 left-1/2 transform -translate-x-1/2 bg-green-600 dark:bg-green-500 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">
                            {formatTime(settings.a)}
                          </div>
                        </div>
                      )}
                      
                      {/* B Marker */}
                      {settings.b !== undefined && (
                        <div
                          className="absolute top-0 h-full w-1 cursor-grab active:cursor-grabbing z-30"
                          style={{ left: `${(settings.b / duration) * 100}%` }}
                          onMouseDown={(e) => handleMarkerDrag(e, 'b')}
                        >
                          <div className="w-4 h-8 bg-red-600 dark:bg-red-500 rounded-sm -ml-2 flex items-center justify-center shadow-lg">
                            <span className="text-xs font-bold text-white">B</span>
                          </div>
                          <div className="absolute top-9 left-1/2 transform -translate-x-1/2 bg-red-600 dark:bg-red-500 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">
                            {formatTime(settings.b)}
                          </div>
                        </div>
                      )}
                      
                      {/* Current Position Indicator */}
                      <div
                        className="absolute top-0 h-full w-1 bg-white dark:bg-gray-100 shadow-lg rounded-sm pointer-events-none z-40 border border-gray-400 dark:border-gray-300"
                        style={{ left: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>

                  {/* Basic Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      onClick={() => setPlaying((prev) => !prev)}
                      variant="outline"
                      size="lg"
                      className="gap-2"
                    >
                      {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      {playing ? "Pause" : "Play"}
                    </Button>
                  </div>

                  {/* A/B Controls */}
                  <div className="flex flex-wrap gap-2">
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
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Speed: {settings.rate}x</label>
                        <Slider
                          value={[settings.rate]}
                          onValueChange={([value]) => setSettings((prev) => ({ ...prev, rate: value }))}
                          min={0.25}
                          max={2}
                          step={0.05}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Volume: {Math.round(settings.volume * 100)}%</label>
                        <Slider
                          value={[settings.volume]}
                          onValueChange={([value]) => setSettings((prev) => ({ ...prev, volume: value }))}
                          min={0}
                          max={1}
                          step={0.05}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={generateShareUrl} variant="outline" size="sm" className="flex-1 gap-2">
                        <Share2 className="h-4 w-4" />
                        Copy Share Link
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Keyboard: [ = A point | ] = B point | \ = Toggle loop | Space = Play/Pause</p>
                      <p>
                        Time: {formatTime(currentTime)} / {formatTime(duration)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Instructions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Repeat className="h-5 w-5" />
                    AB Repeat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Set A and B points to loop any section of the video. Perfect for language learning, music practice, and
                      studying complex content.
                    </p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>1. Set A point at the start of the section you want to loop</p>
                      <p>2. Set B point at the end of the section</p>
                      <p>3. Toggle loop mode to start repeating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center text-muted-foreground">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Play className="h-12 w-12 mx-auto opacity-50" />
                  <p className="text-lg font-medium">{url && !isValidUrl(url) ? "無効なURLです" : "上記に動画URLを入力してください"}</p>
                  <p className="text-sm">{url && !isValidUrl(url) ? "正しいURL形式で入力してください" : "YouTube, Vimeo, Dailymotion (Player Embed対応), Twitch, または直接リンク"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}