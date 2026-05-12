"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArchiveRestore,
  BarChart3,
  Download,
  FileJson,
  Grape,
  Heart,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Wine as WineIcon
} from "lucide-react";
import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  addExternalDrink,
  consumeBottle,
  fetchDrinkEvents,
  fetchWines,
  restoreWine,
  softDeleteWine,
  upsertWine
} from "@/lib/firebase/wine-service";
import { loginWithGoogle, logout, useAuthUser } from "@/lib/firebase/auth";
import { downloadTemplate, exportWines, parseWineImport } from "@/lib/excel/templates";
import { applyWineFilters, currency, isDrinkReady } from "@/lib/wine/utils";
import { DrinkEvent, UserProfile, Wine, WineFilters, bottleSizes, wineTypes } from "@/types/wine";
import { createInvitation, deleteUserProfile, fetchUsers, setUserDisabled } from "@/lib/firebase/admin-service";

const emptyFilters: WineFilters = {
  query: "",
  type: "",
  country: "",
  region: "",
  vintage: "",
  favoritesOnly: false,
  drinkReadyOnly: false,
  inStockOnly: false,
  storageLocation: ""
};

const initialWine = {
  name: "",
  producer: "",
  vintage: new Date().getFullYear(),
  type: "Rotwein" as (typeof wineTypes)[number],
  country: "Schweiz",
  region: "",
  bottleSize: 0.75,
  currentBottles: 1,
  originalBottles: 1,
  consumedBottles: 0,
  grapes: "",
  grapeShares: "",
  purchasePrice: undefined as number | undefined,
  purchaseDate: "",
  purchasePlace: "",
  comment: "",
  drinkFrom: "",
  drinkUntil: "",
  marketValue: undefined as number | undefined,
  lastMarketSync: "",
  imageUrl: "",
  storageLocation: "",
  shelf: "",
  compartment: "",
  row: "",
  favorite: false
};

type WineFormState = typeof initialWine;
type WineFormPayload = WineFormState & { id?: string };

