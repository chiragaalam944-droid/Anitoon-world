import { Bookmark, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  POSTER_FALLBACK,
  isInMyList,
  toggleMyList,
  type AnimeCard,
} from "@/lib/anime";

interface PosterCardProps {
  anime: AnimeCard;
  onOpen: (anime: AnimeCard, episode?: number) => void;
  onListChange?: () => void;
  index?: number;
}

export function PosterCard({
  anime,
  onOpen,
  onListChange,
}: PosterCardProps) {
  const saved = isInMyList(anime.id);

  const handleCardClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpen(anime, 1);
  };

  const handleBookmarkClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMyList(anime);
    if (onListChange) onListChange();
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative cursor-pointer overflow-hidden rounded-lg bg-surface shadow-border transition-all duration-200 active:scale-95 touch-manipulation"
    >
      <div className="relative aspect-poster w-full overflow-hidden bg-surface-2">
        <img
          src={anime.image || POSTER_FALLBACK}
          alt={anime.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = POSTER_FALLBACK;
          }}
        />

        {/* Overlay Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex size-12 items-center justify-center rounded-full bg-brand text-brand-fg shadow-lg">
            <Play className="ml-0.5 size-6 fill-current" />
          </div>
        </div>

        {/* Language Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            SUB / DUB
          </span>
          {anime.isHindi ? (
            <span className="rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-brand-fg shadow">
              HINDI
            </span>
          ) : null}
        </div>

        {/* Bookmark Button */}
        <button
          type="button"
          onClick={handleBookmarkClick}
          className={cn(
            "absolute top-2 right-2 flex size-8 items-center justify-center rounded-full backdrop-blur-md transition-colors",
            saved
              ? "bg-brand text-brand-fg"
              : "bg-black/60 text-white hover:bg-black/80"
          )}
          aria-label="Bookmark"
        >
          <Bookmark className="size-4 fill-current" />
        </button>

        {/* Bottom Title Gradient */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-6">
          <p className="line-clamp-2 text-xs font-semibold text-white drop-shadow">
            {anime.title}
          </p>
        </div>
      </div>
    </div>
  );
}
