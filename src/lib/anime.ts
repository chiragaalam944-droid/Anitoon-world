export interface AnimeItem {
  id: string;
  title: string;
  image: string;
  episodeNumber?: number;
  type?: string;
  url?: string;
}

export interface StreamServer {
  id: string;
  name: string;
  url: string;
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

export async function fetchTrendingAnime(): Promise<AnimeItem[]> {
  try {
    const res = await fetch("https://api.jikan.moe/v4/top/anime");
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((item: any) => ({
      id: String(item.mal_id),
      title: item.title_english || item.title,
      image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
      episodeNumber: item.episodes || 1,
    }));
  } catch (e) {
    return [];
  }
}

export async function fetchStream(opts: {
  aniListId?: string;
  malId?: number;
  episode?: number;
  title?: string;
}): Promise<{ servers: StreamServer[] }> {
  const defaultServers: StreamServer[] = [
    { id: "hydrax", name: "HydraX", url: "https://player.smashy.stream/anime/" },
    { id: "vidcloud", name: "VidCloud", url: "https://vidsrc.cc/v2/embed/anime/" },
    { id: "vidmoly", name: "Vidmoly", url: "https://player.smashy.stream/anime/" },
    { id: "mycloud", name: "MyCloud", url: "https://vidlink.pro/anime/" },
  ];

  return {
    servers: defaultServers.map((srv) => ({
      ...srv,
      name: SERVER_NAME_MAP[srv.name] || srv.name,
    })),
  };
}
