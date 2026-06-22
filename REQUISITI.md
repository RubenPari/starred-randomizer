# REQUISITI — GitHub Starred Randomizer

Documento di specifica funzionale e tecnica basato sullo stato attuale del codice (`backend/`, `frontend/`, `railway.json`, `.env.example`, `AGENTS.md`, `README.md`, `RAILWAY_DEPLOY.md`).

Convenzioni: i requisiti sono etichettati con un ID stabile (`R<area>-<n>`) e un tag di stato:
- **[OK]** — requisito implementato e verificabile nel codice.
- **[CONTRATTO]** — vincolo di deployment / runtime.
- **[LIMITE]** — comportamento esistente documentato come limitazione consapevole.

---

## 1. Contesto e obiettivi

**R1-OBJ-1 [OK]** Applicazione full-stack TypeScript che consente di esplorare le repository starred di un utente GitHub, filtrarle, estrarne una a caso, scoprirne di sottovalutate (hidden gems), effettuare ricerche testuali, visualizzare statistiche aggregate e salvare preferiti.

**R1-OBJ-2 [OK]** UI in lingua italiana; supporto tema chiaro/scuro con preferenza persistita in `localStorage` e pre-applicata in `index.html` per evitare flash.

**R1-OBJ-3 [OK]** Stack: backend Fastify 5 + TypeScript; frontend React 19 + Vite 7 + Tailwind v4; database MySQL 8; autenticazione JWT in cookie httpOnly.

---

## 2. Requisiti funzionali — Backend

### 2.1 Starred repositories

**R2.1-1 [OK]** `GET /api/starred/:username` restituisce l'elenco completo delle repository starred dell'utente.

**R2.1-2 [OK]** Paginazione GitHub gestita lato backend (`perPage=100`, `maxPages=20`) per coprire fino a ~2000 repo starred.

**R2.1-3 [OK]** Cache in-memory con TTL 5 minuti (`cacheTtlMs = 5 * 60 * 1000`); fetch parziali **non** vengono messi in cache (`partial: true` escluso da `getCached`).

**R2.1-4 [CONTRATTO]** Token GitHub: `GITHUB_TOKEN` (globale, server) **obbligatorio**; in produzione l'app **fallisce al boot** se mancante (`process.exit(1)`).

**R2.1-5 [OK]** Token per-utente opzionale: se l'utente è autenticato ed ha salvato un proprio `github_token` (vedi R2.6), viene usato al posto del token globale per chiamate GitHub.

**R2.1-6 [OK]** Timeout per richiesta GitHub: 15 secondi (`requestTimeoutMs`).

### 2.2 Estrazione random

**R2.2-1 [OK]** `GET /api/random/:username` restituisce una singola repository casuale tra le starred dell'utente, applicando i filtri opzionali.

**R2.2-2 [OK]** Filtri supportati in querystring:
- `language` — match case-insensitive sul campo `language`.
- `min_stars` — soglia minima su `stargazers_count`.
- `topic` — match case-insensitive su un topic.
- `include_archived` — default `true`; valori `'false'`/`'0'` escludono le repo archiviate.
- `updated_after` — ISO date; mantiene solo repo con `updated_at >= soglia`.
- `exclude` — lista CSV di `full_name` da escludere (usata dal frontend per non riproporre repo già viste).

**R2.2-3 [OK]** Se nessuna repo soddisfa i filtri → `404 { error: 'Nessun repository trovato con questi filtri' }`.

**R2.2-4 [OK]** Se tutte le repo filtrate sono in `exclude` → `404 { error: 'Tutti i repository corrispondenti ai filtri sono già stati mostrati. Azzera la cronologia o allarga i filtri.' }`.

### 2.3 Hidden gems

**R2.3-1 [OK]** `GET /api/hidden-gems/:username?limit=` calcola uno score per ogni repo starred non archiviata e con `stargazers_count <= hiddenGemsMaxStars` (default 100).

**R2.3-2 [OK]** Score (vedi `backend/src/utils/hidden-gems.ts`):
- `recencyScore = max(0, 1 - (now - updated_at) / 1y)` (peso 0.35)
- `popularityScore = 1 - stargazers_count / maxStars` (peso 0.40)
- `engagementScore = (forks/maxForks + watchers/maxWatchers) / 2` (peso 0.25)
- `score = round(sum * 1000) / 1000`, ordinato discendente.

