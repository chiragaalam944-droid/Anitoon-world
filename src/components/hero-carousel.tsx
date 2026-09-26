import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { POSTER_FALLBACK, type AnimeCard } from "@/lib/anime";
import { cn } from "@/lib/utils";
import { LangBadges } from "./lang-badges";

export function HeroCarousel({
  items,
  kicker,
  onPlay,
  onDetails,
}: {
  items: AnimeCard[];
  kicker: string;
  onPlay: (anime: AnimeCard) => void;
  onDetails: (anime: AnimeCard) => void;
}) {
  const slides = items.slice(0, 6);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides[0]?.id]);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, [slides.length, slides[0]?.id]);

  const hero = slides[index] ?? slides[0];
  if (!hero) return null;

  return (
    <section className="relative isolate min-h-[420px] overflow-hidden sm:min-h-[560px]">
      {slides.map((slide, i) => (
        <img
          key={slide.id}
          src={slide.cover || slide.image || POSTER_FALLBACK}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
            i === index ? "opacity-100" : "opacity-0",
          )}
          onError={(e) => {
            e.currentTarget.src = POSTER_FALLBACK;
          }}
        />
      ))}
      <div className="hero-veil absolute inset-0" />
      <div className="relative mx-auto flex min-h-[420px] max-w-7xl flex-col justify-end px-4 py-10 sm:min-h-[560px] sm:px-6 sm:py-16">
        <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">{kicker}</p>
        <h1 className="mt-2 max-w-2xl font-display text-4xl leading-[1.05] sm:text-6xl">{hero.title}</h1>
        <div className="mt-3">
          <LangBadges badges={hero.languages} />
        </div>
        {hero.description ? (
          <p className="mt-4 max-w-xl line-clamp-3 text-sm leading-relaxed text-muted sm:text-base">
            {hero.description}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onPlay(hero)}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-fg transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
          >
            <Play className="ml-0.5 size-4 fill-current" />
            Watch Now
          </button>
          <button
            type="button"
            onClick={() => onDetails(hero)}
            className="glass inline-flex h-12 items-center rounded-full px-5 text-sm font-medium text-fg"
          >
            Details
          </button>
        </div>
        {slides.length > 1 ? (
          <div className="mt-8 flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous featured title"
              onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
              className="glass flex size-11 items-center justify-center rounded-full text-fg"
            >
              <ChevronLeft className="size-4" />
            </button>
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Show ${slide.title}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  i === index ? "w-8 bg-accent" : "w-3 bg-fg/30 hover:bg-fg/50",
                )}
              />
            ))}
            <button
              type="button"
              aria-label="Next featured title"
              onClick={() => setIndex((i) => (i + 1) % slides.length)}
              className="glass flex size-11 items-center justify-center rounded-full text-fg"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