export default function Home() {
  const { user, profile, loading, error: authError, isConfigured } = useAuthUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"dashboard" | "cellar" | "history" | "import" | "admin" | "privacy">("dashboard");
  const [filters, setFilters] = useState(emptyFilters);
  const [wineForm, setWineForm] = useState<WineFormState>(initialWine);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [editingWineId, setEditingWineId] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<WineFormState[]>([]);
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [actionError, setActionError] = useState<string | null>(null);

  const winesQuery = useQuery({ queryKey: ["wines", user?.uid], queryFn: () => fetchWines(user!.uid), enabled: Boolean(user) });
  const drinksQuery = useQuery({ queryKey: ["drinkEvents", user?.uid], queryFn: () => fetchDrinkEvents(user!.uid), enabled: Boolean(user) });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["wines", user?.uid] });
    void queryClient.invalidateQueries({ queryKey: ["drinkEvents", user?.uid] });
  };

  const startEditWine = (wine: Wine) => {
    setWineForm({
      name: wine.name,
      producer: wine.producer,
      vintage: wine.vintage,
      type: wine.type,
      country: wine.country,
      region: wine.region,
      bottleSize: wine.bottleSize,
      currentBottles: wine.currentBottles,
      originalBottles: wine.originalBottles,
      consumedBottles: wine.consumedBottles,
      grapes: wine.grapes ?? "",
      grapeShares: wine.grapeShares ?? "",
      purchasePrice: wine.purchasePrice ?? undefined,
      purchaseDate: wine.purchaseDate ?? "",
      purchasePlace: wine.purchasePlace ?? "",
      comment: wine.comment ?? "",
      drinkFrom: wine.drinkFrom ?? "",
      drinkUntil: wine.drinkUntil ?? "",
      marketValue: wine.marketValue ?? undefined,
      lastMarketSync: wine.lastMarketSync ?? "",
      imageUrl: wine.imageUrl ?? "",
      storageLocation: wine.storageLocation ?? "",
      shelf: wine.shelf ?? "",
      compartment: wine.compartment ?? "",
      row: wine.row ?? "",
      favorite: wine.favorite ?? false
    });
    setEditingWineId(wine.id ?? null);
    setActionError(null);
    setSelectedWine(null);
    setActiveTab("cellar");
  };

  const saveWine = useMutation({
    mutationFn: (wine: WineFormPayload) => upsertWine(user!.uid, wine),
    onSuccess: () => {
      setWineForm(initialWine);
      setEditingWineId(null);
      setActionError(null);
      invalidate();
    },
    onError: (error) => setActionError(error instanceof Error ? error.message : "Der Wein konnte nicht gespeichert werden.")
  });

  const consume = useMutation({
    mutationFn: (payload: { wine: Wine; event: Omit<DrinkEvent, "ownerId" | "wineId" | "source" | "createdAt"> }) =>
      consumeBottle(user!.uid, payload.wine, payload.event),
    onSuccess: () => {
      setSelectedWine(null);
      setActionError(null);
      invalidate();
    },
    onError: (error) => setActionError(error instanceof Error ? error.message : "Die Flasche konnte nicht ausgetrunken werden.")
  });

  const wines = winesQuery.data ?? [];
  const drinks = drinksQuery.data ?? [];
  const visibleWines = useMemo(() => applyWineFilters(wines, filters), [wines, filters]);
  const stats = useMemo(() => buildStats(wines, drinks), [wines, drinks]);

  if (loading) return <Shell><p className="text-neutral-600">Weinbox wird vorbereitet…</p></Shell>;
  if (!isConfigured) return <SetupMissingScreen />;
  if (!user || !profile) return <LoginScreen error={authError} />;
  if (profile.disabled) return <Shell><p>Dein Zugang ist deaktiviert. Bitte kontaktiere den Admin.</p></Shell>;

  return (
    <Shell>
      <header className="flex flex-col gap-5 rounded-[2rem] bg-neutral-950 p-5 text-white shadow-2xl md:flex-row md:items-center md:justify-between md:p-7">
        <div>
          <Logo />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-white/10 px-4 py-2">{profile.displayName ?? profile.email}</span>
          <button className="focus-ring rounded-full bg-white px-4 py-2 font-semibold text-neutral-950" onClick={() => void logout()}><LogOut className="mr-2 inline size-4" />Logout</button>
        </div>
      </header>

      {authError && <Alert message={authError} />}
      {actionError && <Alert message={actionError} />}
      {!profile.onboarded && <Onboarding onStart={() => setActiveTab("cellar")} />}

      <nav className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {[
          ["dashboard", "Dashboard", BarChart3],
          ["cellar", "Keller", WineIcon],
          ["history", "Trinkhistorie", Grape],
          ["import", "Import/Export", Upload],
          ["privacy", "Datenschutz", ShieldCheck],
          ...(profile.role === "admin" ? [["admin", "Admin", ShieldCheck]] as const : [])
        ].map(([key, label, Icon]) => (
          <button key={String(key)} className={`focus-ring rounded-2xl px-4 py-3 text-sm font-semibold transition ${activeTab === key ? "bg-wine text-white" : "bg-white text-neutral-700 shadow-sm hover:bg-neutral-50"}`} onClick={() => setActiveTab(key as typeof activeTab)}>
            <Icon className="mr-2 inline size-4" />{String(label)}
          </button>
        ))}
      </nav>

      {activeTab === "dashboard" && <Dashboard stats={stats} wines={wines} />}
      {activeTab === "cellar" && (
        <Cellar
          filters={filters}
          onFilters={setFilters}
          wineForm={wineForm}
          setWineForm={setWineForm}
          editing={Boolean(editingWineId)}
          saveWine={(event) => { event.preventDefault(); saveWine.mutate({ ...wineForm, id: editingWineId ?? undefined }); }}
          saving={saveWine.isPending}
          wines={visibleWines}
          allWines={wines}
          selectWine={setSelectedWine}
          deleteWine={(id) => {
            if (window.confirm("Möchtest du diesen Wein wirklich in den Papierkorb verschieben?")) {
              void softDeleteWine(user.uid, id).then(invalidate).catch((error: unknown) => setActionError(error instanceof Error ? error.message : "Der Wein konnte nicht gelöscht werden."));
            }
          }}
          restoreWine={(id) => void restoreWine(user.uid, id).then(invalidate)}
        />
      )}
      {activeTab === "history" && <History drinks={drinks} addExternal={(event) => void addExternalDrink(user.uid, event).then(invalidate).catch((error: unknown) => setActionError(error instanceof Error ? error.message : "Der auswärts getrunkene Wein konnte nicht gespeichert werden."))} />}
      {activeTab === "import" && (
        <ImportExport
          wines={wines}
          preview={importPreview}
          setPreview={setImportPreview}
          importAll={() => Promise.all(importPreview.map((item) => upsertWine(user.uid, item))).then(() => { setImportPreview([]); invalidate(); })}
        />
      )}
      {activeTab === "admin" && profile.role === "admin" && <AdminPanel />}
      {activeTab === "privacy" && <Privacy />}

      {selectedWine && (
        <DrinkModal
          wine={selectedWine}
          rating={rating}
          setRating={setRating}
          onClose={() => setSelectedWine(null)}
          onEdit={() => startEditWine(selectedWine)}
          onConsume={(comment, location, consumedAt) => consume.mutate({
            wine: selectedWine,
            event: {
              wineName: selectedWine.name,
              producer: selectedWine.producer,
              vintage: selectedWine.vintage,
              wineType: selectedWine.type,
              country: selectedWine.country,
              region: selectedWine.region,
              rating,
              comment,
              location,
              consumedAt
            }
          })}
        />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 md:px-8 md:py-8">{children}</main>;
}

function Alert({ message }: { message: string }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">{message}</div>;
}

function SetupMissingScreen() {
  return (
    <Shell>
      <section className="glass-card grid min-h-[70vh] place-items-center rounded-[2.5rem] p-8 text-center">
        <div className="max-w-2xl">
          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-wine text-white"><ShieldCheck /></div>
          <h1 className="text-4xl font-black tracking-tight text-neutral-950">Firebase-Konfiguration fehlt</h1>
          <p className="mt-5 text-neutral-600">Lege eine <code className="rounded bg-neutral-100 px-2 py-1">.env.local</code> an und fülle die Werte aus <code className="rounded bg-neutral-100 px-2 py-1">.env.example</code>. Danach kannst du Weinbox lokal starten und deployen.</p>
        </div>
      </section>
    </Shell>
  );
}

function Logo() {
  return <div className="text-4xl font-black tracking-tight"><span className="text-white">Wein</span><span className="text-wine">box</span></div>;
}

function LoginScreen({ error }: { error?: string | null }) {
  const [loginError, setLoginError] = useState<string | null>(null);
  const visibleError = loginError ?? error;
  return (
    <Shell>
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card grid min-h-[78vh] place-items-center rounded-[2.5rem] p-8 text-center">
        <div className="max-w-xl">
          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-wine text-white"><WineIcon /></div>
          <h1 className="text-5xl font-black tracking-tight text-neutral-950">Weinbox</h1>
          <p className="mt-5 text-lg text-neutral-600">Dein eleganter, offlinefähiger und privater Weinkeller – mit Google Login, Firestore-Sync und Excel-Import.</p>
          {visibleError && <Alert message={visibleError} />}
          <button className="focus-ring mt-8 rounded-full bg-wine px-7 py-3 font-bold text-white shadow-xl transition hover:bg-wine-dark" onClick={() => void loginWithGoogle().catch((loginFailure: unknown) => setLoginError(loginFailure instanceof Error ? loginFailure.message : "Die Google-Anmeldung konnte nicht gestartet werden."))}>
            Mit Google anmelden
          </button>
        </div>
      </motion.section>
    </Shell>
  );
}

function Onboarding({ onStart }: { onStart: () => void }) {
  return (
    <section className="glass-card rounded-[2rem] p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-wine">Erster Start</p>
      <h2 className="mt-2 text-2xl font-bold">Schön, dass du da bist.</h2>
      <p className="mt-2 text-neutral-600">Lade die Beispiel-Excel herunter oder füge direkt deinen ersten Wein hinzu. Du kannst später alles exportieren.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button className="rounded-full bg-neutral-950 px-5 py-2 text-white" onClick={onStart}>Ersten Wein hinzufügen</button>
        <button className="rounded-full bg-white px-5 py-2 shadow" onClick={downloadTemplate}>Beispiel-Excel laden</button>
      </div>
    </section>
  );
}

function Dashboard({ stats, wines }: { stats: ReturnType<typeof buildStats>; wines: Wine[] }) {
  return (
    <section className="grid gap-4 lg:grid-cols-4">
      <Stat label="Flaschen" value={stats.bottles} />
      <Stat label="Weine" value={stats.wines} />
      <Stat label="Kaufwert" value={currency(stats.purchaseValue)} />
      <Stat label="Marktwert" value={currency(stats.marketValue)} />
      <div className="glass-card rounded-[2rem] p-6 lg:col-span-2">
        <h3 className="font-bold">Trinkreife Weine</h3>
        <div className="mt-4 space-y-3">{wines.filter((wine) => isDrinkReady(wine) && wine.currentBottles > 0).slice(0, 6).map((wine) => <WineRow key={wine.id} wine={wine} />)}</div>
      </div>
      <div className="glass-card rounded-[2rem] p-6 lg:col-span-2">
        <h3 className="font-bold">Keller vs auswärts konsumiert</h3>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[{ name: "Keller", value: stats.cellarDrinks }, { name: "Auswärts", value: stats.externalDrinks }]} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={4}>
                <Cell fill="#7f1734" />
                <Cell fill="#171314" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <h3 className="font-bold">Kurzstatistik</h3>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <Metric label="Durchschnittsbewertung" value={stats.avgRating ? stats.avgRating.toFixed(1) : "–"} />
          <Metric label="Keller konsumiert" value={stats.cellarDrinks} />
          <Metric label="Auswärts getrunken" value={stats.externalDrinks} />
          <Metric label="Lieblingsland" value={stats.topCountry || "–"} />
          <Metric label="Meistgetrunkene Region" value={stats.topRegion || "–"} />
          <Metric label="Favoriten" value={stats.favorites} />
        </dl>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="glass-card rounded-[2rem] p-6"><p className="text-sm text-neutral-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl bg-white p-4"><dt className="text-neutral-500">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>;
}

function Cellar(props: {
  filters: WineFilters; onFilters: (filters: WineFilters) => void; wineForm: WineFormState; setWineForm: (wine: WineFormState) => void;
  editing: boolean; saveWine: (event: FormEvent) => void; saving: boolean; wines: Wine[]; allWines: Wine[]; selectWine: (wine: Wine) => void; deleteWine: (id: string) => void; restoreWine: (id: string) => void;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[26rem_1fr]">
      <WineForm {...props} />
      <div className="space-y-4">
        <Filters filters={props.filters} onFilters={props.onFilters} wines={props.allWines} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {props.wines.map((wine) => <WineCard key={wine.id} wine={wine} onSelect={() => props.selectWine(wine)} onDelete={() => wine.id && props.deleteWine(wine.id)} />)}
        </div>
        <div className="glass-card rounded-[2rem] p-6">
          <h3 className="font-bold">Papierkorb</h3>
          <div className="mt-3 space-y-2">{props.allWines.filter((wine) => wine.status === "deleted").map((wine) => <button key={wine.id} className="flex w-full items-center justify-between rounded-xl bg-white p-3 text-left" onClick={() => wine.id && props.restoreWine(wine.id)}>{wine.name}<ArchiveRestore className="size-4" /></button>)}</div>
        </div>
      </div>
    </section>
  );
}

function WineForm({ wineForm, setWineForm, saveWine, saving, editing }: { wineForm: WineFormState; setWineForm: (wine: WineFormState) => void; saveWine: (event: FormEvent) => void; saving: boolean; editing: boolean }) {
  const update = (key: keyof WineFormState, value: string | number | boolean | undefined) => setWineForm({ ...wineForm, [key]: value });
  return (
    <form onSubmit={saveWine} className="glass-card h-fit rounded-[2rem] p-5">
      <h2 className="text-xl font-bold"><Plus className="mr-2 inline size-5" />{editing ? "Wein bearbeiten" : "Wein hinzufügen"}</h2>
      <div className="mt-4 grid gap-3">
        <Input label="Weinname*" value={wineForm.name} onChange={(value) => update("name", value)} required />
        <Input label="Produzent*" value={wineForm.producer} onChange={(value) => update("producer", value)} required />
        <div className="grid grid-cols-2 gap-3"><Input label="Jahrgang*" type="number" value={wineForm.vintage} onChange={(value) => update("vintage", Number(value))} required /><Select label="Weinart*" value={wineForm.type} options={wineTypes} onChange={(value) => update("type", value)} /></div>
        <div className="grid grid-cols-2 gap-3"><Input label="Land*" value={wineForm.country} onChange={(value) => update("country", value)} required /><Input label="Region*" value={wineForm.region} onChange={(value) => update("region", value)} required /></div>
        <div className="grid grid-cols-2 gap-3"><Select label="Flaschengrösse" value={String(wineForm.bottleSize)} options={bottleSizes.map(String)} onChange={(value) => update("bottleSize", Number(value))} /><Input label="Anzahl" type="number" value={wineForm.currentBottles} onChange={(value) => setWineForm({ ...wineForm, currentBottles: Number(value), ...(editing ? {} : { originalBottles: Number(value) }) })} /></div>
        <Input label="Traubensorten" value={wineForm.grapes} onChange={(value) => update("grapes", value)} />
        <div className="grid grid-cols-2 gap-3"><Input label="Kaufpreis CHF" type="number" value={wineForm.purchasePrice ?? ""} onChange={(value) => update("purchasePrice", value ? Number(value) : undefined)} /><Input label="Marktwert" type="number" value={wineForm.marketValue ?? ""} onChange={(value) => update("marketValue", value ? Number(value) : undefined)} /></div>
        <div className="grid grid-cols-2 gap-3"><Input label="Trinkreif ab" type="date" value={wineForm.drinkFrom} onChange={(value) => update("drinkFrom", value)} /><Input label="Trinkreif bis" type="date" value={wineForm.drinkUntil} onChange={(value) => update("drinkUntil", value)} /></div>
        <div className="grid grid-cols-3 gap-3"><Input label="Lagerort" value={wineForm.storageLocation} onChange={(value) => update("storageLocation", value)} /><Input label="Regal" value={wineForm.shelf} onChange={(value) => update("shelf", value)} /><Input label="Fach" value={wineForm.compartment} onChange={(value) => update("compartment", value)} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={wineForm.favorite} onChange={(event) => update("favorite", event.target.checked)} /> Favorit</label>
        <button className="focus-ring rounded-full bg-wine py-3 font-bold text-white disabled:opacity-50" disabled={saving}>{saving ? "Speichert…" : editing ? "Speichern" : "Speichern & zusammenführen"}</button>
      </div>
    </form>
  );
}

function Filters({ filters, onFilters, wines }: { filters: WineFilters; onFilters: (filters: WineFilters) => void; wines: Wine[] }) {
  const countries = Array.from(new Set(wines.map((wine) => wine.country).filter(Boolean)));
  const regions = Array.from(new Set(wines.map((wine) => wine.region).filter(Boolean)));
  return (
    <div className="glass-card rounded-[2rem] p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <label className="relative md:col-span-2"><Search className="absolute left-3 top-3 size-4 text-neutral-400" /><input className="focus-ring w-full rounded-2xl border border-black/10 bg-white py-2 pl-9 pr-3" placeholder="Suche nach Wein, Produzent, Region…" value={filters.query} onChange={(event) => onFilters({ ...filters, query: event.target.value })} /></label>
        <Select label="Art" value={filters.type} options={["", ...wineTypes]} onChange={(value) => onFilters({ ...filters, type: value })} />
        <Select label="Land" value={filters.country} options={["", ...countries]} onChange={(value) => onFilters({ ...filters, country: value })} />
        <Select label="Region" value={filters.region} options={["", ...regions]} onChange={(value) => onFilters({ ...filters, region: value })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.favoritesOnly} onChange={(event) => onFilters({ ...filters, favoritesOnly: event.target.checked })} /> Favoriten</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.drinkReadyOnly} onChange={(event) => onFilters({ ...filters, drinkReadyOnly: event.target.checked })} /> Trinkreif</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.inStockOnly} onChange={(event) => onFilters({ ...filters, inStockOnly: event.target.checked })} /> Bestand vorhanden</label>
      </div>
    </div>
  );
}