**R2.3-3 [CONTRATTO]** `limit` di default `hiddenGemsDefaultLimit` (10) e clamp a `hiddenGemsMaxLimit` (20), entrambi configurabili via env (`HIDDEN_GEMS_DEFAULT_LIMIT`, `HIDDEN_GEMS_MAX_LIMIT`).

### 2.4 Ricerca

**R2.4-1 [OK]** `GET /api/search/:username?q=&language=&min_stars=&topic=&include_archived=&updated_after=&limit=` ricerca substring case-insensitive su `full_name`, `description`, `topics`, `language`.

**R2.4-2 [OK]** `q` obbligatorio; assente o vuoto → `400 { error: 'Parametro q richiesto' }`.

**R2.4-3 [OK]** Filtri `language`/`min_stars`/`topic`/`include_archived`/`updated_after` applicati come in R2.2 prima del match testuale.

**R2.4-4 [CONTRATTO]** `limit` di default `searchDefaultLimit` (50), clamp a `searchMaxLimit` (100), configurabili via env.

### 2.5 Statistiche

**R2.5-1 [OK]** `GET /api/stats/:username` restituisce:
- `totalRepos`, `totalStars`, `avgStars` (intero), `archivedCount`.
- `languages[]` — per lingua: conteggio e `totalStars`, ordinato per count desc.
- `repoCreationActivity[]` — bucket giornaliero (`YYYY-MM-DD`) su `created_at`.
- `monthlyActivity[]` — bucket mensile (`YYYY-MM`).
- `topTopics[]` — top N topic per frequenza, N = `topTopicsLimit` (default 20, env `TOP_TOPICS_LIMIT`).

### 2.6 Autenticazione e preferiti

**R2.6-1 [OK]** `POST /api/auth/register` crea utente; password hashata con argon2; lunghezza minima `minPasswordLength` (default 8).

**R2.6-2 [OK]** `POST /api/auth/login` emette JWT firmato con `JWT_SECRET`; il cookie httpOnly è firmato con `COOKIE_SECRET`.

**R2.6-3 [CONTRATTO]** In `NODE_ENV=production` i segreti non possono restare ai default `dev-secret-change-in-production` / `cookie-secret-change-in-production`: il processo termina con errore `[FATAL]`.

**R2.6-4 [OK]** `POST /api/auth/logout` invalida la sessione lato server.

**R2.6-5 [OK]** `GET /api/auth/me` ritorna l'utente corrente o 401.

**R2.6-6 [OK]** `PUT /api/auth/me/token` salva/aggiorna il `github_token` per-utente; usato poi da R2.1-5.

**R2.6-7 [OK]** Schema DB auto-creato al primo avvio (tabelle `users` e `favorites` con `initSchema`).

**R2.6-8 [OK]** `GET /api/favorites` — lista dei preferiti dell'utente autenticato, ordinata per `created_at DESC`.

**R2.6-9 [OK]** `POST /api/favorites` — body `{ repo: Repo }`; rifiuta 400 se `full_name` mancante, 409 se già presente, altrimenti 201 con `{ id, repo }`.

**R2.6-10 [OK]** `DELETE /api/favorites/*` — `*` è il `fullName` URL-encoded; 404 se non esiste, 200 con messaggio di conferma altrimenti.

**R2.6-11 [CONTRATTO]** Tutti gli endpoint `/api/favorites/*` e `PUT /api/auth/me/token` richiedono auth; in mancanza il decorator `app.requireAuth` risponde `401`.

### 2.7 Health & infrastruttura

**R2.7-1 [OK]** `GET /api/health` ritorna `{ status: 'ok', uptime, timestamp, cache: { size, keys } }`.

**R2.7-2 [OK]** Graceful shutdown su `SIGTERM`/`SIGINT`: chiusura pool MySQL → chiusura Fastify → `exit(0)`.

**R2.7-3 [OK]** CORS limitato a `CORS_ORIGIN` (default `http://localhost:5173`) con `credentials: true`.

**R2.7-4 [OK]** In produzione il backend serve anche gli asset statici del frontend da `frontend/dist` via `@fastify/static`. `setNotFoundHandler` rimanda a `index.html` per le rotte SPA non `/api/`.

