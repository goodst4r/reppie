"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Play, Pause, Share2, Repeat, Settings, Keyboard, Bookmark } from "lucide-react"

const ReactPlayer = dynamic(() => import("react-player/lazy"), {
  ssr: false,
  loading: () => <div className="w-full aspect-video bg-black/40 rounded-lg" />,
})

/* ========================
   共通設定/型
======================== */
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

/* ========================
   Dailymotion ユーティリティ
======================== */
const isDailymotionUrl = (url: string): boolean => {
  return /dailymotion\.com\/video\//.test(url) || /dai\.ly\//.test(url)
}

const extractDailymotionVideoId = (url: string): string | null => {
  const shortMatch = url.match(/dai\.ly\/([^?&]+)/)
  if (shortMatch) return shortMatch[1]
  const standardMatch = url.match(/dailymotion\.com\/video\/([^?&]+)/)
  return standardMatch ? standardMatch[1] : null
}

const normalizeDailymotionUrl = (url: string): string => {
  const videoId = extractDailymotionVideoId(url)
  if (!videoId) return url
  return `https://www.dailymotion.com/video/${videoId}`
}

/* ========================
   Dailymotion AB プレイヤー（差し替え版）
======================== */
type DMExternalApi = {
  seekTo: (sec: number) => void
  play: () => void
  pause: () => void
  getCurrentTime: () => Promise<number>
  getDuration: () => Promise<number>
}

interface DailymotionABPlayerProps {
  videoId: string
  playerId?: string
  settings: ABSettings
  onSettingsChange: (settings: Partial<ABSettings>) => void
  onProgress: (time: number) => void
  onDuration: (duration: number) => void
  onReady: () => void
  onError: (error: unknown) => void
  registerApi?: (api: DMExternalApi | null) => void
  onLoop?: () => void
}

