import { useState, useEffect } from "react";
import { X, Server } from "lucide-react";
import { type AnimeCard, getWatchHistory } from "@/lib/anime";

interface PlayerModalProps {
  anime: AnimeCard;
  startEpisode?: number;
  onClose: () => void;
  onListChange?: () => void;
}

// Convert title into clean URL slug (e.g., "Re:ZERO -Starting Life..." -> "re-zero-starting-life-in-another-world")
function formatSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const SERVERS = [
  {
    id: "vidsrc-embed",
    name: "Server 1 (VidSrc ID)",
    getUrl: (anime: AnimeCard, ep: number) =>
      `https://vidsrc.cc/v2/embed/anime/${anime.malId || anime.id}/${ep}`,
  },
  {
    id: "gogo-slug",
    name: "Server 2 (Auto Slug)",
    getUrl: (anime: AnimeCard, ep: number) =>
      `https://em.vidsrc.pro/embed/anime/${formatSlug(anime.title)}/${ep}`,
  },
  {
    id: "smashy-id",
    name: "Server 3 (Smashy)",
    getUrl: (anime: AnimeCard, ep: number) =>
      `https://player.smashy.stream/anime/${anime.malId || anime.id}?ep=${ep}`,
  },
  {
    id: "2embed-id",
    name: "Server 4 (Backup)",
    getUrl: (anime: AnimeCard, ep: number) =>
      `https://www.2embed.cc/embedanime/${anime.malId || anime.id}?ep=${ep}`,
  },
];

export function PlayerModal({
  anime,
  startEpisode = 1,
  onClose,
}: PlayerModalProps) {
  const [episode, setEpisode] = useState(startEpisode);
  const [activeServer, setActiveServer] = useState(SERVERS[0]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-md"
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

        {/* Video Player Frame */}
        <div className="relative flex-1 bg-black">
          <iframe
            key={`${activeServer.id}-${episode}`}
            src={activeServer.getUrl(anime, episode)}
            className="h-full w-full border-0"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            title={anime.title}
          />
        </div>

        {/* Server Selection & Episode Controls */}
        <div className="flex flex-col gap-2.5 border-t border-border/60 p-3 bg-surface-2">
          {/* Server Selector */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <span className="flex items-center gap-1 font-semibold text-muted shrink-0">
              <Server className="size-3.5" /> Server:
            </span>
            {SERVERS.map((srv) => (
              <button
                key={srv.id}
                type="button"
                onClick={() => setActiveServer(srv)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  activeServer.id === srv.id
                    ? "bg-brand text-brand-fg font-bold"
                    : "bg-surface text-muted hover:text-fg"
                }`}
              >
                {srv.name}
              </button>
            ))}
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
