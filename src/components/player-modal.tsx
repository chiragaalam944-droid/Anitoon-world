import { useState, useEffect } from "react";
import { X, RefreshCw, Server } from "lucide-react";
import { type AnimeCard, getWatchHistory } from "@/lib/anime";

interface PlayerModalProps {
  anime: AnimeCard;
  startEpisode?: number;
  onClose: () => void;
  onListChange?: () => void;
}

const SERVERS = [
  { id: "vidsrc", name: "VidSrc", url: (id: string, ep: number) => `https://vidsrc.cc/v2/embed/anime/${id}/${ep}` },
  { id: "smashy", name: "SmashyStream", url: (id: string, ep: number) => `https://player.smashy.stream/anime/${id}?ep=${ep}` },
  { id: "vidlink", name: "VidLink", url: (id: string, ep: number) => `https://vidlink.pro/anime/${id}/${ep}` },
];

export function PlayerModal({
  anime,
  startEpisode = 1,
  onClose,
}: PlayerModalProps) {
  const [episode, setEpisode] = useState(startEpisode);
  const [activeServer, setActiveServer] = useState(SERVERS[0]);
  const [iframeKey, setIframeKey] = useState(0);

  const animeId = anime.malId || anime.id || "21";

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

  const reloadPlayer = () => {
    setIframeKey((prev) => prev + 1);
  };

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
          <div className="flex items-center gap-2 overflow-hidden">
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

        {/* Player Frame */}
        <div className="relative flex-1 bg-black">
          <iframe
            key={`${activeServer.id}-${episode}-${iframeKey}`}
            src={activeServer.url(String(animeId), episode)}
            className="h-full w-full border-0"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={anime.title}
          />
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col gap-2.5 border-t border-border/60 p-3 bg-surface-2">
          {/* Servers Row */}
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
            <button
              type="button"
              onClick={reloadPlayer}
              className="ml-auto shrink-0 p-1 text-muted hover:text-fg"
              title="Reload Player"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>

          {/* Episode Navigation */}
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
