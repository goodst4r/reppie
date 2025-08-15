import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Bookmark, Volume2, Upload, ExternalLink, X, Moon, Sun } from 'lucide-react';

declare global {
  interface Window {
    YT: YTNamespace;
    onYouTubeIframeAPIReady: () => void;
  }
}

// YouTube Player API型定義
interface YTPlayerState {
  UNSTARTED: number;
  ENDED: number;
  PLAYING: number;
  PAUSED: number;
  BUFFERING: number;
  CUED: number;
}

interface YTPlayer {
  getDuration(): number;
  getCurrentTime(): number;
  getPlayerState(): number;
  destroy(): void;
}

interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

interface YTNamespace {
  PlayerState: YTPlayerState;
}

interface ABPoint {
  time: number;
  label: string;
}

interface VideoInfo {
  title: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
}

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getPlayerState: () => number;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  getVideoUrl: () => string;
  destroy: () => void;
  addEventListener: (event: string, listener: string) => void;
}

interface DragState {
  isDragging: boolean;
  dragType: 'a' | 'b' | null;
  startX: number;
  startTime: number;
}

type Theme = 'light' | 'dark';

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
};

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const lastLoopTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const aPointRef = useRef<ABPoint | null>(null);
  const bPointRef = useRef<ABPoint | null>(null);
  const isLoopingRef = useRef<boolean>(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo>({
    title: '',
    duration: 0,
    currentTime: 0,
    isPlaying: false
  });
  
  const [aPoint, setAPoint] = useState<ABPoint | null>(null);
  const [bPoint, setBPoint] = useState<ABPoint | null>(null);
  const [isLooping, setIsLooping] = useState(false);

  // refとstateを同期
  useEffect(() => {
    aPointRef.current = aPoint;
  }, [aPoint]);

  useEffect(() => {
    bPointRef.current = bPoint;
  }, [bPoint]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);
  const [loopCount, setLoopCount] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [bookmarks, setBookmarks] = useState<ABPoint[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'dark';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    startX: 0,
    startTime: 0
  });

  // Sample video URLs for testing
  const sampleVideos = [
    {
      name: "Big Buck Bunny (MP4)",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    },
    {
      name: "Elephant Dream (MP4)", 
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
    },
    {
      name: "For Bigger Blazes (MP4)",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    }
  ];

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLoadVideo = () => {
    const youtubeId = extractYouTubeId(videoUrl);
    
    if (youtubeId) {
      setIsYouTubeVideo(true);
      loadYouTubeVideo(youtubeId);
    } else if (videoRef.current && videoUrl) {
      setIsYouTubeVideo(false);
      destroyYouTubePlayer();
      videoRef.current.src = videoUrl;
      videoRef.current.load();
    }
    
    setAPoint(null);
    setBPoint(null);
    setLoopCount(0);
    setIsLooping(false);
  };

  const loadYouTubeVideo = (videoId: string) => {
    if (!window.YT) {
      loadYouTubeAPI(() => loadYouTubeVideo(videoId));
      return;
    }

    destroyYouTubePlayer();

    const player = new window.YT.Player('youtube-player', {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        disablekb: 0,
        enablejsapi: 1,
        origin: window.location.origin,
        playsinline: 1,
        fs: 0, // フルスクリーン無効
        iv_load_policy: 3, // アノテーション無効
        cc_load_policy: 0, // 字幕無効
        autoplay: 0, // 自動再生無効（モバイル対応）
        mute: 0 // ミュート無効
      },
      events: {
        onReady: onYouTubePlayerReady,
        onStateChange: onYouTubePlayerStateChange
      }
    });

    youtubePlayerRef.current = player;
  };

  const loadYouTubeAPI = (callback: () => void) => {
    if (window.YT && window.YT.Player) {
      callback();
      return;
    }

    const existingScript = document.getElementById('youtube-api');
    if (!existingScript) {
      window.onYouTubeIframeAPIReady = callback;
      
      const script = document.createElement('script');
      script.id = 'youtube-api';
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    } else {
      window.onYouTubeIframeAPIReady = callback;
    }
  };

  const destroyYouTubePlayer = useCallback(() => {
    stopYouTubeTimeUpdate();
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.destroy();
      youtubePlayerRef.current = null;
    }
  }, []);

  const onYouTubePlayerReady = (event: YTPlayerEvent) => {
    const player = event.target;
    setTimeout(() => {
      try {
        const duration = player.getDuration();
        const currentTime = player.getCurrentTime();
        const playerState = player.getPlayerState();

        setVideoInfo(prev => ({
          ...prev,
          duration: duration || 0,
          currentTime: currentTime || 0,
          title: player.getVideoData?.()?.title || 'YouTube動画が読み込まれました',
          isPlaying: playerState === window.YT?.PlayerState?.PLAYING
        }));

        // ★常時ループ開始（以後止めない）
        startYouTubeTimeUpdate();
      } catch (error) {
        console.error('YouTube player ready error:', error);
      }
    }, 100);
  };

  const onYouTubePlayerStateChange = (event: YTPlayerEvent) => {
    const playerState = event.data;
    const YT = window.YT;
    
    if (playerState === YT.PlayerState.PLAYING) {
      setVideoInfo(prev => ({ ...prev, isPlaying: true }));
      // ★停止しない。RAF は常時回しておく
    } else if (playerState === YT.PlayerState.PAUSED || playerState === YT.PlayerState.ENDED) {
      setVideoInfo(prev => ({ ...prev, isPlaying: false }));
      // ★ここで stopYouTubeTimeUpdate() を呼ばない
    }
  };

  const startYouTubeTimeUpdate = useCallback(() => {
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);

    const tick = () => {
      const player = youtubePlayerRef.current;
      if (player && window.YT) {
        try {
          const currentTime = player.getCurrentTime() ?? 0;
          const durationRaw = player.getDuration() ?? 0;
          const playerState = player.getPlayerState?.();
          const isPlayingNow = playerState === window.YT.PlayerState.PLAYING;

          setVideoInfo(prev => ({
            ...prev,
            currentTime,
            isPlaying: isPlayingNow,
            duration: durationRaw > 0 ? durationRaw : prev.duration,
            title: prev.title || player.getVideoData?.()?.title || 'YouTube'
          }));

          // AB ループ（常時監視） - refから最新値を取得
          const currentIsLooping = isLoopingRef.current;
          const currentAPoint = aPointRef.current;
          const currentBPoint = bPointRef.current;

          if (currentIsLooping && currentAPoint && currentBPoint) {
            // クリップが短い場合でも確実に戻すための余裕時間（YTLooper方式）
            const segmentLength = currentBPoint.time - currentAPoint.time;
            const threshold = Math.max(0.05, Math.min(0.25, segmentLength * 0.15));
            const now = Date.now();
            const elapsed = now - lastLoopTimeRef.current;

            if (currentTime >= (currentBPoint.time - threshold) && elapsed > 300) {
              console.log(`AB Loop: ${currentTime.toFixed(3)}s -> ${currentAPoint.time.toFixed(3)}s (threshold: ${threshold.toFixed(3)}s)`);
              lastLoopTimeRef.current = now;
              
              // seekTo → 直後の PAUSED/BUFFERING をケア
              player.seekTo(currentAPoint.time, true);
              setLoopCount(prev => prev + 1);

              // 再生が止まっていたら再開（YTLooper方式の強制復帰）
              setTimeout(() => {
                try {
                  const state = player.getPlayerState?.();
                  if (state !== window.YT.PlayerState.PLAYING && state !== window.YT.PlayerState.BUFFERING) {
                    console.log('Forcing playback resume after loop');
                    player.playVideo?.();
                  }
                } catch {
                  // エラーは無視
                }
              }, 120);
            }
          }
        } catch {
          // 例外は握りつぶして次フレームへ
        }
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, []); // 依存配列を空にしてrefから最新値を取得

  const stopYouTubeTimeUpdate = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setIsYouTubeVideo(false);
      destroyYouTubePlayer();
      
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.load();
        setVideoInfo(prev => ({ ...prev, title: file.name }));
        setAPoint(null);
        setBPoint(null);
        setLoopCount(0);
        setIsLooping(false);
      }
    }
  };

  const loadSampleVideo = (url: string, name: string) => {
    setVideoUrl(url);
    setIsYouTubeVideo(false);
    destroyYouTubePlayer();
    
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.load();
      setVideoInfo(prev => ({ ...prev, title: name }));
      setAPoint(null);
      setBPoint(null);
      setLoopCount(0);
      setIsLooping(false);
    }
  };

  const togglePlayPause = useCallback(() => {
    if (isYouTubeVideo && youtubePlayerRef.current) {
      if (videoInfo.isPlaying) {
        youtubePlayerRef.current.pauseVideo();
      } else {
        youtubePlayerRef.current.playVideo();
      }
    } else if (videoRef.current) {
      if (videoInfo.isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [videoInfo.isPlaying, isYouTubeVideo]);

  const setAPointCurrent = useCallback(() => {
    const currentTime = isYouTubeVideo && youtubePlayerRef.current 
      ? youtubePlayerRef.current.getCurrentTime()
      : videoRef.current?.currentTime || 0;
    
    const newTime = bPoint ? Math.min(currentTime, bPoint.time - 0.1) : currentTime;
    setAPoint({ time: newTime, label: `A点: ${formatTime(newTime)}` });
    console.log(`A Point set: ${formatTime(newTime)} (${newTime.toFixed(3)}s)${bPoint ? ` [limited by B: ${formatTime(bPoint.time)}]` : ''}`);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(newTime, true);
    } else if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  }, [bPoint, isYouTubeVideo]);

  const setBPointCurrent = useCallback(() => {
    const currentTime = isYouTubeVideo && youtubePlayerRef.current 
      ? youtubePlayerRef.current.getCurrentTime()
      : videoRef.current?.currentTime || 0;
    
    const newTime = aPoint ? Math.max(currentTime, aPoint.time + 0.1) : currentTime;
    setBPoint({ time: newTime, label: `B点: ${formatTime(newTime)}` });
    const segmentLength = aPoint ? newTime - aPoint.time : 0;
    console.log(`B Point set: ${formatTime(newTime)} (${newTime.toFixed(3)}s)${aPoint ? ` [segment: ${segmentLength.toFixed(3)}s]` : ''}`);
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(newTime, true);
    } else if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  }, [aPoint, isYouTubeVideo]);

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState.isDragging || !progressBarRef.current) return;
    if (!isYouTubeVideo && !videoRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * videoInfo.duration;
    const clampedTime = Math.max(0, Math.min(newTime, videoInfo.duration));
    
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(clampedTime, true);
    } else if (videoRef.current) {
      videoRef.current.currentTime = clampedTime;
    }
  };

  const handlePointMouseDown = (e: React.MouseEvent, type: 'a' | 'b') => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragState({
      isDragging: true,
      dragType: type,
      startX: e.clientX,
      startTime: type === 'a' ? (aPoint?.time || 0) : (bPoint?.time || 0)
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !progressBarRef.current || videoInfo.duration === 0) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragState.startX;
    const deltaTime = (deltaX / rect.width) * videoInfo.duration;
    const newTime = Math.max(0, Math.min(dragState.startTime + deltaTime, videoInfo.duration));
    
    if (dragState.dragType === 'a') {
      const constrainedTime = bPoint ? Math.min(newTime, bPoint.time - 0.1) : newTime;
      setAPoint({ time: constrainedTime, label: `A点: ${formatTime(constrainedTime)}` });
    } else if (dragState.dragType === 'b') {
      const constrainedTime = aPoint ? Math.max(newTime, aPoint.time + 0.1) : newTime;
      setBPoint({ time: constrainedTime, label: `B点: ${formatTime(constrainedTime)}` });
    }
  }, [dragState, videoInfo.duration, aPoint, bPoint]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        dragType: null,
        startX: 0,
        startTime: 0
      });
    }
  }, [dragState.isDragging]);

  // Mouse event listeners for dragging
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  const toggleLoop = useCallback(() => {
    const newLoopState = !isLooping;
    setIsLooping(newLoopState);
    if (newLoopState) {
      setLoopCount(0);
      lastLoopTimeRef.current = 0; // ループタイムスタンプをリセット
      console.log('AB Loop enabled');
    } else {
      console.log('AB Loop disabled');
    }
  }, [isLooping]);

  const resetAB = () => {
    setAPoint(null);
    setBPoint(null);
    setIsLooping(false);
    setLoopCount(0);
    lastLoopTimeRef.current = 0; // ループタイムスタンプをリセット
    console.log('AB Points reset');
  };

  const addBookmark = () => {
    const currentTime = isYouTubeVideo && youtubePlayerRef.current 
      ? youtubePlayerRef.current.getCurrentTime()
      : videoRef.current?.currentTime || 0;
    
    const newBookmark = { time: currentTime, label: `ブックマーク ${formatTime(currentTime)}` };
    setBookmarks([...bookmarks, newBookmark]);
  };

  const jumpToBookmark = (time: number) => {
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(time, true);
    } else if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const deleteBookmark = (index: number) => {
    setBookmarks(bookmarks.filter((_, i) => i !== index));
  };
  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.setPlaybackRate(speed);
    } else if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const changeVolume = (newVolume: number) => {
    setVolume(newVolume);
    if (isYouTubeVideo && youtubePlayerRef.current) {
      youtubePlayerRef.current.setVolume(newVolume * 100);
    } else if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };


  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      setVideoInfo(prev => ({ ...prev, currentTime }));

      // AB loop logic
      if (isLooping && aPoint && bPoint && currentTime >= bPoint.time) {
        videoRef.current.currentTime = aPoint.time;
        setLoopCount(prev => prev + 1);
      }
    }
  };

  const handleLoadedData = () => {
    if (videoRef.current) {
      setVideoInfo(prev => ({
        ...prev,
        duration: videoRef.current!.duration,
        title: prev.title || 'ビデオが読み込まれました'
      }));
    }
  };

  const handlePlay = () => {
    setVideoInfo(prev => ({ ...prev, isPlaying: true }));
  };

  const handlePause = () => {
    setVideoInfo(prev => ({ ...prev, isPlaying: false }));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopYouTubeTimeUpdate();
      destroyYouTubePlayer();
    };
  }, [stopYouTubeTimeUpdate, destroyYouTubePlayer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'a':
        case 'A':
          setAPointCurrent();
          break;
        case 'b':
        case 'B':
          setBPointCurrent();
          break;
        case 'l':
        case 'L':
          toggleLoop();
          break;
        case 'r':
        case 'R':
          resetAB();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayPause, setAPointCurrent, setBPointCurrent, toggleLoop]);

  const progressPercentage = videoInfo.duration > 0 ? (videoInfo.currentTime / videoInfo.duration) * 100 : 0;
  const aPointPercentage = aPoint && videoInfo.duration > 0 ? (aPoint.time / videoInfo.duration) * 100 : 0;
  const bPointPercentage = bPoint && videoInfo.duration > 0 ? (bPoint.time / videoInfo.duration) * 100 : 0;
  // Theme-based class definitions
  const mainBgClass = theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900';
  const panelBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-200';
  const inputBgClass = theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300';
  const buttonBgClass = theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300';
  const textSecondaryClass = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const textMutedClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const borderClass = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`min-h-screen ${mainBgClass}`}>
      {/* Header */}
      <header className={`${panelBgClass} ${borderClass} border-b p-4`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-400">AB Repeat Player</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2 ${buttonBgClass} rounded-lg transition-colors`}
              title={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 ${buttonBgClass} rounded-lg transition-colors`}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Video URL Input */}
        <div className={`mb-6 ${panelBgClass} rounded-lg p-4`}>
          <h2 className="text-lg font-semibold mb-3">動画読み込み</h2>
          
          {/* URL Input */}
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="YouTubeまたは動画URL（MP4, WebM, OGVなど）を入力..."
              className={`flex-1 px-4 py-2 ${inputBgClass} rounded-lg focus:border-blue-500 focus:outline-none`}
            />
            <button
              onClick={handleLoadVideo}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <ExternalLink size={16} />
              読み込み
            </button>
          </div>
          
          {/* File Upload */}
          <div className="flex gap-3 mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Upload size={16} />
              ファイルをアップロード
            </button>
            <span className={`flex items-center text-sm ${textMutedClass}`}>
              MP4, WebM, OGV, AVI, MOVなど
            </span>
          </div>
          
          {/* Sample Videos */}
          <div>
            <h3 className={`text-sm font-medium ${textSecondaryClass} mb-2`}>サンプル動画:</h3>
            <div className="flex flex-wrap gap-2">
              {sampleVideos.map((video, index) => (
                <button
                  key={index}
                  onClick={() => loadSampleVideo(video.url, video.name)}
                  className={`px-3 py-1 ${buttonBgClass} rounded text-sm transition-colors`}
                >
                  {video.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className={`${panelBgClass} rounded-lg p-4`}>
              <div className="aspect-video bg-black rounded-lg mb-4 relative overflow-hidden">
                {isYouTubeVideo ? (
                  <div id="youtube-player" className="w-full h-full" />
                ) : (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    controls={false}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedData={handleLoadedData}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    crossOrigin="anonymous"
                  />
                )}
                {!videoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Upload size={48} className="mx-auto mb-2 opacity-50" />
                      <p>動画URLを入力するか、ファイルをアップロードしてください</p>
                      <p className="text-sm mt-1">YouTubeやサンプル動画も利用できます</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div 
                  ref={progressBarRef}
                  className="relative h-3 bg-gray-600 rounded-full cursor-pointer hover:h-4 transition-all duration-200"
                  onClick={handleProgressBarClick}
                >
                  <div
                    className="absolute h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                  {aPoint && (
                    <div
                      className="absolute w-4 h-4 bg-green-500 rounded-full transform -translate-y-0.5 -translate-x-2 cursor-grab hover:bg-green-400 hover:scale-110 transition-all duration-200 border-2 border-white shadow-lg z-10"
                      style={{ left: `${aPointPercentage}%` }}
                      title={aPoint.label}
                      onMouseDown={(e) => handlePointMouseDown(e, 'a')}
                    />
                  )}
                  {bPoint && (
                    <div
                      className="absolute w-4 h-4 bg-red-500 rounded-full transform -translate-y-0.5 -translate-x-2 cursor-grab hover:bg-red-400 hover:scale-110 transition-all duration-200 border-2 border-white shadow-lg z-10"
                      style={{ left: `${bPointPercentage}%` }}
                      title={bPoint.label}
                      onMouseDown={(e) => handlePointMouseDown(e, 'b')}
                    />
                  )}
                  {/* Loop range indicator */}
                  {aPoint && bPoint && (
                    <div
                      className="absolute h-full bg-yellow-400 bg-opacity-30 rounded-full"
                      style={{
                        left: `${aPointPercentage}%`,
                        width: `${bPointPercentage - aPointPercentage}%`
                      }}
                    />
                  )}
                </div>
                <div className={`flex justify-between text-sm ${textMutedClass} mt-1`}>
                  <span>{formatTime(videoInfo.currentTime)}</span>
                  <span>{formatTime(videoInfo.duration)}</span>
                </div>
              </div>

              {/* Video Controls */}
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  onClick={togglePlayPause}
                  className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                >
                  {videoInfo.isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button
                  onClick={setAPointCurrent}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    aPoint ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  A点設定 {aPoint && `(${formatTime(aPoint.time)})`}
                </button>
                <button
                  onClick={setBPointCurrent}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    bPoint ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  B点設定 {bPoint && `(${formatTime(bPoint.time)})`}
                </button>
                <button
                  onClick={toggleLoop}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isLooping ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {isLooping ? 'ループ中' : 'ループ開始'}
                </button>
                <button
                  onClick={resetAB}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <RotateCcw size={20} />
                </button>
              </div>

              {/* Speed and Volume Controls */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span>速度:</span>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      className={`px-2 py-1 rounded ${
                        playbackSpeed === speed ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <Volume2 size={16} />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="w-20"
                  />
                  <span>{Math.round(volume * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* AB Loop Info */}
            <div className={`${panelBgClass} rounded-lg p-4`}>
              <h3 className="text-lg font-semibold mb-3">ABループ情報</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>動画:</span>
                  <span className="text-blue-400 truncate max-w-32" title={videoInfo.title}>
                    {videoInfo.title || '未読み込み'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>A点:</span>
                  <span className="text-green-400">{aPoint ? aPoint.label : '未設定'}</span>
                </div>
                <div className="flex justify-between">
                  <span>B点:</span>
                  <span className="text-red-400">{bPoint ? bPoint.label : '未設定'}</span>
                </div>
                <div className="flex justify-between">
                  <span>ループ回数:</span>
                  <span className="text-yellow-400">{loopCount}回</span>
                </div>
                <div className="flex justify-between">
                  <span>状態:</span>
                  <span className={isLooping ? 'text-green-400' : 'text-gray-400'}>
                    {isLooping ? 'ループ中' : '停止中'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bookmarks */}
            <div className={`${panelBgClass} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">ブックマーク</h3>
                <button
                  onClick={addBookmark}
                  className="p-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  <Bookmark size={16} />
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {bookmarks.map((bookmark, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-sm group"
                  >
                    <span 
                      onClick={() => jumpToBookmark(bookmark.time)}
                      className="flex-1 cursor-pointer"
                    >
                      {bookmark.label}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBookmark(index);
                      }}
                      className="ml-2 p-1 text-gray-400 hover:text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="ブックマークを削除"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {bookmarks.length === 0 && (
                  <div className="text-gray-400 text-sm text-center py-4">
                    ブックマークがありません
                  </div>
                )}
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className={`${panelBgClass} rounded-lg p-4`}>
              <h3 className="text-lg font-semibold mb-3">キーボードショートカット</h3>
              <div className={`space-y-1 text-sm ${textSecondaryClass}`}>
                <div className="flex justify-between">
                  <span>Space</span>
                  <span>再生/一時停止</span>
                </div>
                <div className="flex justify-between">
                  <span>A</span>
                  <span>A点設定</span>
                </div>
                <div className="flex justify-between">
                  <span>B</span>
                  <span>B点設定</span>
                </div>
                <div className="flex justify-between">
                  <span>L</span>
                  <span>ループ切替</span>
                </div>
                <div className="flex justify-between">
                  <span>R</span>
                  <span>AB点リセット</span>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-600">
                  <div className="text-xs text-gray-400">
                    <p>• プログレスバーをクリックで再生位置移動</p>
                    <p>• A/B点をドラッグで位置調整</p>
                    <p>• A点はB点を越えられません</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${panelBgClass} rounded-lg p-6 max-w-md w-full mx-4`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">設定</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">デフォルト再生速度</label>
                  <select
                    value={playbackSpeed}
                    onChange={(e) => changeSpeed(parseFloat(e.target.value))}
                    className={`w-full px-3 py-2 ${inputBgClass} rounded-lg`}
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x (通常)</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">音量設定</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-400 mt-1">
                    {Math.round(volume * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;