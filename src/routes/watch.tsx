import React, { useState } from 'react';

const SERVERS = [
  { name: "HydraX", url: "https://player.smashy.stream/anime/" },
  { name: "MyCloud", url: "https://vidlink.pro/anime/" },
  { name: "VidCloud", url: "https://vidsrc.cc/v2/embed/anime/" },
  { name: "Vidmoly", url: "https://player.smashy.stream/anime/" },
  { name: "SRuby", url: "https://vidlink.pro/anime/" },
  { name: "NeoCDN", url: "https://vidsrc.cc/v2/embed/anime/" }
];

export default function Watch() {
  const [selectedServer, setSelectedServer] = useState(SERVERS[0]);

  return (
    <div className="p-4 text-white">
      <div className="flex flex-wrap gap-2 mb-4">
        {SERVERS.map((server, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedServer(server)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              selectedServer.name === server.name ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            {server.name}
          </button>
        ))}
      </div>
    </div>
  );
}
