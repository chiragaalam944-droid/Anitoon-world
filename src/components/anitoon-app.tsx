import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Clapperboard, Play, Search, Trash2, X } from "lucide-react";
import { consumeAdReturn, takeAdResume } from "@/lib/ad";
import {
  CATEGORIES,
  clearWatchHistory,
  fetchCatalog,
  fetchSearch,
  getContinueWatching,
  getMyList,
  getWatchHistory,
  POSTER_FALLBACK,
  type AnimeCard,
  type CatalogKind,
  type WatchEntry,
} from "@/lib/anime";
import { cn } from "@/lib/utils";
import { HeroCarousel } from "./hero-carousel";
import { PlayerModal } from "./player-modal";
import { PosterCard } from "./poster-card";

type ActiveCategory = (typeof CATEGORIES)[number];

function entryToCard(entry: WatchEntry): AnimeCard {
  return {
    id: entry.id,
    malId: entry.malId,
    title: entry.title,
    image: entry.image,
  };
}

function Shelf({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="pt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl">{title}</h2>
        {action}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">{children}</div>
    </section>
  );
}

function Thumb({
  entry,
  onOpen,
  caption,
}: {
  entry: WatchEntry;
  onOpen: (anime: AnimeCard, episode?: number) => void;
  caption?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(entryToCard(entry), entry.episode)}
      className="w-[140px] shrink-0 text-left sm:w-[160px]"
    >
      <span className="relative block aspect-poster overflow-hidden rounded-md bg-surface shadow-border">
        <img
          src={entry.image || POSTER_FALLBACK}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = POSTER_FALLBACK;
          }}
        />
        {caption ? (
          <span className="absolute inset-x-0 bottom-0 bg-bg/80 px-2 py-1.5 text-[11px] text-muted">
            {caption}
          </span>
        ) : null}
      </span>
      <span className="mt-2 line-clamp-2 text-sm font-medium">{entry.title}</span>
    </button>
  );
}

