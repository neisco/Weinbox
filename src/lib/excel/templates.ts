import * as XLSX from "xlsx";
import type { Wine } from "@/types/wine";

export const templateHeaders = [
  "Weinname",
  "Produzent",
  "Jahrgang",
  "Weinart",
  "Land",
  "Region",
  "Flaschengrösse",
  "Anzahl Flaschen",
  "Traubensorten",
  "Kaufpreis CHF",
  "Kaufdatum",
  "Trinkreif ab",
  "Trinkreif bis",
  "Lagerort",
  "Regal",
  "Fach",
  "Reihe",
  "Favorit"
];

export function downloadWorkbook(filename: string, sheets: Record<string, Array<Record<string, unknown>>>) {
  const workbook = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => {
    const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [Object.fromEntries(templateHeaders.map((header) => [header, ""]))]);
    XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31));
  });
  XLSX.writeFile(workbook, filename);
}

export function downloadTemplate() {
  downloadWorkbook("weinbox-import-vorlage.xlsx", {
    Vorlage: [
      {
        Weinname: "Château Beispiel",
        Produzent: "Weingut Muster",
        Jahrgang: 2018,
        Weinart: "Rotwein",
        Land: "Schweiz",
        Region: "Wallis",
        Flaschengrösse: 0.75,
        "Anzahl Flaschen": 6,
        Traubensorten: "Pinot Noir",
        "Kaufpreis CHF": 32,
        Kaufdatum: "2025-10-12",
        "Trinkreif ab": "2026-01-01",
        "Trinkreif bis": "2032-12-31",
        Lagerort: "Keller",
        Regal: "A",
        Fach: "2",
        Reihe: "Links",
        Favorit: "Nein"
      }
    ]
  });
}

export function parseWineImport(file: File) {
  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet).map((row) => ({
      name: String(row.Weinname ?? "").trim(),
      producer: String(row.Produzent ?? "").trim(),
      vintage: Number(row.Jahrgang),
      type: String(row.Weinart ?? "Rotwein"),
      country: String(row.Land ?? "").trim(),
      region: String(row.Region ?? "").trim(),
      bottleSize: Number(row.Flaschengrösse ?? 0.75),
      currentBottles: Number(row["Anzahl Flaschen"] ?? 1),
      originalBottles: Number(row["Anzahl Flaschen"] ?? 1),
      consumedBottles: 0,
      grapes: String(row.Traubensorten ?? ""),
      purchasePrice: row["Kaufpreis CHF"] ? Number(row["Kaufpreis CHF"]) : null,
      purchaseDate: String(row.Kaufdatum ?? ""),
      drinkFrom: String(row["Trinkreif ab"] ?? ""),
      drinkUntil: String(row["Trinkreif bis"] ?? ""),
      storageLocation: String(row.Lagerort ?? ""),
      shelf: String(row.Regal ?? ""),
      compartment: String(row.Fach ?? ""),
      row: String(row.Reihe ?? ""),
      favorite: String(row.Favorit ?? "").toLowerCase().startsWith("j")
    }));
  });
}

export function exportWines(wines: Wine[]) {
  downloadWorkbook("weinbox-export.xlsx", {
    Bestand: wines.map((wine) => ({
      Weinname: wine.name,
      Produzent: wine.producer,
      Jahrgang: wine.vintage,
      Weinart: wine.type,
      Land: wine.country,
      Region: wine.region,
      Bestand: wine.currentBottles,
      Gekauft: wine.originalBottles,
      Getrunken: wine.consumedBottles,
      Kaufwert: (wine.purchasePrice ?? 0) * wine.originalBottles,
      Marktwert: (wine.marketValue ?? 0) * wine.currentBottles,
      Status: wine.status
    }))
  });
}