### 2.8 Validazione e gestione errori

**R2.8-1 [OK]** Username validato con regex `^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$` (regole GitHub). Input non valido → `400 { error: 'Formato username non valido' }`.

**R2.8-2 [OK]** Errori GitHub mappati in italiano (`getGithubErrorMessage`): 404 username non trovato, 401 token non valido/scaduto, 403 accesso negato/rate limit, 422 username non valido, 5xx errore server, fallback `Errore GitHub API (status)`.

**R2.8-3 [OK]** `safeParseInt` parsing NaN-safe dei parametri numerici (`limit`, `min_stars`).

---

## 3. Requisiti funzionali — Frontend

### 3.1 Layout & stato

**R3.1-1 [OK]** `App.tsx` orchestra: `useStarredRepos`, `useRandomRepo`, `useFavorites`, `useTheme`, oltre ai pannelli `Header`, `FilterPanel`, `ResultCard`, `HistoryPanel`, `ShuffleAnimation`, `SearchPanel`, `HiddenGems`, `FavoritesPanel`, `StatsDashboard`, `TimelineHeatmap`, `StatisticsPanel`, `SettingsPanel`, `AuthModal`.

**R3.1-2 [OK]** Username di default `RubenPari`; configurabile da input UI.

**R3.1-3 [OK]** `useStarredRepos` chiama `GET /api/starred/:username`; espone `repos`, `loading`, `error`, `fetchStarred`, `clearError`.

**R3.1-4 [OK]** `useRandomRepo` chiama `GET /api/random/:username`; mantiene `history` (max 50 elementi, deduplica per `full_name`, ordine LIFO); espone `getRandom`, `selectFromHistory`, `clearHistory`. Passa `exclude=` come CSV delle repo già mostrate.

**R3.1-5 [OK]** Errori API standardizzati tramite `handleApiError` (`utils/format.ts`): estrae `error` da `response.data`, mappa `ERR_NETWORK` in messaggio italiano, fallback generico.

**R3.1-6 [OK]** `useTheme` con persistenza in `localStorage` chiave `theme`; rispetta `prefers-color-scheme` come default.

### 3.2 Filtri

**R3.2-1 [OK]** `FilterPanel` espone i campi `language`, `min_stars`, `topic`, `include_archived`, `updated_after` — condivisi tra tab Randomizer e Search via tipo `RepoFilters`.

### 3.3 Ricerca, hidden gems, preferiti, statistiche

**R3.3-1 [OK]** `SearchPanel` consuma `GET /api/search/:username` con i filtri attivi.

**R3.3-2 [OK]** `HiddenGems` consuma `GET /api/hidden-gems/:username` con `HIDDEN_GEMS_LIMIT = 10`.

**R3.3-3 [OK]** `FavoritesPanel` + `useFavorites`:
- Utente autenticato → persistenza server-side (`/api/favorites`).
- Guest → persistenza in `localStorage` chiave `starred-randomizer-favorites`.
- All'auth lo stato viene ricaricato dal server; al logout si ripopola da `localStorage`.
- `addFavorite` server fallisce → fallback silenzioso in locale.
- `removeFavorite` server fallisce → procede comunque a rimuovere dallo stato locale.

**R3.3-4 [OK]** `StatsDashboard` + `StatisticsPanel` consumano `GET /api/stats/:username`.

**R3.3-5 [OK]** `TimelineHeatmap` visualizza l'attività di creazione repo sui bucket di `repoCreationActivity`/`monthlyActivity`.

**R3.3-6 [OK]** `HistoryPanel` mostra cronologia estrazioni; click su entry → `selectFromHistory` ripristina quella repo.

### 3.4 Autenticazione UI

**R3.4-1 [OK]** `AuthProvider` (`contexts/AuthContext.tsx`) bootstrap con `GET /api/auth/me`; espone `user`, `loading`, `login`, `register`, `logout`, `updateToken`.

**R3.4-2 [OK]** `axios.defaults.withCredentials = true` per includere il cookie httpOnly su tutte le richieste.

**R3.4-3 [OK]** `AuthModal` gestisce form di login/registrazione (lunghezza password = `minPasswordLength`).