const DailymotionABPlayer = ({
  videoId,
  playerId = "x7z85hl",
  settings,
  onSettingsChange,
  onProgress,
  onDuration,
  onReady,
  onError,
  registerApi,
  onLoop,
}: DailymotionABPlayerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<any>(null)
  const inAdRef = useRef(false)
  const containerIdRef = useRef(`dailymotion-player-${Math.random().toString(36).slice(2)}`)

  // 最新 settings / handlers
  const settingsRef = useRef(settings)
  useEffect(() => { settingsRef.current = settings }, [settings])

  const handlersRef = useRef({ onSettingsChange, onProgress, onDuration, onReady, onError, onLoop })
  useEffect(() => {
    handlersRef.current = { onSettingsChange, onProgress, onDuration, onReady, onError, onLoop }
  }, [onSettingsChange, onProgress, onDuration, onReady, onError, onLoop])

  // 有限ループ残回数
  const loopLeftRef = useRef<number>(settings.loopMode === "finite" ? Math.max(0, settings.loopCount) : 0)
  useEffect(() => {
    loopLeftRef.current = settings.loopMode === "finite" ? Math.max(0, settings.loopCount) : 0
  }, [settings.loopMode, settings.loopCount])

  // seek 直後のスパム回避
  const lastSeekAtRef = useRef<number>(0)
  const ignoreAfterSeekMs = 350

  // Strict Mode 二重初期化ガード
  const initializedRef = useRef(false)

  // timechange が来ない環境向けのフォールバック
  const lastEventAtRef = useRef<number>(0)
  const rafIdRef = useRef<number | null>(null)
  const RAF_INTERVAL_MS = 200 // 200ms 以上イベントが来なければポーリング

  // 共通：時刻抽出（イベント / getState() どちらでも使う）
  const extractTime = (state: any): number => {
    if (state == null) return 0
    if (typeof state === "number" && isFinite(state)) return state
    // 代表的なキーを広くサポート
    return (
      Number(state.videoCurrentTime) ||
      Number(state.currentTime) ||
      Number(state.time) ||
      0
    )
  }

  // 共通：AB判定＆シーク
  const maybeLoop = useCallback((t: number, p: any) => {
    const A = settingsRef.current.a
    const B = settingsRef.current.b
    if (inAdRef.current || settingsRef.current.loopMode === "off" || A == null || B == null) return

    if (performance.now() - lastSeekAtRef.current < ignoreAfterSeekMs) return

    const EPS = 0.05
    if (B > A + EPS && t >= B - EPS) {
      if (settingsRef.current.loopMode === "infinite") {
        lastSeekAtRef.current = performance.now()
        p.seek(A)
        p.play?.()
        handlersRef.current.onLoop?.()
      } else if (settingsRef.current.loopMode === "finite") {
        if (loopLeftRef.current > 1) {
          loopLeftRef.current -= 1
          lastSeekAtRef.current = performance.now()
          p.seek(A)
          p.play?.()
          handlersRef.current.onLoop?.()
        } else {
          handlersRef.current.onSettingsChange?.({ loopMode: "off", loopCount: 0 })
        }
      }
    }
  }, [])

  // RAF フォールバック
  const startRaf = useCallback(() => {
    if (rafIdRef.current != null) return
    const tick = async () => {
      rafIdRef.current = requestAnimationFrame(tick)
      if (!playerRef.current) return
      // 直近の timechange から一定時間以上たっている場合のみチェック
      if (performance.now() - lastEventAtRef.current < RAF_INTERVAL_MS) return
      try {
        const s = await playerRef.current.getState?.()
        const t = extractTime(s)
        handlersRef.current.onProgress?.(t)
        maybeLoop(t, playerRef.current)
      } catch {}
    }
    rafIdRef.current = requestAnimationFrame(tick)
  }, [maybeLoop])

  const stopRaf = useCallback(() => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!videoId) return
    if (initializedRef.current) return
    initializedRef.current = true

    const sdkSrc = `https://geo.dailymotion.com/libs/player/${playerId}.js`
    const existing = document.querySelector(`script[src="${sdkSrc}"]`) as HTMLScriptElement | null

    if (playerRef.current) return

    // CSPヒント（任意）
    try {
      const metaCsp = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
      if (metaCsp && !metaCsp.getAttribute("content")?.includes("dailymotion.com")) {
        console.warn("CSP may block Dailymotion iframe. Consider updating CSP headers.")
      }
    } catch {}

    const ensurePlayer = () => {
      if (playerRef.current) return
      const dm = (window as any).dailymotion as {
        createPlayer: (
          containerId: string,
          config: { video: string; params: Record<string, unknown> }
        ) => Promise<{
          on: (event: string, callback: (data?: any) => void) => void
          seek: (time: number) => void
          play?: () => void
          pause?: () => void
          getState?: () => Promise<{ videoCurrentTime?: number; videoDuration?: number }>
          setVolume?: (volume: number) => Promise<void>
          destroy?: () => void
        }>
      }
      if (!dm || !containerRef.current) {
        console.warn("Dailymotion SDK not loaded or container not ready")
        return
      }

      dm.createPlayer(containerIdRef.current, {
        video: videoId,
        params: {
          startTime: 0,
          loop: false,
          autoplay: false,
          mute: false,
          queue: false,
          "ui-embed-sandbox": "allow-scripts allow-same-origin allow-popups allow-forms",
          "iframe-sandbox": "allow-scripts allow-same-origin allow-popups allow-forms",
        },
      })
        .then((p) => {
          playerRef.current = p

          // noisy warn を抑制（cleanupで戻す）
          const originalConsoleWarn = console.warn
          console.warn = (...args) => {
            const msg = args.join(" ")
            if (
              msg.includes("Unknown event") ||
              msg.includes("isEligibleForPipDisplay") ||
              msg.includes("https://geo.dailymotion.com/libs/player/")
            ) return
            originalConsoleWarn.apply(console, args as any)
          }
          const cleanupWarn = () => { console.warn = originalConsoleWarn }

          handlersRef.current.onReady?.()

          // 初期 duration
          p.getState?.()
            .then((s) => {
              const d = Number((s as any)?.videoDuration) || 0
              if (d > 0) handlersRef.current.onDuration?.(d)
            })
            .catch(() => {})

          // 外部制御API
          registerApi?.({
            seekTo: (sec) => { lastSeekAtRef.current = performance.now(); p.seek(sec) },
            play: () => p.play?.(),
            pause: () => p.pause?.(),
            getCurrentTime: async () => {
              const s = await p.getState?.()
              return extractTime(s)
            },
            getDuration: async () => {
              const s = await p.getState?.()
              return Number((s as any)?.videoDuration) || 0
            },
          })

          const safeOn = (eventName: string, handler: (data?: unknown) => void) => {
            try { p.on(eventName, handler) } catch (e) { console.warn(`Failed to register ${eventName} handler:`, e) }
          }

          // イベント名バリエーション対応
          const EV = {
            DUR: ["video_durationchange", "VIDEO_DURATIONCHANGE", "durationchange"],
            START: ["video_start", "VIDEO_START", "start"],
            AD_S: ["ad_start", "AD_START"],
            AD_E: ["ad_end", "AD_END"],
            TIME: ["video_timechange", "VIDEO_TIMECHANGE", "timechange", "timeupdate"], // timeupdate を追加
            ERR: ["error", "ERROR"],
          }

          // Duration
          EV.DUR.forEach((name) => safeOn(name, () => {
            p.getState?.().then((s) => {
              const d = Number((s as any)?.videoDuration) || 0
              if (d > 0) handlersRef.current.onDuration?.(d)
            }).catch(() => {})
          }))

          // Start
          EV.START.forEach((name) => safeOn(name, () => {
            handlersRef.current.onReady?.()
            p.getState?.().then((s) => {
              const d = Number((s as any)?.videoDuration) || 0
              if (d > 0) handlersRef.current.onDuration?.(d)
            }).catch(() => {})
          }))

          // Ads
          EV.AD_S.forEach((name) => safeOn(name, () => (inAdRef.current = true)))
          EV.AD_E.forEach((name) => safeOn(name, () => (inAdRef.current = false)))

          // Time change（AB制御本体）
          EV.TIME.forEach((name) => safeOn(name, (payload) => {
            lastEventAtRef.current = performance.now()
            const t = extractTime(payload)
            handlersRef.current.onProgress?.(t)
            maybeLoop(t, p)
          }))

          // Error
          EV.ERR.forEach((name) => safeOn(name, handlersRef.current.onError))

          // フォールバック開始
          startRaf()

          // cleanup
          const cleanup = () => {
            try { registerApi?.(null) } catch {}
            try { p.destroy?.() } catch {}
            stopRaf()
            cleanupWarn()
            playerRef.current = null
            initializedRef.current = false
          }
          ;(playerRef.current as any).__dm_cleanup__ = cleanup
        })
        .catch((err) => handlersRef.current.onError?.(err))
    }

    if (existing) {
      if (!playerRef.current) ensurePlayer()
    } else {
      const s = document.createElement("script")
      s.src = sdkSrc
      s.async = true
      s.onload = ensurePlayer
      s.onerror = () => handlersRef.current.onError?.(new Error("Failed to load Dailymotion SDK"))
      document.head.appendChild(s)
    }

    return () => {
      try { playerRef.current?.__dm_cleanup__?.() } catch {}
      registerApi?.(null)
    }
  }, [videoId, playerId, registerApi, maybeLoop, startRaf, stopRaf])

  // 音量のみ反映（速度はDMの制約上ここでは未対応）
  useEffect(() => {
    const p = playerRef.current as { setVolume?: (v: number) => Promise<void> } | null
    if (!p || typeof settings.volume !== "number" || !p.setVolume) return
    p.setVolume(settings.volume).catch(() => {})
  }, [settings.volume])

  return (
    <div className="relative">
      <div
        ref={containerRef}
        id={containerIdRef.current}
        className="w-full aspect-video bg-black rounded-lg overflow-hidden"
      />
      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
        Dailymotion
      </div>
    </div>
  )
}


