export const ANIME_SERVERS = [
  { name: "HydraX", url: "https://player.smashy.stream/anime/" },
  { name: "MyCloud", url: "https://vidlink.pro/anime/" },
  { name: "VidCloud", url: "https://vidsrc.cc/v2/embed/anime/" },
  { name: "Vidmoly", url: "https://player.smashy.stream/anime/" },
  { name: "SRuby", url: "https://vidlink.pro/anime/" },
  { name: "NeoCDN", url: "https://vidsrc.cc/v2/embed/anime/" },
];

export async function loadStream(opts: {
  aniListId?: string;
  malId?: number;
  episode?: number;
  title?: string;
}) {
  return {
    servers: [
      { id: "hydrax-1", name: "HydraX", url: "https://player.smashy.stream/anime/" },
      { id: "vidcloud-1", name: "VidCloud", url: "https://vidsrc.cc/v2/embed/anime/" },
      { id: "vidmoly-1", name: "Vidmoly", url: "https://player.smashy.stream/anime/" },
      { id: "mycloud-1", name: "MyCloud", url: "https://vidlink.pro/anime/" },
    ],
  };
}
