import { useState } from "react";
import { X, Film, Server } from "lucide-react";
import { type AnimeCard } from "@/lib/anime";

interface PlayerModalProps {
  anime: AnimeCard;
  startEpisode?: number;
  onClose: () => void;
}

export function PlayerModal({
  anime,
  startEpisode = 1,
  onClose,
}: PlayerModalProps) {
  const [episode, setEpisode] = useState(startEpisode);
  const [selectedServer, setSelectedServer] = useState(1);

  const animeId = anime.malId || anime.id || "11061";

  // 3 Multi-Server Links (Non-blocked embeds)
  const servers = [
    { id: 1, name: "Server 1 (VidSrc)", url: `https://vidsrc.pro/embed/anime/${animeId}/${episode}` },
    { id: 2, name: "Server 2 (AutoEmbed)", url: `https://player.autoembed.cc/embed/anime/${animeId}/${episode}` },
    { id: 3, name: "Server 3 (VidBinge)", url: `https://vidbinge.dev/embed/anime/${animeId}/${episode}` },
  ];

  const currentServerUrl = servers.find((s) => s.id === selectedServer)?.url || servers[0].url;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface border border-border/60 shadow-2xl"
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

        {/* Server Selector Bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-surface border-b border-border/40 overflow-x-auto text-xs">
          <span className="flex items-center gap-1 font-medium text-muted shrink-0">
            <Server className="size-3.5" /> Server:
          </span>
          {servers.map((server) => (
            <button
              key={server.id}
              onClick={() => setSelectedServer(server.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                selectedServer === server.id
                  ? "bg-brand text-brand-fg"
                  : "bg-surface-2 text-muted hover:text-fg"
              }`}
            >
              {server.name}
            </button>
          ))}
        </div>

        {/* Embed Player */}
        <div className="relative flex-1 bg-black">
          <iframe
            key={`${selectedServer}-${episode}`}
            src={currentServerUrl}
            className="h-full w-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
          />
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
