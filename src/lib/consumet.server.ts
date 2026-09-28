export async function getAnimeStreamUrl(title: string, episode: number = 1) {
  try {
    const query = encodeURIComponent(title);
    const searchRes = await fetch(
      `https://api.consumet.org/anime/gogoanime/${query}`
    );
    const searchData = await searchRes.json();

    if (searchData?.results?.length > 0) {
      const animeId = searchData.results[0].id;
      const episodeId = `${animeId}-episode-${episode}`;

      const streamRes = await fetch(
        `https://api.consumet.org/anime/gogoanime/watch/${episodeId}`
      );
      const streamData = await streamRes.json();

      if (streamData?.headers?.Referer && streamData?.sources?.length > 0) {
        const defaultSource =
          streamData.sources.find((s: any) => s.quality === "default") ||
          streamData.sources[0];
        return defaultSource.url;
      }
    }
  } catch (err) {
    console.error("Consumet Stream Fetch Error:", err);
  }
  return null;
}
