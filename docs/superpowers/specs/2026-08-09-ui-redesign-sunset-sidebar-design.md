# UI Redesign: Sunset Sidebar

## Context

L'app (frontend React 19 + Tailwind v4) ha già funzionalità ricche (randomizer, ricerca, hidden gems, statistiche, preferiti) ma un layout a tab orizzontali e una palette viola/ciano che si sente generica. L'utente ha chiesto un redesign completo di UX/UI per dare all'app un'identità visiva più distintiva e un'esperienza più curata, con priorità sul momento centrale dell'estrazione random (ResultCard + ShuffleAnimation).

Obiettivo: nuova navigazione a sidebar, nuova palette "sunset" (arancio/rosa), e un reveal del repository randomizzato più spettacolare — senza toccare logica dati/hooks/API.

## Scope

Solo frontend, solo visuale/layout. Nessuna modifica a backend, hook, tipi, o flusso dati.

## Architettura navigazione

- Nuovo componente `Sidebar.tsx`:
  - Desktop (≥768px): fissa a sinistra, larghezza ~240px. Contenuto: brand/logo in alto, voci nav verticali con icona+label (Randomizer, Cerca, Hidden Gems, Statistiche, Preferiti — stessa lista di `tabs` in `App.tsx:177-183`), stato utente (email/logout/settings) in fondo.
  - Mobile (<768px): drawer overlay, aperto da hamburger icon in un header compatto in alto. Stesso componente `Sidebar`, controllato da uno stato `sidebarOpen` boolean.
- `App.tsx`: layout passa da colonna singola centrata a `flex` con `Sidebar` + area contenuto principale che scrolla. Rimuovere il blocco tab orizzontale esistente (App.tsx:236-252) — sostituito dalla sidebar.
- `Header.tsx` si semplifica: perde la responsabilità di ospitare la nav (se ce l'ha) e resta per titolo/username/toggle tema in cima all'area contenuto, oppure il suo contenuto utente migra nella sidebar — va verificato in fase di implementazione leggendo `Header.tsx` per decidere cosa resta dov'è.
- Nessun router introdotto: resta lo stato `activeTab` esistente, la sidebar semplicemente chiama `setActiveTab`.

## Palette — Sunset

In `frontend/src/index.css`, sostituire i valori dei token in `:root` e `:root.dark` (righe 21-39 e 41-59):
- `--color-brand`: arancio caldo (es. `#f97316`) al posto del viola
- `--color-brand-dark`: arancio più scuro/rosato per i gradient (es. `#ea580c` o transizione verso rosa)
- `--color-accent`: rosa/magenta (es. `#ec4899`) come colore secondario per gradient e dettagli
- `--color-star`: resta ambra, già coerente con la nuova palette
- `--bg-gradient`: gradient di sfondo pagina aggiornato da viola/ciano a tonalità sunset soft (arancio-rosa chiarissimi in light, arancio-rosa scuri desaturati in dark)
- Dark mode segue la stessa logica attuale (`:root.dark` override), toni desaturati per contrasto leggibile

Tutti i componenti che già usano le classi utility `bg-brand`, `from-brand to-brand-dark`, `text-brand`, `bg-accent` ecc. erediteranno automaticamente la nuova palette — nessuna modifica di classe necessaria nei singoli componenti per questo punto.

## ResultCard + ShuffleAnimation (priorità)

- `ResultCard.tsx`: gradient/border/glow più marcati con i nuovi colori sunset; animazione di reveal potenziata (spring/pop invece del semplice fade+scale attuale, riusando `animate-scale-in` come base e aggiungendo un keyframe più elastico se serve); badge stelle con micro-bounce; icona reroll con rotazione on-hover.
- `ShuffleAnimation.tsx`: attualmente pulse semplice su `filteredRepos` — potenziare con effetto "slot machine" (i nomi dei repo scorrono rapidamente prima di fermarsi sul risultato), usando gli stessi dati già passati come prop, nessuna nuova chiamata API o hook. Durata dell'animazione invariata.

## Altri componenti

Passata di stile uniforme, senza riscrittura strutturale: `FilterPanel`, `SearchPanel`, `HiddenGems`, `StatsDashboard`, `TimelineHeatmap`, `FavoritesPanel`, `HistoryPanel`, `SettingsPanel`, `AuthModal` mantengono la loro struttura JSX attuale; si aggiornano bordi/ombre/hover per coerenza con la nuova palette (ombre soft colorate invece di grigie neutre dove già presenti box-shadow).

## Cosa NON cambia

- Nessuna modifica a `backend/`
- Nessuna modifica a hooks (`useStarredRepos`, `useRandomRepo`, `useFavorites`, `useTheme`), contexts, types
- Nessuna nuova dipendenza
- Flusso dati e chiamate API invariati

## Verifica

1. `cd frontend && npm run dev`
2. Controllo visuale manuale:
   - Sidebar visibile e funzionante su viewport desktop (≥768px)
   - Drawer sidebar apribile/chiudibile su viewport mobile (devtools responsive mode)
   - Toggle dark/light mantiene leggibilità e coerenza palette sunset
   - Flusso completo: carica starred → applica filtro → estrai random → osserva ShuffleAnimation potenziata → ResultCard con reveal migliorato → reroll
   - Tutte le sezioni (Cerca, Hidden Gems, Statistiche, Preferiti) raggiungibili dalla sidebar e visivamente coerenti
3. `npm run build` in frontend per assicurarsi che non ci siano errori TypeScript/build introdotti dal refactor di layout
