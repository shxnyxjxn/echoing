import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { ExternalLink, AlertTriangle, Play, Pause, RefreshCw } from 'lucide-react';
import { MOVIE_SETTINGS, ONE_LINE_CREDIT } from '../constants/movieData';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerRef {
  playSegment: (start: number, end: number, loop: boolean, onSentenceEnd?: () => void) => void;
  stopPlayback: () => void;
  pause: () => void;
  play: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  setSpeed: (speed: number) => void;
  isReady: () => boolean;
}

interface YouTubePlayerProps {
  onTimeUpdate?: (time: number) => void;
  onStateChange?: (state: number) => void;
  autoLoopDelayMs?: number;
  showCredit?: boolean;
  className?: string;
}

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
  ({ onTimeUpdate, onStateChange, autoLoopDelayMs = 1500, showCredit = true, className = '' }, ref) => {
    const containerIdRef = useRef(`yt-player-${Math.random().toString(36).substring(2, 9)}`);
    const playerRef = useRef<any>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [embedError, setEmbedError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState<number>(MOVIE_SETTINGS.startSeconds);

    const segmentRef = useRef<{
      start: number;
      end: number;
      loop: boolean;
      onSentenceEnd?: () => void;
      isActive: boolean;
      isWaitingLoop: boolean;
    }>({
      start: MOVIE_SETTINGS.startSeconds,
      end: MOVIE_SETTINGS.endSeconds,
      loop: false,
      isActive: false,
      isWaitingLoop: false,
    });

    const checkIntervalRef = useRef<number | null>(null);
    const loopTimeoutRef = useRef<number | null>(null);

    // Stop loops & timers
    const clearSegmentTimers = () => {
      if (checkIntervalRef.current) {
        window.clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      if (loopTimeoutRef.current) {
        window.clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
    };

    const stopPlayback = () => {
      clearSegmentTimers();
      segmentRef.current.isActive = false;
      segmentRef.current.isWaitingLoop = false;
      if (playerRef.current && isPlayerReady && typeof playerRef.current.pauseVideo === 'function') {
        try {
          playerRef.current.pauseVideo();
        } catch (e) {
          console.warn('Error pausing video:', e);
        }
      }
      setIsPlaying(false);
    };

    const startCheckingSegment = () => {
      clearSegmentTimers();

      checkIntervalRef.current = window.setInterval(() => {
        if (!playerRef.current || !segmentRef.current.isActive) return;

        try {
          const now = playerRef.current.getCurrentTime();
          setCurrentTime(now);
          if (onTimeUpdate) onTimeUpdate(now);

          // Check if segment reached end
          if (now >= segmentRef.current.end) {
            playerRef.current.pauseVideo();
            setIsPlaying(false);

            if (segmentRef.current.onSentenceEnd) {
              segmentRef.current.onSentenceEnd();
            }

            if (segmentRef.current.loop && !segmentRef.current.isWaitingLoop) {
              segmentRef.current.isWaitingLoop = true;
              loopTimeoutRef.current = window.setTimeout(() => {
                if (!segmentRef.current.isActive) return;
                segmentRef.current.isWaitingLoop = false;
                try {
                  playerRef.current.seekTo(segmentRef.current.start, true);
                  playerRef.current.playVideo();
                  setIsPlaying(true);
                } catch (err) {
                  console.warn('Loop restart error:', err);
                }
              }, autoLoopDelayMs);
            } else if (!segmentRef.current.loop) {
              segmentRef.current.isActive = false;
              if (checkIntervalRef.current) {
                window.clearInterval(checkIntervalRef.current);
                checkIntervalRef.current = null;
              }
            }
          }
        } catch (e) {
          // ignore
        }
      }, 100);
    };

    const playSegment = (start: number, end: number, loop: boolean, onSentenceEnd?: () => void) => {
      if (!playerRef.current) return;
      clearSegmentTimers();

      segmentRef.current = {
        start,
        end,
        loop,
        onSentenceEnd,
        isActive: true,
        isWaitingLoop: false,
      };

      try {
        playerRef.current.seekTo(start, true);
        playerRef.current.playVideo();
        setIsPlaying(true);
        startCheckingSegment();
      } catch (err) {
        console.warn('Error playing segment:', err);
      }
    };

    const pause = () => {
      stopPlayback();
    };

    const play = () => {
      if (!playerRef.current) return;
      try {
        playerRef.current.playVideo();
        setIsPlaying(true);
        startCheckingSegment();
      } catch (e) {
        console.warn('Error playing:', e);
      }
    };

    const seekTo = (seconds: number) => {
      if (!playerRef.current) return;
      try {
        playerRef.current.seekTo(seconds, true);
        setCurrentTime(seconds);
      } catch (e) {
        console.warn('Error seeking:', e);
      }
    };

    const getCurrentTime = (): number => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') {
        return currentTime;
      }
      try {
        return playerRef.current.getCurrentTime();
      } catch {
        return currentTime;
      }
    };

    const setSpeed = (speed: number) => {
      if (!playerRef.current || typeof playerRef.current.setPlaybackRate !== 'function') return;
      try {
        playerRef.current.setPlaybackRate(speed);
      } catch (e) {
        console.warn('Error setting speed:', e);
      }
    };

    useImperativeHandle(ref, () => ({
      playSegment,
      stopPlayback,
      pause,
      play,
      seekTo,
      getCurrentTime,
      setSpeed,
      isReady: () => isPlayerReady,
    }));

    // Initialize YouTube iframe API
    useEffect(() => {
      let isMounted = true;

      const initPlayer = () => {
        if (!window.YT || !window.YT.Player) return;

        try {
          playerRef.current = new window.YT.Player(containerIdRef.current, {
            videoId: MOVIE_SETTINGS.videoId,
            playerVars: {
              start: MOVIE_SETTINGS.startSeconds,
              end: MOVIE_SETTINGS.endSeconds,
              playsinline: 1,
              rel: 0,
              modestbranding: 1,
              controls: 1,
              cc_load_policy: 0,
              iv_load_policy: 3,
            },
            events: {
              onReady: () => {
                if (isMounted) {
                  setIsPlayerReady(true);
                  setEmbedError(null);
                }
              },
              onStateChange: (event: any) => {
                if (!isMounted) return;
                // event.data: 1 = PLAYING, 2 = PAUSED, 0 = ENDED
                setIsPlaying(event.data === 1);
                if (onStateChange) onStateChange(event.data);
              },
              onError: (event: any) => {
                console.warn('YouTube Player error code:', event.data);
                // 101 or 150 = embedding restricted by owner
                if (isMounted) {
                  setEmbedError(
                    "This video can't play inside the app. Tap to open it on YouTube."
                  );
                }
              },
            },
          });
        } catch (err) {
          console.error('Failed to create YT.Player', err);
        }
      };

      if (!window.YT || !window.YT.Player) {
        const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
        if (!existingScript) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const prevReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prevReady) prevReady();
          if (isMounted) {
            initPlayer();
          }
        };
      } else {
        initPlayer();
      }

      return () => {
        isMounted = false;
        clearSegmentTimers();
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          try {
            playerRef.current.destroy();
          } catch {
            // ignore
          }
        }
      };
    }, []);

    const fallbackUrl = `https://www.youtube.com/watch?v=${MOVIE_SETTINGS.videoId}&t=${MOVIE_SETTINGS.startSeconds}s`;

    return (
      <div className={`w-full flex flex-col items-center ${className}`}>
        {/* 16:9 Video Container */}
        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-slate-200">
          {embedError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-white">
              <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
              <p className="text-sm font-medium mb-3 text-slate-200">{embedError}</p>
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-xl transition shadow"
              >
                Open on YouTube
                <ExternalLink className="w-4 h-4" />
              </a>
              <p className="text-xs text-slate-400 mt-2">
                Sentence text, recording, and self-check will continue to work!
              </p>
            </div>
          ) : (
            <div id={containerIdRef.current} className="w-full h-full" />
          )}

          {/* Loading overlay if not ready yet */}
          {!isPlayerReady && !embedError && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white pointer-events-none">
              <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin mb-2" />
              <span className="text-xs font-medium text-slate-300">Loading YouTube clip...</span>
            </div>
          )}
        </div>

        {/* Mandatory One-Line Credit Under Video (at least 13px) */}
        {showCredit && (
          <div className="w-full mt-2 px-1 text-center">
            <p className="text-[13px] leading-snug text-slate-500 font-normal select-none">
              {ONE_LINE_CREDIT}
            </p>
          </div>
        )}
      </div>
    );
  }
);