function WineCard({ wine, onSelect, onDelete }: { wine: Wine; onSelect: () => void; onDelete: () => void }) {
  return (
    <article className="glass-card rounded-[2rem] p-5 transition hover:-translate-y-1">
      <button className="w-full text-left" onClick={onSelect}>
        <div className="mb-4 flex h-28 items-center justify-center rounded-2xl bg-gradient-to-br from-wine to-neutral-950 text-white"><WineIcon className="size-10" /></div>
        <div className="flex items-start justify-between gap-3"><h3 className="font-bold">{wine.name}</h3>{wine.favorite && <Heart className="size-5 fill-wine text-wine" />}</div>
        <p className="mt-1 text-sm text-neutral-500">{wine.producer} · {wine.vintage}</p>
        <p className="mt-3 text-sm">{wine.country}, {wine.region}</p>
        <div className="mt-4 flex items-center justify-between text-sm"><span className="rounded-full bg-neutral-100 px-3 py-1">{wine.currentBottles} Fl.</span><span>{wine.drinkFrom || "–"} – {wine.drinkUntil || "–"}</span></div>
      </button>
      <button className="mt-4 text-sm text-neutral-500 hover:text-wine" onClick={onDelete}><Trash2 className="mr-1 inline size-4" />In Papierkorb</button>
    </article>
  );
}