/* ========================
   親: VideoPlayer
======================== */
export function VideoPlayer({ initialUrl }: VideoPlayerProps = {}) {
  const searchParams = useSearchParams()
  const playerRef = useRef<ReactPlayer>(null)
  const dmApiRef = useRef<DMExternalApi | null>(null)

  const [url, setUrl] = useState(initialUrl || "")
  const isDM = isDailymotionUrl(url)
  const dmId = isDM ? extractDailymotionVideoId(url) : null

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<PlayerError | null>(null)
  const [settings, setSettings] = useState<ABSettings>({
    loopMode: "off",
    loopCount: 3,
    rate: 1,
    volume: 0.8,
    a: 0,
    b: undefined,
  })
  const [isDragging] = useState(false)

  // 親から渡すハンドラは useCallback で安定化
  const handleDMSettingsChange = useCallback(
    (ns: Partial<ABSettings>) => setSettings((prev) => ({ ...prev, ...ns })),
    []
  )
  const handleDMReady = useCallback(() => setIsReady(true), [])
  const handleDMRegisterApi = useCallback((api: DMExternalApi | null) => {
    dmApiRef.current = api
  }, [])
  const handleDMLoop = useCallback(() => {
    setSettings((prev) => {
      if (prev.loopMode !== "finite" || prev.loopCount <= 0) return prev
      const left = prev.loopCount - 1
      return left > 0 ? { ...prev, loopCount: left } : { ...prev, loopMode: "off", loopCount: 0 }
    })
  }, [])

  /* URL初期化/変更 */
  useEffect(() => {
    if (initialUrl !== undefined) {
      const normalizedUrl = isDailymotionUrl(initialUrl) ? normalizeDailymotionUrl(initialUrl) : initialUrl
      setUrl(normalizedUrl)
      setError(null)
      setIsReady(false)
      setSettings((prev) => ({ ...prev, a: 0, b: undefined }))
    }
  }, [initialUrl])

  /* URLパラメータから初期設定 */
  useEffect(() => {
    const src = searchParams.get("src")
    const a = searchParams.get("a")
    const b = searchParams.get("b")
    const loop = searchParams.get("loop")
    const rate = searchParams.get("rate")

    if (src && !initialUrl) {
      const normalizedUrl = isDailymotionUrl(src) ? normalizeDailymotionUrl(src) : src
      setUrl(normalizedUrl)
      setError(null)
      setIsReady(false)
    }
    if (a || b || loop || rate) {
      setSettings((prev) => ({
        ...prev,
        a: a ? Number.parseFloat(a) : 0,
        b: b ? Number.parseFloat(b) : undefined,
        loopMode: loop === "inf" ? "infinite" : loop === "off" ? "off" : "finite",
        rate: rate ? Number.parseFloat(rate) : 1,
      }))
    }
  }, [searchParams, initialUrl])

  /* ABループ（ReactPlayer側） */
  useEffect(() => {
    if (isDM) return
    const A = settings.a
    const B = settings.b
    if (settings.loopMode === "off" || A === undefined || B === undefined) return
    if (currentTime >= B) {
      if (settings.loopMode === "infinite") {
        playerRef.current?.seekTo(A, "seconds")
      } else if (settings.loopMode === "finite") {
        setSettings((prev) => {
          const left = Math.max(0, prev.loopCount - 1)
          if (left > 0) {
            playerRef.current?.seekTo(A, "seconds")
            return { ...prev, loopCount: left }
          }
          return { ...prev, loopMode: "off", loopCount: 0 }
        })
      }
    }
  }, [currentTime, settings, isDM])

  /* キーボードショートカット */
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
          setSettings((prev) => ({ ...prev, loopMode: prev.loopMode === "off" ? "infinite" : "off" }))
          break
        case " ":
          e.preventDefault()
          togglePlay()
          break
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, isDM, playing])

  /* 共通ハンドラ（ReactPlayer向け） */
  const handleProgress = useCallback(
    (state: { playedSeconds: number }) => {
      if (!isDragging) setCurrentTime(state.playedSeconds)
    },
    [isDragging]
  )

  const handleDuration = useCallback((d: number) => {
    setDuration(d)
    setSettings((prev) => ({ ...prev, b: prev.b !== undefined ? prev.b : d }))
  }, [])

  const handleReady = useCallback(() => {
    setIsReady(true)
    setError(null)
    // ReactPlayer の duration を取り直し（0秒対策）
    const trySet = () => {
      const d = playerRef.current?.getDuration?.()
      if (typeof d === "number" && isFinite(d) && d > 0) {
        setDuration(d)
        setSettings((prev) => ({ ...prev, b: prev.b !== undefined ? prev.b : d }))
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

  const handleError = useCallback(
    (error: any) => {
      if (!error || (typeof error === "object" && Object.keys(error).length === 0)) return
      console.error("Player error:", error)
      let errorMessage = "Failed to load video."
      if (error?.target?.error) {
        const mediaError = error.target.error
        switch (mediaError.code) {
          case 1:
            errorMessage = "Video loading was interrupted."
            break
          case 2:
            errorMessage = "Network error. Please check your connection."
            break
          case 3:
            errorMessage = "Video format is corrupted."
            break
          case 4:
            errorMessage = isDailymotionUrl(url)
              ? "Cannot load Dailymotion video. It may not be embeddable."
              : "This video format is not supported."
            break
          default:
            errorMessage = "Please check if the URL is correct."
        }
      } else if (isDailymotionUrl(url)) {
        errorMessage = "Cannot access Dailymotion video. Please check the URL or try another video."
      }
      setError({ message: errorMessage, type: "loading_error" })
      setIsReady(false)
    },
    [url]
  )

  const isValidUrl = (u: string) => {
    if (!u) return false
    try {
      new URL(u)
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
    const parts = timeString.split(":")
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

  /* ===== Dailymotion対応：UI→プレイヤー制御の分岐 ===== */
  const togglePlay = () => {
    if (isDM) {
      if (playing) dmApiRef.current?.pause()
      else dmApiRef.current?.play()
      setPlaying(!playing)
    } else {
      setPlaying(!playing)
    }
  }

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isReady || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const newTime = ((e.clientX - rect.left) / rect.width) * duration
    if (isDM) dmApiRef.current?.seekTo(newTime)
    else playerRef.current?.seekTo(newTime, "seconds")
  }

  const handleLoop = handleDMLoop

  /* ========= UI ========= */
  return (
    <div className="min-h-[50vh] bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {url && isValidUrl(url) ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Player */}
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
                  {isDM && dmId ? (
                    <DailymotionABPlayer
                      videoId={dmId}
                      settings={settings}
                      onSettingsChange={handleDMSettingsChange}
                      onProgress={setCurrentTime}
                      onDuration={handleDuration}
                      onReady={handleDMReady}
                      onError={handleError}
                      registerApi={handleDMRegisterApi}
                      onLoop={handleLoop}
                    />
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              )}

              {/* Progress + AB markers */}
              <div className={`space-y-4 ${!isReady ? "opacity-60 pointer-events-none" : ""}`}>
                <div className="relative cursor-pointer">
                  <div
                    className="progress-bar w-full h-2 bg-muted rounded-full relative cursor-pointer"
                    onClick={handleProgressBarClick}
                  >
                    <div
                      className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                    />
                    {settings.a !== undefined && duration > 0 && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-lg"
                        style={{
                          left: `${(settings.a / duration) * 100}%`,
                          transform: "translateX(-50%) translateY(-50%)",
                        }}
                        title={`Start: ${formatTime(settings.a)}`}
                      />
                    )}
                    {settings.b !== undefined && duration > 0 && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow-lg"
                        style={{
                          left: `${(settings.b / duration) * 100}%`,
                          transform: "translateX(-50%) translateY(-50%)",
                        }}
                        title={`End: ${formatTime(settings.b)}`}
                      />
                    )}
                  </div>
                </div>

                {/* Time */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-2">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setSettings((prev) => ({ ...prev, a: currentTime }))}
                    disabled={!isReady}
                    className={`cursor-pointer transition-all duration-200 ${
                      settings.a !== undefined
                        ? "bg-green-600 text-white border-green-600 hover:bg-green-700 shadow-md"
                        : "bg-transparent text-green-600 border-green-600 hover:bg-green-50"
                    }`}
                    title={`Set start point (current: ${settings.a !== undefined ? formatTime(settings.a) : "not set"})`}
                  >
                    <Bookmark className="h-5 w-5" />
                    <span className="ml-1 font-bold">A</span>
                  </Button>

                  <Button size="lg" variant="outline" onClick={togglePlay} className="cursor-pointer" disabled={!isReady}>
                    {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setSettings((prev) => ({ ...prev, b: currentTime }))}
                    disabled={!isReady}
                    className={`cursor-pointer transition-all duration-200 ${
                      settings.b !== undefined
                        ? "bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-md"
                        : "bg-transparent text-red-600 border-red-600 hover:bg-red-50"
                    }`}
                    title={`Set end point (current: ${settings.b !== undefined ? formatTime(settings.b) : "not set"})`}
                  >
                    <Bookmark className="h-5 w-5" />
                    <span className="ml-1 font-bold">B</span>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        loopMode: prev.loopMode === "off" ? "infinite" : "off",
                      }))
                    }
                    disabled={!isReady}
                    className={`cursor-pointer transition-all duration-200 ${
                      settings.loopMode !== "off"
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md"
                        : "bg-transparent text-gray-400 border-gray-300 hover:bg-gray-50 hover:text-gray-600"
                    }`}
                    title={`Toggle loop (currently: ${settings.loopMode})`}
                  >
                    <Repeat className="h-6 w-6" />
                    <span className="ml-1 text-xs font-medium">{settings.loopMode !== "off" ? "ON" : "OFF"}</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Settings */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    AB Loop Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* A */}
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
                          setSettings((prev) => ({ ...prev, a: timeValue }))
                        }}
                        disabled={!isReady}
                        className="cursor-text"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSettings((prev) => ({ ...prev, a: currentTime }))}
                        disabled={!isReady}
                        className="cursor-pointer"
                      >
                        Current
                      </Button>
                    </div>
                  </div>

                  {/* B */}
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
                          setSettings((prev) => ({ ...prev, b: timeValue }))
                        }}
                        disabled={!isReady}
                        className="cursor-text"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSettings((prev) => ({ ...prev, b: currentTime }))}
                        disabled={!isReady}
                        className="cursor-pointer"
                      >
                        Current
                      </Button>
                    </div>
                  </div>

                  {/* Loop Mode + Count */}
                  <div className="space-y-2">
                    <Label>Loop Mode</Label>
                    <RadioGroup
                      value={settings.loopMode}
                      onValueChange={(value: "off" | "infinite" | "finite") =>
                        setSettings((prev) => ({ ...prev, loopMode: value }))
                      }
                      className="cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 cursor-pointer">
                        <RadioGroupItem value="off" id="off" className="cursor-pointer" />
                        <Label htmlFor="off" className="cursor-pointer">
                          Off
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 cursor-pointer">
                        <RadioGroupItem value="infinite" id="infinite" className="cursor-pointer" />
                        <Label htmlFor="infinite" className="cursor-pointer">
                          Infinite Loop
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 cursor-pointer">
                        <RadioGroupItem value="finite" id="finite" className="cursor-pointer" />
                        <Label htmlFor="finite" className="cursor-pointer">
                          Finite (with count)
                        </Label>
                      </div>
                    </RadioGroup>

                    {settings.loopMode === "finite" && (
                      <div className="space-y-2">
                        <Label htmlFor="loopcount">Loop Count (remaining)</Label>
                        <Slider
                          id="loopcount"
                          min={1}
                          max={20}
                          step={1}
                          value={[Math.max(0, settings.loopCount)]}
                          onValueChange={([v]) => setSettings((prev) => ({ ...prev, loopCount: v }))}
                          disabled={!isReady}
                          className="cursor-pointer"
                        />
                        <div className="text-xs text-muted-foreground">{Math.max(0, settings.loopCount)} time(s)</div>
                      </div>
                    )}
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
                      onValueChange={([value]) => setSettings((prev) => ({ ...prev, rate: value }))}
                      disabled={!isReady || isDM} // Dailymotionは制限あり
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
                      onValueChange={([value]) => setSettings((prev) => ({ ...prev, volume: value }))}
                      disabled={!isReady}
                      className="cursor-pointer"
                    />
                  </div>

                  {/* Share */}
                  <Button onClick={generateShareUrl} disabled={!isReady} className="w-full cursor-pointer">
                    <Share2 className="h-4 w-4 mr-2" />
                    Copy Share Link
                  </Button>
                </CardContent>
              </Card>

              {/* Shortcuts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Keyboard className="h-5 w-5" />
                    Keyboard Shortcuts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>[</span>
                    <span>Set Start Point</span>
                  </div>
                  <div className="flex justify-between">
                    <span>]</span>
                    <span>Set End Point</span>
                  </div>
                  <div className="flex justify-between">
                    <span>\</span>
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