**R3.4-4 [OK]** `SettingsPanel` consente di salvare/aggiornare il GitHub token personale.

### 3.5 Robustezza

**R3.5-1 [OK]** `ErrorBoundary` montato a monte di `AuthProvider`/`App`; `SkeletonCard` durante il loading delle repo.

**R3.5-2 [OK]** Tutti i consumer di icone (`Icons.tsx`) inoltrano `style` e `className` via spread.

---

## 4. Requisiti non funzionali

### 4.1 Prestazioni

**R4.1-1 [OK]** Cache GitHub riduce chiamate ripetute allo stesso `username` + token entro 5 min.

**R4.1-2 [OK]** Paginazione cap a `maxPages=20` evita esplosione di latenza per utenti con migliaia di starred.

**R4.1-3 [OK]** Calcolo score hidden gems O(n) con due passate (max + map).

### 4.2 Sicurezza

**R4.2-1 [CONTRATTO]** Cookie JWT `httpOnly`; CORS chiuso sull'origine configurata; credenziali accettate.

**R4.2-2 [CONTRATTO]** Hash password con argon2 (default settings libreria).

**R4.2-3 [CONTRATTO]** Validazione stretta username lato server prima di chiamare GitHub.

**R4.2-4 [CONTRATTO]** Token GitHub globale letto da env, redatto nei log (`[REDACTED]`); mai esposto al client. Token per-utente mai restituito da `GET /api/auth/me`.

**R4.2-5 [CONTRATTO]** Le route `favorites` e l'update del token non operano mai su `user_id` diverso da `request.userId` (impostato dal plugin auth dopo verifica JWT).

### 4.3 Affidabilità

**R4.3-1 [OK]** Health check `GET /api/health` esposto e usato da Railway (`railway.json` → `healthcheckPath`).

**R4.3-2 [OK]** Restart policy `ON_FAILURE` con max 3 retry (Railway).

**R4.3-3 [OK]** Error boundary e fallback UI per errori di rendering frontend.

**R4.3-4 [CONTRATTO]** Backend non serve statici se `frontend/dist` assente: l'app degrada ad API-only (warning log, no crash).

### 4.4 Internazionalizzazione

**R4.4-1 [OK]** Tutta l'UI in italiano (testi, placeholder, etichette, messaggi di errore lato backend).

**R4.4-2 [OK]** `<html lang="it">` dichiarato in `index.html`.

### 4.5 Build & qualità

**R4.5-1 [CONTRATTO]** Node.js 20.x richiesto (`package.json` engines, `railway.json` nixPkgs `nodejs_20`).

**R4.5-2 [OK]** Backend: `tsc --noEmit` per typecheck, `tsc` per build.

**R4.5-3 [OK]** Frontend: `tsc -b && vite build` per build con typecheck; `eslint .` per lint.

**R4.5-4 [OK]** Nessun framework di test configurato; nessun formatter oltre default ESLint.

---

## 5. Requisiti di deployment

**R5-1 [CONTRATTO]** Build pipeline (Nixpacks o `buildCommand` in `railway.json`):
- `cd frontend && npm ci && npm run build && cd ../backend && npm ci && npm run build`

**R5-2 [CONTRATTO]** Start command: `node backend/dist/index.js`.

**R5-3 [CONTRATTO]** Env vars obbligatorie in produzione: `GITHUB_TOKEN`, `JWT_SECRET`, `COOKIE_SECRET`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

**R5-4 [CONTRATTO]** `PORT` viene iniettato da Railway; il backend ripiega su 3001 se assente.

**R5-5 [CONTRATTO]** `CORS_ORIGIN` deve corrispondere al dominio pubblico generato da Railway.

**R5-6 [CONTRATTO]** Servizio MySQL 8 nello stesso progetto Railway; tabelle auto-create al boot.

**R5-7 [OK]** Sviluppo locale: backend su `:3001`, frontend Vite su `:5173` con proxy `/api` → `:3001`.

---

## 6. Requisiti di dati

### 6.1 Modello dominio

**R6.1-1 [OK]** `Repo` (vedi `types.ts`): `full_name`, `html_url`, `description`, `language`, `stargazers_count`, `forks_count`, `watchers_count`, `open_issues_count`, `topics[]`, `updated_at`, `created_at`, `archived`, `owner.{login,avatar_url,html_url}`.