function WineRow({ wine }: { wine: Wine }) {
  return <div className="flex items-center justify-between rounded-2xl bg-white p-3 text-sm"><span>{wine.name} · {wine.vintage}</span><strong>{wine.currentBottles} Fl.</strong></div>;
}

function History({ drinks, addExternal }: { drinks: DrinkEvent[]; addExternal: (event: Omit<DrinkEvent, "ownerId" | "source" | "createdAt">) => void }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(4);
  return (
    <section className="grid gap-6 lg:grid-cols-[24rem_1fr]">
      <form className="glass-card h-fit rounded-[2rem] p-5" onSubmit={(event) => { event.preventDefault(); addExternal({ wineName: name, rating, consumedAt: new Date().toISOString().slice(0, 10) }); setName(""); }}>
        <h2 className="font-bold">Auswärts getrunkenen Wein erfassen</h2>
        <Input label="Weinname" value={name} onChange={setName} required />
        <Select label="Bewertung" value={String(rating)} options={["1", "2", "3", "4", "5"]} onChange={(value) => setRating(Number(value) as 1 | 2 | 3 | 4 | 5)} />
        <button className="mt-4 rounded-full bg-wine px-5 py-2 font-bold text-white">Speichern</button>
      </form>
      <div className="glass-card rounded-[2rem] p-5"><h2 className="font-bold">Trinkhistorie</h2><div className="mt-4 space-y-3">{drinks.map((drink) => <div key={drink.id} className="rounded-2xl bg-white p-4"><strong>{drink.wineName}</strong><p className="text-sm text-neutral-500">{drink.consumedAt} · {drink.rating}/5 · {drink.source === "external" ? "auswärts" : "Keller"}</p></div>)}</div></div>
    </section>
  );
}