export function AniToonApp({ initialItems = [] }: { initialItems?: AnimeCard[] }) {
  const [category, setCategory] = useState<ActiveCategory>(CATEGORIES[0]);
  const [items, setItems] = useState<AnimeCard[]>(initialItems);
  const [loading, setLoading] = useState(!initialItems.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState<AnimeCard | null>(null);
  const [startEpisode, setStartEpisode] = useState<number | undefined>();
  const [continueWatching, setContinueWatching] = useState<WatchEntry[]>([]);
  const [history, setHistory] = useState<WatchEntry[]>([]);
  const [myList, setMyList] = useState<WatchEntry[]>([]);
  const [showList, setShowList] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);
  const skipFirst = useRef(initialItems.length > 0);

  const refreshLocal = useCallback(() => {
    setContinueWatching(getContinueWatching());
    setHistory(getWatchHistory());
    setMyList(getMyList());
  }, []);

  useEffect(() => {
    const verified = consumeAdReturn();
    refreshLocal();
    if (!verified) return;
    const resume = takeAdResume();
    if (!resume) return;
    setActive({
      id: resume.id,
      malId: resume.malId,
      title: resume.title,
      image: resume.image,
    });
    setStartEpisode(resume.episode);
  }, [refreshLocal]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const loadCategory = useCallback(async (cat: ActiveCategory, nextPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCatalog(cat.kind as CatalogKind, cat.genre, nextPage);
      setItems(data.results);
      setHasNextPage(data.hasNextPage && data.results.length > 0);
      setPage(nextPage);
      if (!data.results.length) {
        setError("Nothing in this shelf yet. Try another filter.");
      }
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Could not load the catalog.");
      setHasNextPage(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (query.trim().length >= 2) return;
    if (skipFirst.current && category.id === "trending") {
      skipFirst.current = false;
      setHasNextPage(true);
      setPage(1);
      return;
    }
    void loadCategory(category, 1);
  }, [category, loadCategory, query]);

  const runSearch = useCallback(async (q: string, nextPage = 1) => {
    setLoading(true);
    setError(null);
    setShowList(false);
    try {
      const data = await fetchSearch(q, nextPage);
      setItems(data.results);
      setHasNextPage(data.hasNextPage && data.results.length > 0);
      setPage(nextPage);
      if (!data.results.length) setError(`No titles match “${q}”.`);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Search failed.");
      setHasNextPage(false);
    } finally {
      setLoading(false);
      setSearching(false);
      setLoadingMore(false);
    }
  }, []);

  function onSearchChange(value: string) {
    setQuery(value);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = window.setTimeout(() => {
      void runSearch(value.trim(), 1);
    }, 400);
  }

  const goPage = useCallback(
    (next: number) => {
      if (next < 1 || loading || loadingMore) return;
      const q = query.trim();
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (q.length >= 2) {
        void runSearch(q, next);
        return;
      }
      void loadCategory(category, next);
    },
    [loading, loadingMore, query, category, loadCategory, runSearch],
  );

  const heroSlides = useMemo(() => items.slice(0, 6), [items]);
  const heading =
    query.trim().length >= 2
      ? `Results for “${query.trim()}”`
      : showList
        ? "Watchlist"
        : category.label;

  const gridItems = showList ? myList.map(entryToCard) : items;
  const browsing = query.trim().length < 2 && !showList;

  function openAnime(anime: AnimeCard, episode?: number) {
    setActive(anime);
    setStartEpisode(episode);
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="glass sticky top-0 z-40 border-b border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:h-18 sm:flex-row sm:items-center sm:gap-3 sm:px-6 sm:py-0">
          <div className="flex items-center gap-3">
            <a href="/" className="flex shrink-0 items-center gap-2" aria-label="AniToon World home">
              <span className="flex size-8 items-center justify-center rounded-sm bg-accent text-accent-fg">
                <Play className="ml-0.5 size-3.5 fill-current" />
              </span>
              <span className="leading-none">
                <span className="block font-display text-lg tracking-tight sm:text-xl">
                  AniToon World
                </span>
                <span className="hidden text-[10px] tracking-wide text-muted uppercase sm:block">
                  Anime & cartoon hub
                </span>
              </span>
            </a>
            <div className="ml-auto sm:hidden">
              <button
                type="button"
                onClick={() => {
                  setShowList((v) => !v);
                  setQuery("");
                }}
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-full text-sm font-medium",
                  showList ? "bg-fg text-bg" : "text-muted hover:text-fg",
                )}
                aria-label="Watchlist"
              >
                <Bookmark className="size-4" />
              </button>
            </div>
          </div>

          <label className="relative min-w-0 flex-1 sm:mx-auto sm:max-w-xl">
            <span className="sr-only">Search anime and cartoons</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Solo Leveling, Naruto, Jujutsu Kaisen…"
              className="h-11 w-full rounded-full bg-surface-2 pr-10 pl-10 text-sm text-fg shadow-border placeholder:text-subtle focus:shadow-border-hover focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-fg"
                onClick={() => {
                  setQuery("");
                  setSearching(false);
                }}
              >
                <X className="size-4" />
              </button>
            ) : null}
          </label>

          <button
            type="button"
            onClick={() => {
              setShowList((v) => !v);
              setQuery("");
            }}
            className={cn(
              "hidden h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium sm:inline-flex",
              showList ? "bg-fg text-bg" : "text-muted hover:text-fg",
            )}
          >
            <Bookmark className="size-4" />
            Watchlist
          </button>
        </div>
      </header>

      {heroSlides.length > 0 && browsing ? (
        <HeroCarousel
          items={heroSlides}
          kicker={`AniToon World · ${category.id === "cartoons" ? "Kids & cartoons" : category.id === "hindi" ? "Hindi dubbed" : "Trending now"}`}
          onPlay={(anime) => openAnime(anime, 1)}
          onDetails={(anime) => openAnime(anime)}
        />
      ) : null}

      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        {continueWatching.length > 0 && browsing ? (
          <Shelf title="Continue watching">
            {continueWatching.map((entry) => (
              <Thumb
                key={`cw-${entry.id}`}
                entry={entry}
                onOpen={openAnime}
                caption={`Ep ${entry.episode}`}
              />
            ))}
          </Shelf>
        ) : null}

        {history.length > 0 && browsing ? (
          <Shelf
            title="Watch history"
            action={
              <button
                type="button"
                onClick={() => {
                  clearWatchHistory();
                  refreshLocal();
                }}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-surface-2 px-3 text-sm font-medium text-muted hover:text-fg"
              >
                <Trash2 className="size-4" />
                Clear history
              </button>
            }
          >
            {history.map((entry) => (
              <Thumb
                key={`h-${entry.id}-${entry.episode}-${entry.updatedAt}`}
                entry={entry}
                onOpen={openAnime}
                caption={`Ep ${entry.episode}`}
              />
            ))}
          </Shelf>
        ) : null}

        {myList.length > 0 && browsing ? (
          <Shelf title="Watchlist">
            {myList.map((entry) => (
              <Thumb key={`wl-${entry.id}`} entry={entry} onOpen={openAnime} />
            ))}
          </Shelf>
        ) : null}

        {browsing ? (
          <nav
            className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
            aria-label="Categories"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  "h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors duration-150",
                  category.id === cat.id
                    ? "bg-fg text-bg"
                    : "bg-surface-2 text-muted hover:text-fg",
                )}
              >
                {cat.label}
              </button>
            ))}
          </nav>
        ) : null}

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl sm:text-3xl">{heading}</h2>
            {searching || loading ? (
              <span className="atw-spinner" aria-label="Loading" />
            ) : (
              <Clapperboard className="size-5 text-subtle" aria-hidden />
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="atw-skeleton aspect-poster rounded-md" />
              ))}
            </div>
          ) : error && !gridItems.length ? (
            <div className="rounded-xl bg-surface px-5 py-12 text-center shadow-border">
              <p className="text-sm text-muted">{error}</p>
            </div>
          ) : showList && !gridItems.length ? (
            <div className="rounded-xl bg-surface px-5 py-12 text-center shadow-border">
              <p className="text-sm text-muted">
                Your watchlist is empty. Bookmark a title to save it for later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {gridItems.map((anime, i) => (
                <PosterCard
                  key={`${anime.id}-${i}`}
                  anime={anime}
                  onOpen={openAnime}
                  onListChange={refreshLocal}
                  index={i}
                />
              ))}
            </div>
          )}

          {!showList && !loading && gridItems.length > 0 ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => goPage(page - 1)}
                className="glass inline-flex h-11 items-center gap-1 rounded-full px-3 text-sm font-medium text-fg disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
                Prev
              </button>
              {Array.from({ length: hasNextPage ? page + 1 : page }, (_, i) => i + 1)
                .filter((n) => n >= Math.max(1, page - 2))
                .map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => goPage(n)}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full text-sm font-medium",
                      n === page ? "bg-fg text-bg" : "glass text-fg hover:text-fg",
                    )}
                  >
                    {n}
                  </button>
                ))}
              <button
                type="button"
                disabled={!hasNextPage || loading}
                onClick={() => goPage(page + 1)}
                className="glass inline-flex h-11 items-center gap-1 rounded-full px-3 text-sm font-medium text-fg disabled:opacity-40"
              >
                Next
                <ChevronRight className="size-4" />
              </button>
            </div>
          ) : null}
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-subtle">
        AniToon World · Your Ultimate Anime & Cartoon Hub
      </footer>

      {active ? (
        <PlayerModal
          anime={active}
          startEpisode={startEpisode}
          onClose={() => {
            setActive(null);
            setStartEpisode(undefined);
            refreshLocal();
          }}
          onListChange={refreshLocal}
        />
      ) : null}
    </div>
  );
}
