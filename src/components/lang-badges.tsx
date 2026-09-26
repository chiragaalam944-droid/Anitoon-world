import type { LangBadge } from "@/lib/anime";
import { cn } from "@/lib/utils";

export function LangBadges({
  badges,
  compact = false,
}: {
  badges?: LangBadge[];
  compact?: boolean;
}) {
  if (!badges?.length) return null;
  const shown = compact ? badges.slice(0, 4) : badges;
  return (
    <ul className="flex flex-wrap gap-1">
      {shown.map((badge) => (
        <li
          key={badge}
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase",
            badge === "Hindi" || badge === "DUB"
              ? "bg-accent text-accent-fg"
              : badge === "SUB"
                ? "bg-fg text-bg"
                : "bg-bg/75 text-fg backdrop-blur-sm",
          )}
        >
          {badge}
        </li>
      ))}
    </ul>
  );
}
