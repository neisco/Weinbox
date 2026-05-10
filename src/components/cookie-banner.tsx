"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "weinbox-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(STORAGE_KEY) !== "accepted");
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-4xl rounded-2xl border border-black/10 bg-white/95 p-4 shadow-2xl backdrop-blur md:flex md:items-center md:justify-between md:gap-6">
      <div>
        <p className="font-semibold text-neutral-950">Datenschutzfreundliche Cookies</p>
        <p className="mt-1 text-sm text-neutral-600">
          Weinbox nutzt nur technisch notwendige lokale Speicherung für Login, Offline-Sync und deine Cookie-Auswahl.
        </p>
      </div>
      <button
        className="focus-ring mt-4 rounded-full bg-wine px-5 py-2 text-sm font-semibold text-white transition hover:bg-wine-dark md:mt-0"
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "accepted");
          setVisible(false);
        }}
      >
        Verstanden
      </button>
    </div>
  );
}