function ImportExport({ wines, preview, setPreview, importAll }: { wines: Wine[]; preview: WineFormState[]; setPreview: (items: WineFormState[]) => void; importAll: () => Promise<void> }) {
  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview((await parseWineImport(file)) as WineFormState[]);
  };
  return (
    <section className="glass-card rounded-[2rem] p-6">
      <h2 className="text-xl font-bold">Excel Import & Export</h2>
      <p className="mt-2 text-neutral-600">Importe laufen immer über Vorschau, Plausibilitätsprüfung und Bestätigung – keine Blindimporte.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button className="rounded-full bg-neutral-950 px-5 py-2 text-white" onClick={downloadTemplate}><Download className="mr-2 inline size-4" />Vorlage</button>
        <button className="rounded-full bg-wine px-5 py-2 text-white" onClick={() => exportWines(wines)}><Download className="mr-2 inline size-4" />Excel Export</button>
        <button className="rounded-full bg-white px-5 py-2 shadow" onClick={() => downloadJson(wines)}><FileJson className="mr-2 inline size-4" />JSON Export</button>
        <label className="rounded-full bg-white px-5 py-2 shadow"><Upload className="mr-2 inline size-4" />Excel wählen<input className="hidden" type="file" accept=".xlsx,.xls" onChange={(event) => void onFile(event)} /></label>
      </div>
      {preview.length > 0 && <div className="mt-6"><h3 className="font-bold">Vorschau ({preview.length})</h3><div className="mt-3 max-h-80 overflow-auto rounded-2xl bg-white"><table className="w-full text-left text-sm"><tbody>{preview.map((item, index) => <tr key={`${item.name}-${index}`} className="border-b"><td className="p-3">{item.name}</td><td>{item.producer}</td><td>{item.vintage}</td><td>{item.currentBottles} Fl.</td></tr>)}</tbody></table></div><button className="mt-4 rounded-full bg-wine px-5 py-2 font-bold text-white" onClick={() => void importAll()}>Import bestätigen</button></div>}
    </section>
  );
}

