import { useEffect, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Bookmark, BookmarkCheck, Play } from "lucide-react";
import { isInMyList, POSTER_FALLBACK, toggleMyList, type AnimeCard } from "@/lib/anime";
import { cn } from "@/lib/utils";
import { LangBadges } from "./lang-badges";

type PosterCardProps = {
  anime: AnimeCard;
  onOpen: (anime: AnimeCard) => void;
  onListChange?: () => void;
  index?: number;
};

export function PosterCard({ anime, onOpen, onListChange, index = 0 }: PosterCardProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isInMyList(anime.id));
  }, [anime.id]);

  function onBookmark(e: MouseEvent | KeyboardEvent) {
    e.stopPropagation();
    e.preventDefault();
    toggleMyList({
      id: anime.id,
      malId: anime.malId,
      title: anime.title,
      image: anime.image,
    });
    setSaved(isInMyList(anime.id));
    onListChange?.();
  }

  return (
    <div
      className={cn(
        "group atw-rise relative aspect-poster w-full overflow-hidden rounded-md bg-surface text-left",
        "shadow-border transition-[transform,box-shadow] duration-200 ease-smooth-out",
        "hover:z-10 hover:scale-[1.04] hover:shadow-neon",
        "focus-within:shadow-neon",
      )}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <button
        type="button"
        onClick={() => onOpen(anime)}
        className="absolute inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
      >
        <img
          src={anime.image || POSTER_FALLBACK}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-200 ease-smooth-out group-hover:scale-[1.04]"
          onError={(e) => {
            e.currentTarget.src = POSTER_FALLBACK;
          }}
        />
        <span className="pointer-events-none absolute inset-0 poster-veil opacity-90" />
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-250 group-hover:opacity-100">
          <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg">
            <Play className="ml-0.5 size-5 fill-current" />
          </span>
        </span>
        {anime.rating ? (
          <span className="absolute top-2 right-2 rounded-full bg-bg/80 px-2 py-0.5 text-[11px] font-medium tabular-nums text-fg backdrop-blur-sm">
            {anime.rating > 10 ? (anime.rating / 10).toFixed(1) : anime.rating}
          </span>
        ) : null}
        <span className="absolute inset-x-0 bottom-0 p-2.5 text-left">
          <LangBadges badges={anime.languages} compact />
          <span className="mt-1.5 line-clamp-2 block font-medium text-sm leading-snug text-fg">
            {anime.title}
          </span>
          {anime.releaseDate ? (
            <span className="mt-0.5 block text-[11px] text-muted">{anime.releaseDate}</span>
          ) : null}
        </span>
      </button>
      <button
        type="button"
        aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
        onClick={onBookmark}
        className="absolute top-2 left-2 z-10 flex size-11 items-center justify-center rounded-full bg-bg/80 text-fg backdrop-blur-sm hover:bg-bg"
      >
        {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
      </button>
    </div>
  );
}