**R6.1-2 [OK]** `HistoryEntry`: `{ repo: Repo, timestamp: number }`.

**R6.1-3 [OK]** `HiddenGemScore`: `{ repo, score, breakdown.{recencyScore,popularityScore,engagementScore} }`.

**R6.1-4 [OK]** `RepoStats`: vedi R2.5-1.

### 6.2 Persistenza MySQL

**R6.2-1 [OK]** `users(id, email, password_hash, github_token, created_at)` — PK `id` (UUID), email univoca.

**R6.2-2 [OK]** `favorites(id, user_id, full_name, repo_json, created_at)` — FK concettuale su `users.id` via `user_id`; `full_name` usato per idempotenza e lookup.

**R6.2-3 [CONTRATTO]** `repo_json` memorizza l'intero oggetto `Repo` serializzato; l'identità canonica del preferito è `(user_id, full_name)`.

---

## 7. Vincoli & limiti noti

**R7-LIM-1 [LIMITE]** Cache backend è in-memory e per processo: in deploy multi-replica o dopo restart la cache è fredda.

**R7-LIM-2 [LIMITE]** `maxPages=20` pone un tetto a ~2000 starred per utente. Profili con più starred avranno fetch parziale, che **non** viene cachato e viene rifetchato ad ogni richiesta.

**R7-LIM-3 [LIMITE]** `GET /api/random/:username` non restituisce 401 se l'utente non è autenticato: il token GitHub usato è quello globale (R2.1-4/5). L'auth è richiesta solo per `favorites` e `PUT /api/auth/me/token`.

**R7-LIM-4 [LIMITE]** Il fallback `localStorage` per i preferiti guest può divergere dallo stato server se l'utente fa login da un altro device: nessuna sincronizzazione è implementata.

**R7-LIM-5 [LIMITE]** Nessuna rotta admin per cancellare/ripulire il database; l'inizializzazione schema è solo additiva.

**R7-LIM-6 [LIMITE]** Nessun rate limiting applicativo: la protezione dipende dal rate limit GitHub e dalle politiche del proxy Railway.

**R7-LIM-7 [LIMITE]** Nessun test automatico (unit, integration, e2e): la verifica di regressione si affida a smoke test manuali (`Carica Starred`, flusso login/registrazione, health check post-deploy).

**R7-LIM-8 [LIMITE]** Le risposte di errore GitHub dipendono dalla traduzione italiana hard-coded in `getGithubErrorMessage`; nuovi status code ricadono sul fallback generico.

---

## 8. Tracciabilità sorgente

| Requisito | File principale |
|---|---|
| R2.1-1..R2.1-3, R2.1-6 | `backend/src/services/github.ts` |
| R2.1-4, R4.2-4 | `backend/src/config.ts` |
| R2.1-5, R2.6-6 | `backend/src/utils/user-token.ts`, `backend/src/plugins/auth.ts` |
| R2.2-* | `backend/src/routes/random.ts`, `backend/src/utils/filters.ts` |
| R2.3-* | `backend/src/routes/hidden-gems.ts`, `backend/src/utils/hidden-gems.ts` |
| R2.4-* | `backend/src/routes/search.ts` |
| R2.5-* | `backend/src/routes/stats.ts` |
| R2.6-* | `backend/src/plugins/auth.ts`, `backend/src/routes/favorites.ts` |
| R2.7-* | `backend/src/index.ts` |
| R2.8-* | `backend/src/utils/validation.ts`, `backend/src/utils/errors.ts`, `backend/src/routes/random.ts` (`safeParseInt`) |
| R3.1-3..R3.1-5 | `frontend/src/hooks/*` |
| R3.2-1 | `frontend/src/components/FilterPanel.tsx` |
| R3.3-* | `frontend/src/components/*` + `frontend/src/hooks/useFavorites.ts` |
| R3.4-* | `frontend/src/contexts/AuthContext.tsx`, `frontend/src/components/AuthModal.tsx`, `frontend/src/components/SettingsPanel.tsx` |
| R5-* | `railway.json`, `RAILWAY_DEPLOY.md` |
| R6.2-* | `backend/src/plugins/auth.ts` (`initSchema`) |
