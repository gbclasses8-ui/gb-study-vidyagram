import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Settings,
  X,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Tv
} from 'lucide-react';
import type { VideoDetails } from '../types.ts';

interface VideoPlayerModalProps {
  courseId: string | number;
  videoId: string;
  videoTitle?: string;
  onClose: () => void;
  onOpenPdf?: (url: string, title: string) => void;
  onNextVideo?: () => void;
  onPrevVideo?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  courseId,
  videoId,
  videoTitle,
  onClose,
  onOpenPdf,
  onNextVideo,
  onPrevVideo,
  hasNext = false,
  hasPrev = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<VideoDetails | null>(null);
  const [selectedQualityUrl, setSelectedQualityUrl] = useState<string>('');
  const [playerMode, setPlayerMode] = useState<'native' | 'iframe'>('native');

  // Player controls state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch video details
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    async function loadVideo() {
      try {
        const res = await fetch(`/api/video_details?course_id=${courseId}&video_id=${videoId}`);
        if (!res.ok) throw new Error('Failed to load lecture details from server');
        const data = await res.json();
        if (isCancelled) return;

        if (data && (data.success || data.video_id || data.decoded_video_link || data.file_link)) {
          setVideoData(data);
          // Pick best quality or fallback stream link
          const defaultUrl =
            data.qualities?.[0]?.url ||
            data.decoded_video_link ||
            data.file_link ||
            '';
          setSelectedQualityUrl(defaultUrl);
        } else {
          throw new Error(data.error || 'Video stream could not be loaded');
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        const e = err as Error;
        console.error('Video error:', e);
        setError(e.message || 'Failed to play this lecture');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadVideo();

    return () => {
      isCancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [courseId, videoId]);

  // Attach video stream to HLS / Native video
  useEffect(() => {
    if (playerMode !== 'native') return;

    const video = videoRef.current;
    if (!video || !selectedQualityUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = selectedQualityUrl.includes('.m3u8') || selectedQualityUrl.includes('/video?');
    const streamSrc = isHls
      ? `/video?url=${encodeURIComponent(selectedQualityUrl)}`
      : selectedQualityUrl;

    if (Hls.isSupported() && isHls) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 60,
        maxBufferSize: 30 * 1000 * 1000,
        maxBufferLength: 30
      });
      hlsRef.current = hls;

      hls.loadSource(streamSrc);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              // If native HLS failed, automatically switch to official player frame
              if (videoData?.player_url) {
                setPlayerMode('iframe');
              } else {
                setError('Failed to play native stream. Please try alternative player.');
              }
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || !isHls) {
      video.src = streamSrc;
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [selectedQualityUrl, playerMode, videoData?.player_url]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettingsMenu(false);
  };

  const handleQualityChange = (url: string) => {
    if (videoRef.current) {
      const curr = videoRef.current.currentTime;
      setSelectedQualityUrl(url);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.currentTime = curr;
      }, 300);
    }
    setShowSettingsMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Check if YouTube link
  const ytVideoId = videoData?.decoded_video_link && !videoData.decoded_video_link.includes('http') && videoData.decoded_video_link.length === 11
    ? videoData.decoded_video_link
    : null;

  const currentTitle = videoTitle || videoData?.title || 'Lecture Video';
  const notesUrl = videoData?.decoded_pdf_link;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Top Header Bar */}
      <div
        className={`absolute top-0 inset-x-0 z-30 bg-gradient-to-b from-black/95 via-black/60 to-transparent p-3.5 sm:p-5 flex items-center justify-between gap-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 text-xs font-bold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm md:text-base font-bold text-white truncate max-w-xs sm:max-w-md md:max-w-xl">
              {currentTitle}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-blue-400 font-semibold tracking-wide flex items-center gap-2">
              <span>GB STUDY • Lecture Player</span>
              {videoData?.player_url && (
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[10px]">
                  Mode: {playerMode === 'native' ? 'Fast Player' : 'Web Player'}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Switch Player Mode Button (if alternative web player exists) */}
          {videoData?.player_url && !ytVideoId && (
            <button
              onClick={() => setPlayerMode(playerMode === 'native' ? 'iframe' : 'native')}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                playerMode === 'iframe'
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-white/10 text-stone-300 hover:text-white border-white/10'
              }`}
              title="Toggle Alternative Web Player"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {playerMode === 'native' ? 'Switch Player' : 'Back to Fast Player'}
              </span>
            </button>
          )}

          {/* Notes Button if available */}
          {notesUrl && onOpenPdf && (
            <button
              onClick={() => onOpenPdf(notesUrl, `${currentTitle} - Notes`)}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 border border-blue-400/40 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notes PDF</span>
            </button>
          )}

          {/* Close Player */}
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white transition-colors"
            title="Close Player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Video Display Area */}
      <div className="relative flex-1 flex items-center justify-center bg-black">
        {loading && (
          <div className="flex flex-col items-center gap-3 text-stone-400 z-10">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm font-semibold tracking-wide">Connecting Lecture Video Stream...</p>
          </div>
        )}

        {error && playerMode === 'native' && (
          <div className="flex flex-col items-center gap-3 p-6 text-center max-w-md z-10 bg-white/5 border border-red-500/30 rounded-3xl">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-white font-bold">{error}</p>
            {videoData?.player_url ? (
              <button
                onClick={() => setPlayerMode('iframe')}
                className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
              >
                <Tv className="w-4 h-4" />
                Play in Cloud Web Player
              </button>
            ) : (
              <p className="text-xs text-stone-400">
                This stream is currently processing or offline. You can read the class notes or try another lecture.
              </p>
            )}
          </div>
        )}

        {/* 1. YouTube Player */}
        {ytVideoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&rel=0&modestbranding=1`}
            title={currentTitle}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : playerMode === 'iframe' && videoData?.player_url ? (
          /* 2. Embedded Akamai Cloud Web Player */
          <iframe
            src={videoData.player_url}
            title={currentTitle}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          /* 3. Native HLS HTML5 Video Player */
          <video
            ref={videoRef}
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-contain cursor-pointer"
            playsInline
          />
        )}
      </div>

      {/* Bottom Controls Bar (Visible in Native mode) */}
      {!ytVideoId && playerMode === 'native' && !error && !loading && (
        <div
          className={`absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 sm:p-6 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress Slider */}
          <div className="relative mb-3 group flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 group-hover:h-2.5 transition-all"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Play, Skip, Prev, Next */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {hasPrev && onPrevVideo && (
                <button
                  onClick={onPrevVideo}
                  className="p-1.5 sm:p-2 text-stone-300 hover:text-white rounded-lg transition-colors"
                  title="Previous Lecture"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={togglePlay}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-transform active:scale-95 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              >
                {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />}
              </button>

              {hasNext && onNextVideo && (
                <button
                  onClick={onNextVideo}
                  className="p-1.5 sm:p-2 text-stone-300 hover:text-white rounded-lg transition-colors"
                  title="Next Lecture"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => handleSkip(-10)}
                className="p-1.5 sm:p-2 text-stone-300 hover:text-white transition-colors"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSkip(10)}
                className="p-1.5 sm:p-2 text-stone-300 hover:text-white transition-colors"
                title="Forward 10s"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="hidden sm:flex items-center gap-2 ml-2">
                <button onClick={toggleMute} className="text-stone-300 hover:text-white">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-white/20 rounded accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Time display */}
              <span className="text-[11px] sm:text-xs font-mono text-stone-300 ml-1 sm:ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right: Quality, Speed, Fullscreen */}
            <div className="flex items-center gap-2 sm:gap-3 relative">
              {/* Settings Dropdown Button */}
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={`p-1.5 sm:p-2 rounded-xl border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-bold ${
                  showSettingsMenu ? 'bg-blue-600 text-white' : 'bg-white/5 text-stone-300 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{playbackSpeed}x</span>
              </button>

              {/* Settings Menu Popup */}
              {showSettingsMenu && (
                <div className="absolute bottom-12 right-0 bg-[#160d24] border border-blue-500/30 rounded-2xl p-4 shadow-2xl z-40 w-56 text-xs text-stone-200 animate-slideUp">
                  {/* Speed */}
                  <p className="font-bold text-white mb-2 pb-1 border-b border-white/10">Speed</p>
                  <div className="grid grid-cols-3 gap-1.5 mb-4">
                    {[0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSpeedChange(s)}
                        className={`py-1 rounded-lg text-center font-bold ${
                          playbackSpeed === s
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/5 hover:bg-white/10 text-stone-300'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  {/* Quality */}
                  {videoData?.qualities && videoData.qualities.length > 0 && (
                    <>
                      <p className="font-bold text-white mb-2 pb-1 border-b border-white/10">Quality</p>
                      <div className="space-y-1">
                        {videoData.qualities.map((q) => (
                          <button
                            key={q.quality}
                            onClick={() => handleQualityChange(q.url)}
                            className={`w-full py-1.5 px-2.5 rounded-lg text-left font-bold flex items-center justify-between ${
                              selectedQualityUrl === q.url
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/5 hover:bg-white/10 text-stone-300'
                            }`}
                          >
                            <span>{q.quality}</span>
                            {selectedQualityUrl === q.url && <span className="text-[10px]">Active</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 hover:text-white transition-colors"
                title="Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
