import { createServerFn } from "@tanstack/react-start";
import { loadCatalog } from "./consumet.server";
import type { AnimeCard } from "./anime";

export const getHomeCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<AnimeCard[]> => {
    try {
      const payload = await loadCatalog({ kind: "trending", page: 1 });
      return payload.results;
    } catch {
      return [];
    }
  },
);
