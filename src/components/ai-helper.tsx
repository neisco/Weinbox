"use client";

import { FormEvent, useState } from "react";

const defaultPrompt = "Schreibe eine kurze, freundliche Weinbeschreibung für einen trockenen Schweizer Rotwein aus dem Jahr 2020, produziert von Domaine Beispiel, mit Noten von dunklen Beeren und einer gut eingebundenen Tanninstruktur.";

export default function AiHelper() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResult("");
    setError(null);

    try {
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Fehler beim KI-Aufruf");
      }

      setResult(data.result ?? "");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">AI-Assistent</h2>
        <p className="text-sm text-neutral-600">
          Erstelle automatisch Texte für Weinbeschreibungen, Notizen oder Erinnerungen. Die Anfrage wird serverseitig an OpenAI weitergeleitet.
        </p>
        <p className="text-sm text-neutral-500">
          Hinweis: Für lokale Nutzung muss <code className="rounded bg-neutral-100 px-2 py-1">OPENAI_API_KEY</code> in <code className="rounded bg-neutral-100 px-2 py-1">.env.local</code> stehen.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-neutral-700">Eingabe für die KI</label>
        <textarea
          className="min-h-[140px] w-full rounded-3xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-900 outline-none transition focus:border-wine focus:ring-2 focus:ring-wine/10"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Beschreibe den Wein..."
        />

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="inline-flex items-center justify-center rounded-full bg-wine px-6 py-3 text-sm font-semibold text-white transition hover:bg-wine/90 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {loading ? "Generiere…" : "Text generieren"}
        </button>
      </form>

      {error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {result && (
        <div className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
          <h3 className="mb-3 text-base font-semibold">KI-Ergebnis</h3>
          <pre className="whitespace-pre-wrap text-sm leading-6 text-neutral-800">{result}</pre>
        </div>
      )}
    </section>
  );
}
