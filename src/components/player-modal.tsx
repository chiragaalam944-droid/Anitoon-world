import { useState, useEffect } from "react";
import { X, Play, ExternalLink, RefreshCw, Film } from "lucide-react";
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
  const [serverIdx, setServerIdx] = useState(0);

  const malId = anime.malId || anime.id || "21";

  const SERVERS = [
    {
      name: "MegaFlix Server",
      desc: "Fast Multi-Quality Player (MAL Route)",
      url: `https://megaflix.buzz/stream/mal/${malId}/${episode}/sub`,
    },
    {
      name: "DropFile Server",
      desc: "HD Stream Player",
      url: `https://dropfile.cc/player/tv/mal-${malId}/${episode}/1?audio=sub&lang=en`,
    },
    {
      name: "VidSrc CC Server",
      desc: "Backup High-Speed Player",
      url: `https://vidsrc.cc/v2/embed/anime/${malId}/${episode}?poster=true&autoPlay=true`,
    },
  ];

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

  const activeServer = SERVERS[serverIdx] || SERVERS[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-surface border border-border/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-surface-2">
          <div className="flex items-center gap-2 truncate">
            <Film className="size-4 text-brand shrink-0" />
            <h3 className="truncate font-display text-sm font-semibold text-fg sm:text-base">
              {anime.title}
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

        {/* Player / Server Launcher Interface */}
        <div className="p-6 flex flex-col items-center justify-center text-center bg-gradient-to-b from-surface-2 to-surface gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand">
              Episode {episode}
            </span>
            <h4 className="text-lg font-bold text-fg">{activeServer.name}</h4>
            <p className="text-xs text-muted">{activeServer.desc}</p>
          </div>

          {/* Launch Button */}
          <a
            href={activeServer.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-xs py-3 px-6 rounded-xl bg-brand text-brand-fg font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            <Play className="size-4 fill-current" /> Watch Episode {episode} <ExternalLink className="size-4" />
          </a>

          {/* Server Switcher Options */}
          <div className="w-full pt-4 border-t border-border/40">
            <p className="text-xs font-medium text-muted mb-2">Select Preferred Server:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SERVERS.map((srv, idx) => (
                <button
                  key={srv.name}
                  type="button"
                  onClick={() => setServerIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    serverIdx === idx
                      ? "bg-brand/20 text-brand border border-brand/40"
                      : "bg-surface-2 text-muted hover:text-fg border border-border/40"
                  }`}
                >
                  {srv.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Episode Controls */}
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
