# Piano: Login con Email/Password + Token GitHub per Utente

## Obiettivo
1. **Ripristinare** il sistema di autenticazione da **username/password** a **email/password**.
2. **Aggiungere** un campo `github_token` all'utente loggato, modificabile tramite una dashboard UI nelle impostazioni account.
3. Le API GitHub devono usare il **token personale dell'utente** quando è loggato, con **fallback** sul token globale `GITHUB_TOKEN`.

---

## 1. Backend

### 1.1 Database
- Tabella `users`: ripristinare `email VARCHAR(255) UNIQUE NOT NULL`, rimuovere `username`.
- Aggiungere `github_token TEXT` (nullable) alla tabella `users`.
- Tabella `favorites`: invariata.

### 1.2 Plugin Auth (`backend/src/plugins/auth.ts`)
- Ripristinare `EMAIL_REGEX`, validazione email.
- Ripristinare `findUserByEmail`, `createUser` con `email`.
- Aggiungere `findUserById` che restituisce anche `github_token`.
- Aggiungere `updateUserToken(userId, token)`.
- Endpoint aggiornati:
  - `POST /api/auth/register`: usa `email`.
  - `POST /api/auth/login`: cerca per `email`.
  - `GET /api/auth/me`: restituisce `{ id, email, created_at }`.
  - `PUT /api/auth/me/token`: richiede auth, legge `{ token: string }` dal body, aggiorna `github_token` nel DB per l'utente corrente.

### 1.3 Servizio GitHub (`backend/src/services/github.ts`)
- Modificare `fetchWithTimeout(url, controller, token?)` per accettare un token opzionale.
- Se `token` è fornito, usarlo nell'header `Authorization: Bearer ${token}`.
- Se `token` è assente, fallback su `config.githubToken`.
- Propagare il parametro `token` in `fetchStarredPage` e `fetchAllStarred`.

### 1.4 Routes GitHub-dependent
Tutte le route che chiamano `fetchAllStarred` devono:
- Se `request.userId` esiste, fare `findUserById` per leggere `github_token`.
- Passare `github_token` (o `undefined`) come secondo argomento a `fetchAllStarred`.
Route coinvolte:
- `backend/src/routes/starred.ts`
- `backend/src/routes/random.ts`
- `backend/src/routes/search.ts`
- `backend/src/routes/hidden-gems.ts`
- `backend/src/routes/stats.ts`

### 1.5 Favorites (`backend/src/routes/favorites.ts`)
- Nessuna modifica logica, ma verificare che non ci siano riferimenti a `username`/`email`.

### 1.6 Config (`backend/src/config.ts`)
- Mantenere `githubToken` come fallback globale (richiesto, per utenti non loggati).

---

## 2. Frontend

### 2.1 AuthContext (`frontend/src/contexts/AuthContext.tsx`)
- Ripristinare `email: string` nell'interfaccia `User`.
- `login` e `register`: parametri `email: string`.
- Aggiungere `updateToken(token: string): Promise<void>` che chiama `PUT /api/auth/me/token`.

### 2.2 AuthModal (`frontend/src/components/AuthModal.tsx`)
- Ripristinare label/input a "Email", `type="email"`, `autoComplete="email"`, validazione.
- Ripristinare messaggi errore email.

### 2.3 UserMenu & Header (`frontend/src/components/UserMenu.tsx`, `Header.tsx`)
- Ripristinare `email` come prop/display.
- Nel dropdown del menu utente, aggiungere una voce "Impostazioni" che apre il pannello impostazioni.

### 2.4 Pannello Impostazioni Account
- Creare `frontend/src/components/SettingsPanel.tsx`:
  - Titolo "Impostazioni Account".
  - Sezione "GitHub Token":
    - Input password per inserire il nuovo token.
    - Testo esplicativo: "Inserisci il tuo GitHub Personal Access Token per usare il tuo rate limit personale."
    - Bottone "Salva Token".
    - Messaggio di successo/errore.
    - Se il token è già salvato, mostrare un indicatore (es. "Token salvato ✓").
  - Bottone "Chiudi".

### 2.5 App.tsx
- Aggiungere stato `settingsOpen: boolean`.
- Passare `onOpenSettings` al `UserMenu`/`Header`.
- Renderizzare `<SettingsPanel />` quando `settingsOpen` è true.
- Passare `updateToken` dal context al pannello.

---

## 3. Docker Compose Init
- Aggiornare `docker/mysql/init/01-schema.sql`:
  - `email VARCHAR(255) UNIQUE NOT NULL`
  - Aggiungere `github_token TEXT`

---

## 4. README
- Aggiornare sezione auth da username a email.
- Aggiungere nota sul token GitHub per utente.

---

## Ordine di implementazione
1. `docker/mysql/init/01-schema.sql` — schema email + github_token.
2. `backend/src/plugins/auth.ts` — ripristinare email, aggiungere PUT token.
3. `backend/src/services/github.ts` — parametro token opzionale.
4. `backend/src/routes/starred.ts` — leggere token utente e passarlo.
5. `backend/src/routes/random.ts` — idem.
6. `backend/src/routes/search.ts` — idem.
7. `backend/src/routes/hidden-gems.ts` — idem.
8. `backend/src/routes/stats.ts` — idem.
9. `frontend/src/contexts/AuthContext.tsx` — ripristinare email, aggiungere updateToken.
10. `frontend/src/components/AuthModal.tsx` — ripristinare email.
11. `frontend/src/components/UserMenu.tsx` — ripristinare email, aggiungere link impostazioni.
12. `frontend/src/components/Header.tsx` — ripristinare email, aggiungere prop onOpenSettings.
13. `frontend/src/components/SettingsPanel.tsx` — nuovo componente.
14. `frontend/src/App.tsx` — integrare SettingsPanel.
15. `README.md` — aggiornare.
16. Build & test.
