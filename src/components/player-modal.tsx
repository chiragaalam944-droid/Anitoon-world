"use client";

import { useEffect, useState } from "react";
import { StreamServer, fetchStream } from "@/lib/anime";

export interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeId: string;
  malId?: number;
  episodeNumber: number;
  animeTitle: string;
}

const SERVER_NAME_MAP: Record<string, string> = {
  "Hindi Dub": "HydraX (Hindi)",
  "Japanese SUB": "HydraX (SUB)",
  "English Dub": "HydraX (DUB)",
  Vidstream: "HydraX",
  "Vidstream Hindi": "VidCloud (Hindi)",
  "Vidstream DUB": "VidCloud (DUB)",
  StreamWish: "VidCloud",
  "Server 4": "Vidmoly",
  "2Embed": "MyCloud",
};

function normalizeServer(server: StreamServer): StreamServer {
  const cleanName = SERVER_NAME_MAP[server.name] || server.name;
  return { ...server, name: cleanName };
}

export function PlayerModal({
  isOpen,
  onClose,
  animeId,
  malId,
  episodeNumber,
  animeTitle,
}: PlayerModalProps) {
  const [servers, setServers] = useState<StreamServer[]>([]);
  const [activeServer, setActiveServer] = useState<StreamServer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    fetchStream({
      aniListId: animeId,
      malId,
      episode: episodeNumber,
      title: animeTitle,
    })
      .then((data) => {
        const cleaned = (data.servers || []).map(normalizeServer);
        setServers(cleaned);
        if (cleaned.length > 0) {
          setActiveServer(cleaned[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to load servers", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, animeId, malId, episodeNumber, animeTitle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-4xl rounded-xl bg-zinc-900 p-6 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-2xl font-bold text-zinc-400 hover:text-white"
        >
          ✕
        </button>
        <h2 className="mb-4 text-xl font-bold">
          {animeTitle} - Episode {episodeNumber}
        </h2>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="animate-pulse text-zinc-400">Loading servers...</p>
          </div>
        ) : (
          <div>
            {activeServer ? (
              <iframe
                src={activeServer.url}
                className="h-96 w-full rounded-lg border border-zinc-800"
                allowFullScreen
              />
            ) : (
              <p className="text-red-400">No stream sources found.</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {servers.map((srv, idx) => (
                <button
                  key={srv.id || idx}
                  onClick={() => setActiveServer(srv)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    activeServer?.name === srv.name
                      ? "bg-red-600 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {srv.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
