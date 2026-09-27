export const ANIME_SERVERS = [
  { name: "HydraX", url: "https://player.smashy.stream/anime/" },
  { name: "MyCloud", url: "https://vidlink.pro/anime/" },
  { name: "VidCloud", url: "https://vidsrc.cc/v2/embed/anime/" },
  { name: "Vidmoly", url: "https://player.smashy.stream/anime/" },
  { name: "SRuby", url: "https://vidlink.pro/anime/" },
  { name: "NeoCDN", url: "https://vidsrc.cc/v2/embed/anime/" },
];

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

export async function loadCatalog(category: string = "trending") {
  try {
    const res = await fetch(
      `https://consumet-api-clone.vercel.app/anime/gogoanime/top-airing`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return { results: [] };
    const data = await res.json();
    return { results: data.results || [] };
  } catch (err) {
    console.error("Catalog fetch error:", err);
    return { results: [] };
  }
}

export async function loadInfo(id: string) {
  try {
    const res = await fetch(
      `https://consumet-api-clone.vercel.app/anime/gogoanime/info/${id}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Info fetch error:", err);
    return null;
  }
}

export async function loadSearch(query: string) {
  try {
    const res = await fetch(
      `https://consumet-api-clone.vercel.app/anime/gogoanime/${encodeURIComponent(query)}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return { results: [] };
    const data = await res.json();
    return { results: data.results || [] };
  } catch (err) {
    console.error("Search fetch error:", err);
    return { results: [] };
  }
}

export async function loadStream(opts: {
  aniListId?: string;
  malId?: number;
  episode?: number;
  title?: string;
}) {
  try {
    const ep = opts.episode || 1;
    const query = opts.title ? encodeURIComponent(opts.title) : "anime";
    const searchRes = await fetch(
      `https://consumet-api-clone.vercel.app/anime/gogoanime/${query}`
    );
    
    let episodeId = "";
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.results && searchData.results.length > 0) {
        const infoRes = await fetch(
          `https://consumet-api-clone.vercel.app/anime/gogoanime/info/${searchData.results[0].id}`
        );
        if (infoRes.ok) {
          const infoData = await infoRes.json();
          const foundEp = (infoData.episodes || []).find(
            (e: any) => e.number === ep
          );
          if (foundEp) episodeId = foundEp.id;
        }
      }
    }

    if (!episodeId) {
      return {
        servers: ANIME_SERVERS.map((s, i) => ({
          id: `fallback-${i}`,
          name: s.name,
          url: s.url,
        })),
      };
    }

    const streamRes = await fetch(
      `https://consumet-api-clone.vercel.app/anime/gogoanime/watch/${episodeId}`
    );
    if (!streamRes.ok) {
      return {
        servers: ANIME_SERVERS.map((s, i) => ({
          id: `fallback-${i}`,
          name: s.name,
          url: s.url,
        })),
      };
    }

    const streamData = await streamRes.json();
    const rawServers = streamData.sources || streamData.servers || [];

    const servers = rawServers.map((srv: any, idx: number) => {
      const rawName = srv.name || srv.quality || `Server ${idx + 1}`;
      const mappedName = SERVER_NAME_MAP[rawName] || rawName;
      return {
        id: srv.id || `srv-${idx}`,
        name: mappedName,
        url: srv.url || srv.file || "",
      };
    });

    return { servers: servers.length > 0 ? servers : ANIME_SERVERS };
  } catch (err) {
    console.error("Stream fetch error:", err);
    return {
      servers: ANIME_SERVERS.map((s, i) => ({
        id: `fallback-${i}`,
        name: s.name,
        url: s.url,
      })),
    };
  }
        }
      
