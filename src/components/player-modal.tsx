import { useState, useEffect } from "react";
import { X, Server } from "lucide-react";
import { type AnimeCard, getWatchHistory } from "@/lib/anime";

interface PlayerModalProps {
  anime: AnimeCard;
  startEpisode?: number;
  onClose: () => void;
  onListChange?: () => void;
}

const WORKING_SERVERS = [
  {
    id: "autoembed",
    name: "Server 1 (Fast Auto)",
    getUrl: (id: string, ep: number) =>
      `https://player.autoembed.cc/embed/anime/${id}/${ep}`,
  },
  {
    id: "vidsrcpro",
    name: "Server 2 (Hindi/Dub)",
    getUrl: (id: string, ep: number) =>
      `https://vidsrc.pro/embed/anime/${id}/${ep}`,
  },
  {
    id: "2embed",
    name: "Server 3 (AnimeDekho)",
    getUrl: (id: string, ep: number) =>
      `https://www.2embed.cc/embedanime/${id}?ep=${ep}`,
  },
  {
    id: "animeplay",
    name: "Server 4 (Backup)",
    getUrl: (id: string, ep: number) =>
      `https://anime.vidsrc.vip/embed/anime/${id}/${ep}`,
  },
];

export function PlayerModal({
  anime,
  startEpisode = 1,
  onClose,
}: PlayerModalProps) {
  const [episode, setEpisode] = useState(startEpisode);
  const [activeServer, setActiveServer] = useState(WORKING_SERVERS[0]);

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

        {/* Video Player Frame */}
        <div className="relative flex-1 bg-black">
          <iframe
            key={`${activeServer.id}-${episode}`}
            src={activeServer.getUrl(String(animeId), episode)}
            className="h-full w-full border-0"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            title={anime.title}
          />
        </div>

        {/* Server Selection & Episodes */}
        <div className="flex flex-col gap-2.5 border-t border-border/60 p-3 bg-surface-2">
          {/* Servers */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <span className="flex items-center gap-1 font-semibold text-muted shrink-0">
              <Server className="size-3.5" /> Server:
            </span>
            {WORKING_SERVERS.map((srv) => (
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
