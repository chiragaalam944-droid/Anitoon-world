import { useState, useEffect, useRef } from "react";
import { X, Film, AlertCircle, RefreshCw } from "lucide-react";
import Hls from "hls.js";
import { type AnimeCard, getWatchHistory } from "@/lib/anime";

interface PlayerModalProps {
  anime: AnimeCard;
  startEpisode?: number;
  onClose: () => void;
  onListChange?: () => void;
}

export function PlayerModal({
  anime,
  startEpisode = 1,
  onClose,
}: PlayerModalProps) {
  const [episode, setEpisode] = useState(startEpisode);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    try {
      const history = getWatchHistory();
      const filtered = history.filter((item) => item.id !== anime.id);
      const updated = [
        {
          id: anime.id,
          malId: anime.malId,
          title: anime.title,
          image: anime.image,
          episode,
          updatedAt: Date.now(),
        },
        ...filtered,
      ];
      localStorage.setItem("anitoon_history", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }, [anime, episode]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    async function loadStream() {
      try {
        const cleanId = anime.id || anime.malId || "naruto";
        const res = await fetch(`/api/stream?id=${cleanId}&episode=${episode}`);
        const data = await res.json();

        if (!data.sources || data.sources.length === 0) {
          throw new Error("Stream source not available right now");
        }

        const m3u8Url =
          data.sources.find((s: any) => s.isM3U8 || s.quality === "default")?.url ||
          data.sources[0].url;

        if (!isMounted) return;

        const video = videoRef.current;
        if (!video) return;

        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = m3u8Url;
          setLoading(false);
        } else if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            maxBufferLength: 30,
          });
          hlsRef.current = hls;
          hls.loadSource(m3u8Url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (isMounted) setLoading(false);
          });
          hls.on(Hls.Events.ERROR, () => {
            if (isMounted) setError("Stream buffering issue. Please try reloading.");
          });
        } else {
          setError("HLS playback is not supported on this browser.");
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load stream");
          setLoading(false);
        }
      }
    }

    loadStream();

    return () => {
      isMounted = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [anime.id, anime.malId, episode]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface border border-border/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-surface-2">
          <div className="flex items-center gap-2 truncate">
            <Film className="size-4 text-brand shrink-0" />
            <h3 className="truncate font-display text-sm font-semibold text-fg sm:text-base">
              {anime.title} - Episode {episode}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black/40 text-muted hover:bg-black/60 hover:text-fg transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Video Player Box */}
        <div className="relative flex-1 bg-black flex items-center justify-center">
          {loading && (
            <div className="absolute flex items-center gap-2 text-xs text-muted animate-pulse">
              <RefreshCw className="size-4 animate-spin text-brand" /> Fetching HLS Stream...
            </div>
          )}
          {error && (
            <div className="absolute text-xs text-red-400 flex items-center gap-1.5 p-4 text-center">
              <AlertCircle className="size-4 shrink-0" /> {error}
            </div>
          )}
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between text-xs px-4 py-3 border-t border-border/60 bg-surface-2">
          <span className="font-medium text-muted">Episode Navigation:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={episode <= 1}
              onClick={() => setEpisode((e) => Math.max(1, e - 1))}
              className="rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-fg border border-border/40 disabled:opacity-30"
            >
              Prev Ep
            </button>
            <span className="font-bold text-fg px-2 text-sm">{episode}</span>
            <button
              type="button"
              onClick={() => setEpisode((e) => e + 1)}
              className="rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-fg border border-border/40"
            >
              Next Ep
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
