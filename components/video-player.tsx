"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Play, Pause, RotateCcw, Share2, Repeat, Settings, Keyboard, Bookmark } from "lucide-react"

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false })

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
  return /dailymotion\.com\/video\//.test(url) || /dai\.ly\//.test(url)
}

const extractDailymotionVideoId = (url: string): string | null => {
  // dai.ly short format
  const shortMatch = url.match(/dai\.ly\/([^?&]+)/)
  if (shortMatch) return shortMatch[1]
  
  // Standard dailymotion.com format
  const standardMatch = url.match(/dailymotion\.com\/video\/([^?&]+)/)
  return standardMatch ? standardMatch[1] : null
}

const normalizeDailymotionUrl = (url: string): string => {
  const videoId = extractDailymotionVideoId(url)
  if (!videoId) return url
  
  // Always return the standard format for ReactPlayer
  return `https://www.dailymotion.com/video/${videoId}`
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
    // A点とB点の初期値を設定（後でdurationが取得できたら更新）
    a: 0,
    b: undefined, // durationが分かるまでは未設定
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragTarget, setDragTarget] = useState<'a' | 'b' | null>(null)

  // Update URL when initialUrl changes (realtime reflection)
  useEffect(() => {
    if (initialUrl !== undefined) {
      const normalizedUrl = isDailymotionUrl(initialUrl) 
        ? normalizeDailymotionUrl(initialUrl) 
        : initialUrl
      setUrl(normalizedUrl)
      setError(null)
      setIsReady(false)
      // URL変更時にAB値をリセット
      setSettings(prev => ({
        ...prev,
        a: 0,
        b: undefined
      }))
    }
  }, [initialUrl])

  // Loading timeout to prevent infinite loading
  useEffect(() => {
    if (url && isValidUrl(url) && !isReady && !error) {
      const timeout = setTimeout(() => {
        if (!isReady && !error) {
          setError({
            message: 'Video loading timed out. Please check the URL.',
            type: 'timeout_error'
          })
        }
      }, 15000)

      return () => clearTimeout(timeout)
    }
  }, [url, isReady, error])

  // Initialize from URL params (for direct /player page access)
  useEffect(() => {
    const src = searchParams.get("src")
    const a = searchParams.get("a")
    const b = searchParams.get("b")
    const loop = searchParams.get("loop")
    const rate = searchParams.get("rate")

    if (src && !initialUrl) {
      const normalizedUrl = isDailymotionUrl(src) 
        ? normalizeDailymotionUrl(src) 
        : src
      setUrl(normalizedUrl)
      setError(null)
      setIsReady(false)
    }
    if (a || b || loop || rate) {
      setSettings((prev) => ({
        ...prev,
        a: a ? Number.parseFloat(a) : 0, // デフォルトは0秒
        b: b ? Number.parseFloat(b) : undefined, // デフォルトは動画の最後（durationで設定）
        loopMode: loop === "inf" ? "infinite" : loop === "off" ? "off" : "finite",
        rate: rate ? Number.parseFloat(rate) : 1,
      }))
    }
  }, [searchParams, initialUrl])


  // AB Loop logic
  useEffect(() => {
    if (settings.loopMode !== "off" && settings.a !== undefined && settings.b !== undefined) {
      if (currentTime >= settings.b) {
        playerRef.current?.seekTo(settings.a, "seconds")
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
    if (!isDragging) setCurrentTime(state.playedSeconds)
  }, [isDragging])

  const handleDuration = useCallback((duration: number) => {
    setDuration(duration)
    // durationが取得できたら、B点をデフォルトで動画の最後に設定
    setSettings(prev => ({
      ...prev,
      b: prev.b !== undefined ? prev.b : duration // URLパラメータでB点が指定されていない場合のみ設定
    }))
  }, [])

  const handleReady = useCallback(() => {
    setIsReady(true)
    setError(null)
    setPlaying(false)

    // YouTube の 0秒問題対策: ready後に getDuration を再取得
    const trySet = () => {
      const d = playerRef.current?.getDuration?.()
      if (typeof d === 'number' && isFinite(d) && d > 0) {
        setDuration(d)
        // durationが取得できたら、B点をデフォルトで動画の最後に設定
        setSettings(prev => ({
          ...prev,
          b: prev.b !== undefined ? prev.b : d // URLパラメータでB点が指定されていない場合のみ設定
        }))
        return true
      }
      return false
    }

    if (!trySet()) {
      const id = setInterval(() => {
        if (trySet()) clearInterval(id)
      }, 250)
      setTimeout(() => clearInterval(id), 3000)
    }
  }, [])

  const handleError = useCallback((error: unknown) => {
    // 完全に空のオブジェクトのみスキップ
    if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
      return
    }

    console.error('ReactPlayer error:', error)
    
    // HTML5 Errorイベントからメディアエラーの詳細を取得
    let errorMessage = 'Failed to load video.'
    
    if (error.target && error.target.error) {
      const mediaError = error.target.error
      switch (mediaError.code) {
        case 1: // MEDIA_ERR_ABORTED
          errorMessage = 'Video loading was interrupted.'
          break
        case 2: // MEDIA_ERR_NETWORK
          errorMessage = 'Network error. Please check your connection.'
          break
        case 3: // MEDIA_ERR_DECODE
          errorMessage = 'Video format is corrupted.'
          break
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          // Dailymotion特有のエラーメッセージ
          if (isDailymotionUrl(url)) {
            errorMessage = 'Cannot load Dailymotion video. It may not be embeddable.'
          } else {
            errorMessage = 'This video format is not supported.'
          }
          break
        default:
          errorMessage = 'Please check if the URL is correct.'
      }
    } else if (isDailymotionUrl(url)) {
      // Dailymotion特有の問題
      errorMessage = 'Cannot access Dailymotion video. Please check the URL format or try a different video.'
    }
    
    setError({
      message: errorMessage,
      type: 'loading_error'
    })
    setIsReady(false)
  }, [url])

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
  const parseTime = (timeString: string) => {
    if (!timeString) return 0
    const parts = timeString.split(':')
    if (parts.length === 2) {
      const mins = parseInt(parts[0]) || 0
      const secs = parseInt(parts[1]) || 0
      return mins * 60 + secs
    }
    return parseFloat(timeString) || 0
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
    const newTime = ((e.clientX - rect.left) / rect.width) * duration
    playerRef.current?.seekTo(newTime, "seconds")
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
                    <p className="text-lg font-medium mb-2">Video Loading Error</p>
                    <p className="text-sm">{error.message}</p>
                    <Button 
                      onClick={() => {
                        setError(null)
                        setIsReady(false)
                      }} 
                      variant="outline" 
                      className="mt-4 cursor-pointer"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <ReactPlayer
                    key={url}
                    ref={playerRef}
                    url={url}
                    playing={playing}
                    volume={settings.volume}
                    playbackRate={settings.rate}
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onReady={handleReady}
                    onError={handleError}
                    controls={false}
                    width="100%"
                    height="auto"
                    style={{ aspectRatio: "16/9" }}
                  />
                  {!isReady && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Controls */}
              {isReady && (
                <div className="space-y-4">
                  {/* Progress Bar with AB markers */}
                  <div className="relative cursor-pointer">
                    <div 
                      className="progress-bar w-full h-2 bg-muted rounded-full relative cursor-pointer"
                      onClick={handleProgressBarClick}
                    >
                      {/* Progress */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                      
                      {/* A Marker */}
                      {settings.a !== undefined && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-grab active:cursor-grabbing shadow-lg"
                          style={{ left: `${(settings.a / duration) * 100}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                          onMouseDown={(e) => handleMarkerDrag(e, 'a')}
                          title={`Start: ${formatTime(settings.a)}`}
                        />
                      )}
                      
                      {/* B Marker */}
                      {settings.b !== undefined && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 border-2 border-white rounded-full cursor-grab active:cursor-grabbing shadow-lg"
                          style={{ left: `${(settings.b / duration) * 100}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                          onMouseDown={(e) => handleMarkerDrag(e, 'b')}
                          title={`End: ${formatTime(settings.b)}`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Time Display */}
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex justify-center gap-2">
                    {/* A Point Button */}
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setSettings(prev => ({ ...prev, a: currentTime }))}
                      disabled={!isReady}
                      className={`cursor-pointer transition-all duration-200 ${
                        settings.a !== undefined 
                          ? "bg-green-600 text-white border-green-600 hover:bg-green-700 shadow-md" 
                          : "bg-transparent text-green-600 border-green-600 hover:bg-green-50"
                      }`}
                      title={`Set start point (current: ${settings.a !== undefined ? formatTime(settings.a) : 'not set'})`}
                    >
                      <Bookmark className="h-5 w-5" />
                      <span className="ml-1 font-bold">A</span>
                    </Button>

                    {/* Play/Pause Button */}
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setPlaying(!playing)}
                      className="cursor-pointer"
                    >
                      {playing ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6" />
                      )}
                    </Button>

                    {/* B Point Button */}
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setSettings(prev => ({ ...prev, b: currentTime }))}
                      disabled={!isReady}
                      className={`cursor-pointer transition-all duration-200 ${
                        settings.b !== undefined 
                          ? "bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-md" 
                          : "bg-transparent text-red-600 border-red-600 hover:bg-red-50"
                      }`}
                      title={`Set end point (current: ${settings.b !== undefined ? formatTime(settings.b) : 'not set'})`}
                    >
                      <Bookmark className="h-5 w-5" />
                      <span className="ml-1 font-bold">B</span>
                    </Button>

                    {/* Loop Button */}
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setSettings(prev => ({ 
                        ...prev, 
                        loopMode: prev.loopMode === "off" ? "infinite" : "off" 
                      }))}
                      disabled={!isReady}
                      className={`cursor-pointer transition-all duration-200 ${
                        settings.loopMode !== "off" 
                          ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md" 
                          : "bg-transparent text-gray-400 border-gray-300 hover:bg-gray-50 hover:text-gray-600"
                      }`}
                      title={`Toggle loop (currently: ${settings.loopMode})`}
                    >
                      <Repeat className="h-6 w-6" />
                      <span className="ml-1 text-xs font-medium">
                        {settings.loopMode !== "off" ? "ON" : "OFF"}
                      </span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Settings */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    AB Loop Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* A Point */}
                  <div className="space-y-2">
                    <Label htmlFor="a-point">Loop Start</Label>
                    <div className="flex gap-2">
                      <Input
                        id="a-point"
                        type="text"
                        placeholder="0:00"
                        value={settings.a !== undefined ? formatTime(settings.a) : ""}
                        onChange={(e) => {
                          const timeValue = parseTime(e.target.value)
                          setSettings(prev => ({ 
                            ...prev, 
                            a: timeValue
                          }))
                        }}
                        disabled={!isReady}
                        className="cursor-text"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSettings(prev => ({ ...prev, a: currentTime }))}
                        disabled={!isReady}
                        className="cursor-pointer"
                      >
                        Current
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {settings.a !== undefined ? formatTime(settings.a) : "Not Set"}
                    </p>
                  </div>

                  {/* B Point */}
                  <div className="space-y-2">
                    <Label htmlFor="b-point">Loop End</Label>
                    <div className="flex gap-2">
                      <Input
                        id="b-point"
                        type="text"
                        placeholder="0:00"
                        value={settings.b !== undefined ? formatTime(settings.b) : ""}
                        onChange={(e) => {
                          const timeValue = parseTime(e.target.value)
                          setSettings(prev => ({ 
                            ...prev, 
                            b: timeValue
                          }))
                        }}
                        disabled={!isReady}
                        className="cursor-text"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSettings(prev => ({ ...prev, b: currentTime }))}
                        disabled={!isReady}
                        className="cursor-pointer"
                      >
                        Current
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {settings.b !== undefined ? formatTime(settings.b) : "Not Set"}
                    </p>
                  </div>

                  {/* Loop Mode */}
                  <div className="space-y-2">
                    <Label>Loop Mode</Label>
                    <RadioGroup 
                      value={settings.loopMode} 
                      onValueChange={(value: "off" | "infinite" | "finite") => 
                        setSettings(prev => ({ ...prev, loopMode: value }))
                      }
                      className="cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 cursor-pointer">
                        <RadioGroupItem value="off" id="off" className="cursor-pointer" />
                        <Label htmlFor="off" className="cursor-pointer">Off</Label>
                      </div>
                      <div className="flex items-center space-x-2 cursor-pointer">
                        <RadioGroupItem value="infinite" id="infinite" className="cursor-pointer" />
                        <Label htmlFor="infinite" className="cursor-pointer">Infinite Loop</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Playback Rate */}
                  <div className="space-y-2">
                    <Label htmlFor="rate">Playback Speed: {settings.rate}x</Label>
                    <Slider
                      id="rate"
                      min={0.25}
                      max={2}
                      step={0.25}
                      value={[settings.rate]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, rate: value }))}
                      disabled={!isReady}
                      className="cursor-pointer"
                    />
                  </div>

                  {/* Volume */}
                  <div className="space-y-2">
                    <Label htmlFor="volume">Volume: {Math.round(settings.volume * 100)}%</Label>
                    <Slider
                      id="volume"
                      min={0}
                      max={1}
                      step={0.1}
                      value={[settings.volume]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, volume: value }))}
                      disabled={!isReady}
                      className="cursor-pointer"
                    />
                  </div>

                  {/* Share Button */}
                  <Button 
                    onClick={generateShareUrl}
                    disabled={!isReady}
                    className="w-full cursor-pointer"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Copy Share Link
                  </Button>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Keyboard className="h-5 w-5" />
                    Keyboard Shortcuts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>[ キー</span>
                    <span>Set Start Point</span>
                  </div>
                  <div className="flex justify-between">
                    <span>] キー</span>
                    <span>Set End Point</span>
                  </div>
                  <div className="flex justify-between">
                    <span>\ キー</span>
                    <span>Toggle Loop</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Space</span>
                    <span>Play/Pause</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[50vh] bg-muted/30 rounded-lg">
            <div className="text-center text-muted-foreground p-8">
              <Play className="h-16 w-16 mx-auto opacity-50 mb-4" />
              <p className="text-xl font-medium mb-2">Please enter a video URL</p>
              <p className="text-sm">Paste a video URL in the form above to display the player here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}