function AdminPanel() {
  const [email, setEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers });
  const users = usersQuery.data ?? [];
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  return (
    <section className="glass-card rounded-[2rem] p-6">
      <h2 className="text-xl font-bold">Nutzerverwaltung</h2>
      <p className="mt-2 text-neutral-600">Admins können Nutzer einladen, deaktivieren und löschen. Private Weinkeller bleiben durch Security Rules unsichtbar.</p>
      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <Input label="E-Mail für Einladung" value={email} onChange={setEmail} />
        <button className="mt-6 rounded-full bg-wine px-5 py-2 font-bold text-white" onClick={() => void createInvitation(email).then(setInviteLink)}>Einladungslink erstellen</button>
      </div>
      {inviteLink && <p className="mt-3 break-all rounded-2xl bg-white p-3 text-sm">WhatsApp-Link / E-Mail-Link: {inviteLink}</p>}
      <div className="mt-6 space-y-3">{users.map((managedUser: UserProfile) => (
        <div key={managedUser.uid} className="flex flex-col justify-between gap-3 rounded-2xl bg-white p-4 md:flex-row md:items-center">
          <div><strong>{managedUser.displayName ?? managedUser.email ?? managedUser.uid}</strong><p className="text-sm text-neutral-500">{managedUser.role} · {managedUser.disabled ? "deaktiviert" : "aktiv"}</p></div>
          <div className="flex gap-2"><button className="rounded-full bg-neutral-100 px-4 py-2 text-sm" onClick={() => void setUserDisabled(managedUser.uid, !managedUser.disabled).then(refresh)}>{managedUser.disabled ? "Aktivieren" : "Deaktivieren"}</button><button className="rounded-full bg-red-50 px-4 py-2 text-sm text-red-700" onClick={() => void deleteUserProfile(managedUser.uid).then(refresh)}>Löschen</button></div>
        </div>
      ))}</div>
    </section>
  );
}

