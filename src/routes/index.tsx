import { createFileRoute } from "@tanstack/react-router";
import { AniToonApp } from "@/components/anitoon-app";
import { getHomeCatalog } from "@/lib/anime.functions";

export const Route = createFileRoute("/")({
  loader: () => getHomeCatalog(),
  component: Home,
});

function Home() {
  const initialItems = Route.useLoaderData();
  return <AniToonApp initialItems={initialItems} />;
}
