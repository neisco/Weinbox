# Weinbox Architektur

Weinbox ist als produktionsnahes Next.js-MVP aufgebaut und für Vercel vorbereitet.

## Schichten

- `src/app`: App Router, Layout, globale Styles und die MVP-Oberfläche.
- `src/components`: Wiederverwendbare UI-Bausteine wie der Cookie-Banner.
- `src/lib/firebase`: Firebase Auth, Firestore, Storage und Offline-Persistence.
- `src/lib/wine`: Bestandslogik, Duplikatschlüssel, Suche und Trinkfenster.
- `src/lib/excel`: XLSX-Vorlagen, Import-Vorschau und Export.
- `src/lib/integrations`: Austauschbare Provider-Architektur für Wine-Searcher und spätere Datenquellen.
- `src/types`: Zentrale TypeScript- und Zod-Datenmodelle.

## Datenschutz & Sicherheit

Firestore ist nutzergetrennt unter `cellars/{uid}` organisiert. Die Security Rules erlauben Kellerzugriffe nur dem eingeloggten Besitzer. Admins verwalten ausschliesslich `users` und `invites`, nicht fremde Keller.

## Zukunftsfunktionen

OCR, Barcode-/QR-Scanner, KI-Empfehlungen, Wunschlisten und weitere Preisquellen können als eigene Provider oder Feature-Module ergänzt werden, ohne die Kernlogik zu ersetzen.
