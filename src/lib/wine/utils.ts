import { Wine, WineFilters } from "@/types/wine";

export function duplicateKey(input: Pick<Wine, "name" | "producer" | "vintage" | "bottleSize">) {
  return [input.name, input.producer, input.vintage, input.bottleSize]
    .map((value) => String(value).trim().toLowerCase())
    .join("|");
}

export function createSearchIndex(parts: Array<string | number | undefined>) {
  const text = parts.filter(Boolean).join(" ").toLowerCase();
  const tokens = new Set<string>();
  text.split(/[^a-zäöüéèà0-9]+/i).filter(Boolean).forEach((word) => {
    for (let i = 1; i <= word.length; i += 1) tokens.add(word.slice(0, i));
    tokens.add(word);
  });
  return Array.from(tokens).slice(0, 200);
}

export function isDrinkReady(wine: Wine, today = new Date()) {
  const current = today.toISOString().slice(0, 10);
  return (!wine.drinkFrom || wine.drinkFrom <= current) && (!wine.drinkUntil || wine.drinkUntil >= current);
}

export function applyWineFilters(wines: Wine[], filters: WineFilters) {
  const q = filters.query.trim().toLowerCase();
  return wines.filter((wine) => {
    if (wine.status === "deleted") return false;
    if (filters.type && wine.type !== filters.type) return false;
    if (filters.country && wine.country !== filters.country) return false;
    if (filters.region && wine.region !== filters.region) return false;
    if (filters.vintage && String(wine.vintage) !== filters.vintage) return false;
    if (filters.favoritesOnly && !wine.favorite) return false;
    if (filters.inStockOnly && wine.currentBottles <= 0) return false;
    if (filters.storageLocation && wine.storageLocation !== filters.storageLocation) return false;
    if (filters.drinkReadyOnly && !isDrinkReady(wine)) return false;
    if (!q) return true;
    return [wine.name, wine.producer, wine.country, wine.region, wine.grapes, wine.storageLocation]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
}

export function currency(value: number | undefined) {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(value ?? 0);
}
