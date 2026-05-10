# Weinbox

Moderne, responsive Web-App zur Verwaltung privater Weinkeller.

## Features im MVP

- Google Login via Firebase Authentication
- Firestore mit Offline-Persistence
- Nutzergetrennter Kellerbestand mit Soft Delete
- Duplikat-Erkennung nach Weinname, Produzent, Jahrgang und Flaschengrösse
- Trinkhistorie inklusive auswärts getrunkener Weine
- Dashboard mit Kaufwert, Marktwert, Bewertungen und Trinkreife
- Excel-Vorlage, Import-Vorschau, Excel- und JSON-Export
- Cookie-Banner und Datenschutzerklärung
- Modulare Vorbereitung für Wine-Searcher, OCR, Scanner und KI-Funktionen

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Trage die Firebase-Web-Konfiguration in `.env.local` ein und deploye die Firestore-/Storage-Regeln aus `firestore.rules` und `storage.rules`.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Installationshinweis

Das Projekt nutzt ausschliesslich öffentliche npm-Pakete über `https://registry.npmjs.org/`; die Registry ist zusätzlich in `.npmrc` festgehalten. Falls `npm install` mit `403 Forbidden` fehlschlägt, liegt das typischerweise an einer lokalen Proxy-/Netzwerk-Policy. Prüfe in diesem Fall `HTTP_PROXY`, `HTTPS_PROXY`, `npm_config_http_proxy` und `npm_config_https_proxy` oder führe die Installation in einem Netzwerk mit direktem Zugriff auf die öffentliche npm Registry aus.