function Privacy() {
  return (
    <section className="glass-card rounded-[2rem] p-6 leading-7 text-neutral-700">
      <h2 className="text-2xl font-bold text-neutral-950">Datenschutzerklärung</h2>
      <p className="mt-3">Weinbox speichert deine Weindaten nutzergetrennt in Firebase Firestore. Admins verwalten nur Nutzerstatus und Einladungen, sehen aber keine privaten Kellerdaten.</p>
      <p className="mt-3">Bilder sind optional, werden sparsam in Firebase Storage abgelegt und sollten komprimiert als WebP hochgeladen werden. Offline-Persistence nutzt IndexedDB lokal in deinem Browser.</p>
      <p className="mt-3">Du kannst deine Daten jederzeit als Excel oder JSON exportieren. Für produktive Nutzung müssen Impressum und projektspezifische Kontaktangaben ergänzt werden.</p>
    </section>
  );
}

function DrinkModal({ wine, rating, setRating, onClose, onEdit, onConsume }: { wine: Wine; rating: 1 | 2 | 3 | 4 | 5; setRating: (rating: 1 | 2 | 3 | 4 | 5) => void; onClose: () => void; onEdit: () => void; onConsume: (comment: string, location: string, date: string) => void }) {
  const [comment, setComment] = useState("");
  const [location, setLocation] = useState("Zuhause");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-bold">{wine.name}</h2>
        <p className="text-neutral-500">Was möchtest du tun?</p>
        <div className="mt-5 grid gap-3">
          <Select label="Bewertung" value={String(rating)} options={["1", "2", "3", "4", "5"]} onChange={(value) => setRating(Number(value) as 1 | 2 | 3 | 4 | 5)} />
          <Input label="Datum" type="date" value={date} onChange={setDate} />
          <Input label="Ort" value={location} onChange={setLocation} />
          <Input label="Kommentar" value={comment} onChange={setComment} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3"><button className="rounded-full bg-wine px-5 py-2 font-bold text-white disabled:opacity-50" disabled={wine.currentBottles <= 0} onClick={() => onConsume(comment, location, date)}>Austrinken</button><button className="rounded-full bg-neutral-950 px-5 py-2 font-bold text-white" onClick={onEdit}>Bearbeiten</button><button className="rounded-full bg-neutral-100 px-5 py-2" onClick={onClose}>Abbrechen</button></div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="text-sm font-medium text-neutral-700"><span>{label}</span><input className="focus-ring mt-1 w-full rounded-2xl border border-black/10 bg-white px-3 py-2" type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <label className="text-sm font-medium text-neutral-700"><span>{label}</span><select className="focus-ring mt-1 w-full rounded-2xl border border-black/10 bg-white px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option || "Alle"}</option>)}</select></label>;
}

