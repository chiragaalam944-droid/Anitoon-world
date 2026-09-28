import { useState, useEffect } from "react";
import { X, ExternalLink, RefreshCw } from "lucide-react";
import { type AnimeCard, getWatchHistory } from "@/lib/anime";

interface PlayerModalProps {
  anime: AnimeCard;
  startEpisode?: number;
  onClose: () => void;
  onListChange?: () => void;
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function PlayerModal({
  anime,
  startEpisode = 1,
  onClose,
}: PlayerModalProps) {
  const [episode, setEpisode] = useState(startEpisode);
  const [reloadKey, setReloadKey] = useState(0);

  const cleanSlug = toSlug(anime.title);
  
  // Working Direct Play + Fallback Direct AnimeDekho Link
  const gogoStreamUrl = `https://anitaku.pe/${cleanSlug}-episode-${episode}`;
  const embedUrl = `https://vidsrc.me/embed/anime?id=${anime.malId || anime.id}&s=1&e=${episode}`;

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface border border-border/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-surface-2">
          <h3 className="truncate font-display text-sm font-semibold text-fg sm:text-base">
            {anime.title} - Episode {episode}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black/40 text-muted hover:bg-black/60 hover:text-fg transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative flex-1 bg-black">
          <iframe
            key={`${episode}-${reloadKey}`}
            src={embedUrl}
            className="h-full w-full border-0"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={anime.title}
          />
        </div>

        {/* Player Controls */}
        <div className="flex flex-col gap-2.5 border-t border-border/60 p-3 bg-surface-2">
          <div className="flex items-center justify-between text-xs">
            <a
              href={gogoStreamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-full bg-brand/20 text-brand px-3 py-1 font-semibold hover:bg-brand/30 transition-colors"
            >
              <ExternalLink className="size-3.5" /> Direct Player / Server
            </a>

            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="flex items-center gap-1 text-muted hover:text-fg transition-colors"
            >
              <RefreshCw className="size-3.5" /> Reload
            </button>
          </div>

          {/* Episode Controls */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
            <span className="font-medium text-muted">Episode:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={episode <= 1}
                onClick={() => setEpisode((e) => Math.max(1, e - 1))}
                className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-fg disabled:opacity-30"
              >
                Prev Ep
              </button>
              <span className="font-bold text-fg px-1">{episode}</span>
              <button
                type="button"
                onClick={() => setEpisode((e) => e + 1)}
                className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-fg"
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
