import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
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

  const streamUrl = `https://vidsrc.cc/v2/embed/anime/${anime.malId || anime.id}/${episode}`;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-surface border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface-2">
          <h3 className="truncate font-display text-sm font-semibold text-fg sm:text-base">
            {anime.title} - Episode {episode}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-black/50 text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Player Iframe */}
        <div className="relative flex-1 bg-black">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-8 animate-spin text-brand" />
            </div>
          ) : null}
          <iframe
            src={streamUrl}
            className="h-full w-full border-0"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            onLoad={() => setLoading(false)}
            title={anime.title}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-surface-2">
          <span className="text-xs font-medium text-muted">Episode:</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={episode <= 1}
              onClick={() => {
                setLoading(true);
                setEpisode((e) => Math.max(1, e - 1));
              }}
              className="rounded-full bg-surface px-3 py-1 text-xs text-fg disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-xs font-bold text-fg self-center">{episode}</span>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setEpisode((e) => e + 1);
              }}
              className="rounded-full bg-surface px-3 py-1 text-xs text-fg"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
