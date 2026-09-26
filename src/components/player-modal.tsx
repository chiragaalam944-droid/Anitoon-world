import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Play,
  SkipForward,
  X,
} from "lucide-react";
import { consumeAdReturn, isAdVerified } from "@/lib/ad";
import {
  buildEmbedServers,
  fetchInfo,
  fetchStream,
  isInMyList,
  POSTER_FALLBACK,
  pushWatchHistory,
  toggleMyList,
  type AnimeCard,
  type AnimeInfo,
  type StreamServer,
} from "@/lib/anime";
import { cn } from "@/lib/utils";
import { AdGate } from "./ad-gate";
import { LangBadges } from "./lang-badges";

type PlayerModalProps = {
  anime: AnimeCard;
  startEpisode?: number;
  onClose: () => void;
  onListChange: () => void;
};

function isEndedMessage(data: unknown): boolean {
  if (data === "ended" || data === "complete") return true;
  if (typeof data === "string") return /ended|complete|mediaended/i.test(data);
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    const tokens = [rec.event, rec.type, rec.data, rec.action]
      .filter((v) => typeof v === "string")
      .join(" ");
    return /ended|complete|mediaended/i.test(tokens);
  }
  return false;
}

export function PlayerModal({
  anime,
  startEpisode,
  onClose,
  onListChange,
}: PlayerModalProps) {
  const [info, setInfo] = useState<AnimeInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [episode, setEpisode] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<"play" | "download" | null>(
    startEpisode ? "play" : null,
  );
  const [pendingEpisode, setPendingEpisode] = useState<number | null>(startEpisode ?? 1);
  const [showAd, setShowAd] = useState(false);
  const relabelServers = (list) => {
    if (!Array.isArray(list)) return list;
    return list.map(s => {
      const name = String(s.name || s.id || "").toLowerCase();
      let newName = s.name || s.id;
      if (name.includes("vidstream")) newName = "HydraX";
      else if (name.includes("2embed")) newName = "MyCloud";
      else if (name.includes("streamwish")) newName = "VidCloud";
      else if (name.includes("server 4") || name.includes("vidmoly")) newName = "Vidmoly";
      else if (name.includes("ruby")) newName = "SRuby";
      else if (name.includes("neo")) newName = "NeoCDN";
      return { ...s, name: newName, label: newName };
    });
  };
  const [servers, setServers] = useState<StreamServer[]>([]);
  const [serverId, setServerId] = useState<string | null>(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [saved, setSaved] = useState(() => isInMyList(anime.id));
  const [autoNext, setAutoNext] = useState(true);
  const [nextCountdown, setNextCountdown] = useState<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const autoNextRef = useRef(autoNext);
  const episodeRef = useRef(episode);
  const maxEpRef = useRef(1);

  const episodes = info?.episodes ?? [{ id: "1", number: 1, title: "Episode 1" }];
  const maxEp = episodes[episodes.length - 1]?.number ?? 1;
  autoNextRef.current = autoNext;
  episodeRef.current = episode;
  maxEpRef.current = maxEp;

  const requestPlay = useCallback((ep: number) => {
    const immediate = buildEmbedServers(anime.id, anime.malId, ep, anime.title);
    setServers(immediate);
    setServerId(immediate[0]?.id ?? null);
    setLoadingStream(false);
    setStreamError(immediate.length ? null : "No playback mirrors are available for this episode.");
    if (isAdVerified()) {
      setShowAd(false);
      setEpisode(ep);
      return;
    }
    setPendingAction("play");
    setPendingEpisode(ep);
    setShowAd(true);
  }, [anime.id, anime.malId]);

  const goNext = useCallback(() => {
    const current = episodeRef.current;
    if (!current) return;
    const idx = episodes.findIndex((e) => e.number === current);
    const next = episodes[idx + 1] ?? episodes.find((e) => e.number === current + 1);
    if (next) requestPlay(next.number);
  }, [episodes, requestPlay]);

  const goPrev = useCallback(() => {
    const current = episodeRef.current;
    if (!current) return;
    const idx = episodes.findIndex((e) => e.number === current);
    const prev = episodes[idx - 1] ?? episodes.find((e) => e.number === current - 1);
    if (prev) requestPlay(prev.number);
  }, [episodes, requestPlay]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    consumeAdReturn();
    if (startEpisode && isAdVerified()) {
      requestPlay(startEpisode);
    } else if (startEpisode) {
      setShowAd(true);
      setPendingAction("play");
      setPendingEpisode(startEpisode);
    }
  }, [startEpisode, requestPlay]);

  useEffect(() => {
    let cancelled = false;
    setLoadingInfo(true);
    setInfoError(null);
    fetchInfo(anime.id, anime.title)
      .then((data) => {
        if (cancelled) return;
        setInfo(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setInfoError(err instanceof Error ? err.message : "Could not load details");
      })
      .finally(() => {
        if (!cancelled) setLoadingInfo(false);
      });
    return () => {
      cancelled = true;
    };
  }, [anime.id, anime.title]);

  useEffect(() => {
    if (!episode) return;
    const immediate = buildEmbedServers(info?.id ?? anime.id, info?.malId ?? anime.malId, episode, info?.title ?? anime.title);
    setServers(immediate);
    setServerId((current) => current ?? immediate[0]?.id ?? null);
    setLoadingStream(false);
    setStreamError(immediate.length ? null : "No playback mirrors are available for this episode.");
    pushWatchHistory({
      id: info?.id ?? anime.id,
      malId: info?.malId ?? anime.malId,
      title: info?.title ?? anime.title,
      image: info?.image ?? anime.image,
      episode,
      updatedAt: Date.now(),
    });
    onListChange();

    let cancelled = false;
    const epMeta = info?.episodes.find((e) => e.number === episode);
    fetchStream({
      anilistId: info?.id ?? anime.id,
      malId: info?.malId ?? anime.malId,
      episode,
      episodeId: epMeta?.id,
      title: info?.title ?? anime.title,
    })
      .then((payload) => {
        if (cancelled || !payload.servers.length) return;
        setServers((prev) => {
          const seen = new Set(prev.map((s) => s.url));
          const extra = payload.servers.filter((s) => !seen.has(s.url));
          return extra.length ? [...prev, ...extra] : prev;
        });
      })
      .catch(() => {
        /* local embeds already loaded */
      });
    return () => {
      cancelled = true;
    };
  }, [episode, info, anime.id, anime.malId, anime.title, anime.image, onListChange]);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (!isEndedMessage(e.data) || !autoNextRef.current) return;
      const current = episodeRef.current;
      if (!current || current >= maxEpRef.current) return;
      setNextCountdown((n) => n ?? 8);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    if (nextCountdown == null) return;
    if (nextCountdown <= 0) {
      setNextCountdown(null);
      goNext();
      return;
    }
    countdownRef.current = window.setTimeout(() => {
      setNextCountdown((n) => (n == null ? n : n - 1));
    }, 1000);
    return () => {
      if (countdownRef.current) window.clearTimeout(countdownRef.current);
    };
  }, [nextCountdown, goNext]);

  const activeServer = useMemo(
    () => servers.find((s) => s.id === serverId) ?? servers[0],
    [servers, serverId],
  );

  const display = info ?? anime;
  const description = display.description || "No synopsis is available yet.";

  function onToggleList() {
    toggleMyList({
      id: display.id,
      malId: display.malId,
      title: display.title,
      image: display.image,
    });
    setSaved(isInMyList(display.id));
    onListChange();
  }

  function runDownload() {
    const url =
      activeServer?.download ||
      activeServer?.url ||
      (display.malId
        ? `https://vidsrc.pm/embed/anime/${display.malId}/${pendingEpisode ?? episode ?? 1}`
        : null);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  function onDownload() {
    if (isAdVerified()) {
      if (!episode) requestPlay(pendingEpisode ?? 1);
      runDownload();
      return;
    }
    setPendingAction("download");
    setShowAd(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-0 sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="atw-player-title"
        className="relative flex max-h-dvh w-full max-w-5xl flex-col overflow-hidden rounded-t-xl bg-surface shadow-border sm:max-h-[min(92dvh,920px)] sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-video w-full bg-bg">
          {episode && activeServer && !loadingStream ? (
            <iframe
              key={`${activeServer.url}-${episode}`}
              title={`${display.title} player`}
              src={activeServer.url}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer"
              onError={() => {
                const idx = servers.findIndex((s) => s.id === activeServer.id);
                const fallback = servers[idx + 1];
                if (fallback) setServerId(fallback.id);
              }}
            />
          ) : (
            <div className="absolute inset-0">
              <img
                src={display.cover || display.image || POSTER_FALLBACK}
                alt=""
                className="h-full w-full object-cover opacity-50"
                onError={(e) => {
                  e.currentTarget.src = POSTER_FALLBACK;
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/40">
                {loadingStream || (loadingInfo && startEpisode) ? (
                  <>
                    <span className="atw-spinner" aria-hidden />
                    <p className="text-sm text-muted">Loading player…</p>
                  </>
                ) : streamError ? (
                  <p className="max-w-md px-6 text-center text-sm text-muted">{streamError}</p>
                ) : (
                  <>
                    <button
                      type="button"
                      className="flex h-12 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-fg transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
                      onClick={() =>{ (() => {
      const txt = JSON.stringify(s).toLowerCase();
      if (txt.includes("vidstream")) return "HydraX";
      if (txt.includes("2embed")) return "MyCloud";
      if (txt.includes("streamwish")) return "VidCloud";
      if (txt.includes("server 4") || txt.includes("vidmoly")) return "Vidmoly";
      if (txt.includes("ruby")) return "SRuby";
      if (txt.includes("neo")) return "NeoCDN";
      return s.name || s.id || "Server";
    })() }</button>
                    <p className="text-xs text-muted">Choose an episode below to start</p>
                  </>
                )}
              </div>
            </div>
          )}

          {nextCountdown != null ? (
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-bg/80 px-4 py-3 backdrop-blur-sm">
              <p className="text-sm text-fg">
                Next episode in <span className="tabular-nums">{nextCountdown}</span>s
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="h-10 rounded-full bg-surface-2 px-3 text-xs font-medium text-muted"
                  onClick={() =>{ (() => {
      const txt = JSON.stringify(s).toLowerCase();
      if (txt.includes("vidstream")) return "HydraX";
      if (txt.includes("2embed")) return "MyCloud";
      if (txt.includes("streamwish")) return "VidCloud";
      if (txt.includes("server 4") || txt.includes("vidmoly")) return "Vidmoly";
      if (txt.includes("ruby")) return "SRuby";
      if (txt.includes("neo")) return "NeoCDN";
      return s.name || s.id || "Server";
    })() }</button>
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-1 rounded-full bg-accent px-3 text-xs font-medium text-accent-fg"
                  onClick={() =>{ (() => {
      const txt = JSON.stringify(s).toLowerCase();
      if (txt.includes("vidstream")) return "HydraX";
      if (txt.includes("2embed")) return "MyCloud";
      if (txt.includes("streamwish")) return "VidCloud";
      if (txt.includes("server 4") || txt.includes("vidmoly")) return "Vidmoly";
      if (txt.includes("ruby")) return "SRuby";
      if (txt.includes("neo")) return "NeoCDN";
      return s.name || s.id || "Server";
    })() }</button>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            aria-label="Close player"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-full bg-bg/80 text-fg backdrop-blur-sm transition-opacity duration-150 hover:opacity-90"
          >{ (() => {
      const txt = JSON.stringify(s).toLowerCase();
      if (txt.includes("vidstream")) return "HydraX";
      if (txt.includes("2embed")) return "MyCloud";
      if (txt.includes("streamwish")) return "VidCloud";
      if (txt.includes("server 4") || txt.includes("vidmoly")) return "Vidmoly";
      if (txt.includes("ruby")) return "SRuby";
      if (txt.includes("neo")) return "NeoCDN";
      return s.name || s.id || "Server";
    })() }</button>

          {showAd ? (
            <AdGate
              resume={{
                id: anime.id,
                malId: anime.malId,
                title: anime.title,
                image: anime.image,
                episode: pendingEpisode ?? startEpisode ?? 1,
                action: pendingAction ?? "play",
              }}
              onClose={() => setShowAd(false)}
            />
          ) : null}
        </div>

        {servers.length > 0 && episode ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-6">
            {servers.map((s) => { console.log("SERVER DATA:", s); return (
              <button
                key={s.id}
                type="button"
                onClick={() =>{ (() => {
      const txt = JSON.stringify(s).toLowerCase();
      if (txt.includes("vidstream")) return "HydraX";
      if (txt.includes("2embed")) return "MyCloud";
      if (txt.includes("streamwish")) return "VidCloud";
      if (txt.includes("server 4") || txt.includes("vidmoly")) return "Vidmoly";
      if (txt.includes("ruby")) return "SRuby";
      if (txt.includes("neo")) return "NeoCDN";
      return s.name || s.id || "Server";
    })() }</button>
            ))}
            <p className="w-full text-[11px] text-subtle sm:ml-auto sm:w-auto">
              If playback does not start, try another server.
            </p>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="atw-player-title"
                className="font-display text-2xl leading-tight text-fg sm:text-3xl"
              >
                {display.title}
              </h2>
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                {display.releaseDate ? <span>{display.releaseDate}</span> : null}
                {display.type ? <span>{display.type}</span> : null}
                {display.status ? <span>{display.status.replaceAll("_", " ")}</span> : null}
                {episode ? <span className="tabular-nums">Episode {episode}</span> : null}
              </p>
              <div className="mt-3">
                <LangBadges badges={display.languages} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onToggleList}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-150",
                  saved ? "bg-surface-2 text-fg shadow-border" : "bg-fg text-bg hover:opacity-90",
                )}
              >{ (() => {
      const txt = JSON.stringify(s).toLowerCase();
      if (txt.includes("vidstream")) return "HydraX";
      if (txt.includes("2embed")) return "MyCloud";
      if (txt.includes("streamwish")) return "VidCloud";
      if (txt.includes("server 4") || txt.includes("vidmoly")) return "Vidmoly";
      if (txt.includes("ruby")) return "SRuby";
      if (txt.includes("neo")) return "NeoCDN";
      return s.name || s.id || "Server";
    })() }</button>
              <button
                type="button"
                onClick={onDownload}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-medium text-fg shadow-border hover:shadow-border-hover"
              >{ (() => {
      const txt = JSON.stringify(s).toLowerCase();
      if (txt.includes("vidstream")) return "HydraX";
      if (txt.includes("2embed")) return "MyCloud";
      if (txt.includes("streamwish")) return "VidCloud";
      if (txt.includes("server 4") || txt.includes("vidmoly")) return "Vidmoly";
      if (txt.includes("ruby")) return "SRuby";
      if (txt.includes("neo")) return "NeoCDN";
      return s.name || s.id || "Server";
    })() }</button>
            </div>
          </div>

          {display.genres?.length ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {display.genres.slice(0, 8).map((g) => (
                <li
                  key={g}
                  className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] text-muted"
                >
                  {g}
                </li>
              ))}
            </ul>
          ) : null}

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">{description}</p>

          {infoError ? <p className="mt-4 text-sm text-accent">{infoError}</p> : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={!episode || episode <= (episodes[0]?.number ?? 1)}
                className="inline-flex h-11 items-center gap-1 rounded-full bg-surface-2 px-3 text-sm font-medium text-fg disabled:opacity-40"
              >{ (() => {
      const txt = JSON.stringify(s).toLowerCase();
      if (txt.includes("vidstream")) return "HydraX";
      if (txt.includes("2embed")) return "MyCloud";
      if (txt.includes("streamwish")) return "VidCloud";
      if (txt.includes("server 4") || txt.includes("vidmoly")) return "Vidmoly";
      if (txt.includes("ruby")) return "SRuby";
      if (txt.includes("neo")) return "NeoCDN";
      return s.name || s.id || "Server";
    })() }</button>
              <button
                type="button"
                onClick={goNext}
                disabled={!episode || episode >{ (() => {
      const txt = JSON.stringify(s).toLowerCase();
      if (txt.includes("vidstream")) return "HydraX";
      if (txt.includes("2embed")) return "MyCloud";
      if (txt.includes("streamwish")) return "VidCloud";
      if (txt.includes("server 4") || txt.includes("vidmoly")) return "Vidmoly";
      if (txt.includes("ruby")) return "SRuby";
      if (txt.includes("neo")) return "NeoCDN";
      return s.name || s.id || "Server";
    })() }</button>
            </div>
            <label className="inline-flex h-11 items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={autoNext}
                onChange={(e) => setAutoNext(e.target.checked)}
                className="size-4 accent-accent"
              />
              Auto-next episode
            </label>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-xs font-medium tracking-wide text-subtle uppercase">
              Episodes
              {info?.episodes?.length ? (
                <span className="ml-2 tabular-nums text-muted">{info.episodes.length}</span>
              ) : null}
            </p>
            {loadingInfo ? (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" />
                Fetching episode list…
              </div>
            ) : (
              <div className="grid max-h-56 grid-cols-5 gap-2 overflow-y-auto sm:grid-cols-8 md:grid-cols-10">
                {episodes.map((ep) => (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() =>{ (() => {
      const txt = JSON.stringify(s).toLowerCase();
      if (txt.includes("vidstream")) return "HydraX";
      if (txt.includes("2embed")) return "MyCloud";
      if (txt.includes("streamwish")) return "VidCloud";
      if (txt.includes("server 4") || txt.includes("vidmoly")) return "Vidmoly";
      if (txt.includes("ruby")) return "SRuby";
      if (txt.includes("neo")) return "NeoCDN";
      return s.name || s.id || "Server";
    })() }</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
