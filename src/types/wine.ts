import { z } from "zod";

export const wineTypes = [
  "Rotwein",
  "Weisswein",
  "Rosé",
  "Schaumwein",
  "Dessertwein",
  "Portwein / Likörwein",
  "Orange Wine",
  "Sonstige"
] as const;

export const bottleSizes = [0.375, 0.75, 1.5, 3.0, 6.0] as const;

export const drinkLocations = ["Restaurant", "Freunde", "Degustation", "Ferien", "Zuhause", "Freitext"] as const;

export const wineSchema = z.object({
  id: z.string().optional(),
  ownerId: z.string(),
  name: z.string().min(1),
  producer: z.string().min(1),
  vintage: z.coerce.number().int().min(1800).max(2100),
  type: z.enum(wineTypes),
  country: z.string().min(1),
  region: z.string().min(1),
  bottleSize: z.coerce.number(),
  currentBottles: z.coerce.number().int().min(0),
  originalBottles: z.coerce.number().int().min(0),
  consumedBottles: z.coerce.number().int().min(0).default(0),
  grapes: z.string().optional(),
  grapeShares: z.string().optional(),
  purchasePrice: z.coerce.number().nonnegative().nullable().optional(),
  purchaseDate: z.string().optional(),
  purchasePlace: z.string().optional(),
  comment: z.string().optional(),
  drinkFrom: z.string().optional(),
  drinkUntil: z.string().optional(),
  marketValue: z.coerce.number().nonnegative().nullable().optional(),
  lastMarketSync: z.string().optional(),
  imageUrl: z.string().optional(),
  storageLocation: z.string().optional(),
  shelf: z.string().optional(),
  compartment: z.string().optional(),
  row: z.string().optional(),
  favorite: z.boolean().default(false),
  status: z.enum(["active", "empty", "deleted"]).default("active"),
  deletedAt: z.string().optional(),
  searchIndex: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Wine = z.infer<typeof wineSchema>;

export type DrinkEvent = {
  id?: string;
  ownerId: string;
  wineId?: string;
  wineName: string;
  producer?: string;
  vintage?: number;
  wineType?: (typeof wineTypes)[number];
  country?: string;
  region?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  consumedAt: string;
  location?: string;
  source: "cellar" | "external";
  createdAt: string;
};

export type WineFilters = {
  query: string;
  type: string;
  country: string;
  region: string;
  vintage: string;
  favoritesOnly: boolean;
  drinkReadyOnly: boolean;
  inStockOnly: boolean;
  storageLocation: string;
};

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: "admin" | "user";
  disabled: boolean;
  onboarded: boolean;
  createdAt: string;
};
