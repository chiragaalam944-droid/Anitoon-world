import { useState, useEffect } from "react";
import { X, Play, Loader2 } from "lucide-react";
import {
  type AnimeCard,
  fetchStream,
  getWatchHistory,
} from "@/lib/anime";

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
  const [servers, setServers] = useState<any[]>([]);
  const [currentServer, setCurrentServer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchStream({ id: anime.id, episode })
      .then((res) => {
        if (!isMounted) return;
        const list = res?.servers || [];
        setServers(list);
        if (list.length > 0) setCurrentServer(list[0]);
      })
      .catch((err) => {
        console.error("Stream error:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Save to history
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
      console.error("Failed to save history:", e);
    }

    return () => {
      isMounted = false;
    };
  }, [anime, episode]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-surface border border-border/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-surface-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <Play className="size-5 shrink-0 text-brand fill-current" />
            <h3 className="truncate font-display text-base font-semibold text-fg sm:text-lg">
              {anime.title} - Episode {episode}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black/40 text-muted hover:bg-black/60 hover:text-fg transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Video Player Frame */}
        <div className="relative flex-1 bg-black">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted">
              <Loader2 className="size-8 animate-spin text-brand" />
            </div>
          ) : currentServer?.url ? (
            <iframe
              src={currentServer.url}
              className="h-full w-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title={anime.title}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted">
              <p>Player server unavailable.</p>
              <button
                type="button"
                onClick={() => setEpisode(episode)}
                className="rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-brand-fg"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Controls / Servers / Episodes */}
        <div className="flex flex-col gap-3 border-t border-border/50 p-4 bg-surface-2">
          {/* Server selector */}
          {servers.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-muted shrink-0">Server:</span>
              {servers.map((srv) => (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => setCurrentServer(srv)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    currentServer?.id === srv.id
                      ? "bg-brand text-brand-fg"
                      : "bg-surface text-muted hover:text-fg"
                  }`}
                >
                  {srv.name}
                </button>
              ))}
            </div>
          ) : null}

          {/* Episode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted shrink-0">Episode:</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={episode <= 1}
                onClick={() => setEpisode((e) => Math.max(1, e - 1))}
                className="rounded-full bg-surface px-3 py-1 text-xs text-muted disabled:opacity-40"
              >
                Prev Ep
              </button>
              <span className="text-xs font-bold text-fg self-center px-1">
                {episode}
              </span>
              <button
                type="button"
                onClick={() => setEpisode((e) => e + 1)}
                className="rounded-full bg-surface px-3 py-1 text-xs text-muted"
              >
                Next Ep
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
