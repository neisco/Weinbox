import type { Wine } from "@/types/wine";

export type MarketSnapshot = {
  provider: "wine-searcher" | "manual";
  checkedAt: string;
  marketValue?: number;
  drinkFrom?: string;
  drinkUntil?: string;
  labelUrl?: string;
  notes: string;
};

export interface WineDataProvider {
  match(wine: Wine): Promise<MarketSnapshot>;
}

export class ManualWineSearcherProvider implements WineDataProvider {
  async match(wine: Wine): Promise<MarketSnapshot> {
    const query = encodeURIComponent(`${wine.producer} ${wine.name} ${wine.vintage}`);
    return {
      provider: "wine-searcher",
      checkedAt: new Date().toISOString(),
      notes: `Manueller, API-schonender Abgleich vorbereitet: https://www.wine-searcher.com/find/${query}`
    };
  }
}

export const wineDataProvider = new ManualWineSearcherProvider();