function buildStats(wines: Wine[], drinks: DrinkEvent[]) {
  const active = wines.filter((wine) => wine.status !== "deleted");
  const tally = (key: "country" | "region") => drinks.reduce<Record<string, number>>((acc, drink) => {
    const value = drink[key];
    if (value) acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
  const top = (items: Record<string, number>) => Object.entries(items).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  return {
    bottles: active.reduce((sum, wine) => sum + wine.currentBottles, 0),
    wines: active.length,
    purchaseValue: active.reduce((sum, wine) => sum + (wine.purchasePrice ?? 0) * wine.originalBottles, 0),
    marketValue: active.reduce((sum, wine) => sum + (wine.marketValue ?? 0) * wine.currentBottles, 0),
    avgRating: drinks.length ? drinks.reduce((sum, drink) => sum + drink.rating, 0) / drinks.length : 0,
    cellarDrinks: drinks.filter((drink) => drink.source === "cellar").length,
    externalDrinks: drinks.filter((drink) => drink.source === "external").length,
    topCountry: top(tally("country")),
    topRegion: top(tally("region")),
    favorites: active.filter((wine) => wine.favorite).length
  };
}

function downloadJson(wines: Wine[]) {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), wines }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "weinbox-export.json";
  link.click();
  URL.revokeObjectURL(url);
}
