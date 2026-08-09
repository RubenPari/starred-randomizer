# UI Redesign Sunset Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the frontend's visual identity (new "sunset" orange/pink palette) and navigation (sidebar instead of horizontal tabs), with the ResultCard/ShuffleAnimation reveal as the most polished moment.

**Architecture:** Pure frontend visual/layout change. `App.tsx` moves from a single centered column to a `flex` layout with a new `Sidebar` component + main content area. Color tokens in `index.css` are swapped from violet/cyan to orange/pink; because every component already consumes semantic Tailwind classes (`bg-brand`, `text-accent`, etc.) rather than hardcoded hex values, most components inherit the new palette without changes. No backend, hook, type, or data-flow changes.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 (CSS custom properties via `@theme`), Vite 7. No new dependencies. No test framework in this project — verification is `npm run build` (tsc + vite build), `npm run lint`, and manual visual check in the dev server.

## Global Constraints

- No new npm dependencies (spec: "Nessuna nuova dipendenza")
- No changes to `backend/`, hooks (`useStarredRepos`, `useRandomRepo`, `useFavorites`, `useTheme`), contexts, or `types.ts` (spec: "Cosa NON cambia")
- No router introduced; keep existing `activeTab` state in `App.tsx` as the source of truth for which panel renders
- Italian-language UI copy stays Italian, matching existing strings
- Every task must end with `npm run build` and `npm run lint` passing with zero errors in `frontend/`

---

## Task 1: Sunset color tokens

**Files:**
- Modify: `frontend/src/index.css:21-59`

**Interfaces:**
- Produces: same CSS custom property names as before (`--color-brand`, `--color-brand-dark`, `--color-surface`, `--color-surface-2`, `--color-surface-3`, `--color-accent`, `--color-star`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border-color`, `--border-accent`, `--bg-gradient`, `--spinner-border`, `--spinner-top`, `--skeleton-base`, `--skeleton-shine`), only the values change. No consumer needs to change.

- [ ] **Step 1: Replace the `:root` (light) token values**

In `frontend/src/index.css`, replace lines 21-39 with:

```css
:root {
  --color-brand: #f97316;
  --color-brand-dark: #ea580c;
  --color-surface: #ffffff;
  --color-surface-2: #f7f4f1;
  --color-surface-3: #ede4dd;
  --color-accent: #ec4899;
  --color-star: #d97706;
  --text-primary: #1f1512;
  --text-secondary: #57443c;
  --text-muted: #8a7369;
  --border-color: #ede4dd;
  --border-accent: rgba(249, 115, 22, 0.3);
  --bg-gradient: linear-gradient(135deg, #fff7ed 0%, #ffedf3 50%, #fce7f3 100%);
  --spinner-border: rgba(0, 0, 0, 0.15);
  --spinner-top: var(--color-brand);
  --skeleton-base: #ede4dd;
  --skeleton-shine: #f7f4f1;
}
```

- [ ] **Step 2: Replace the `:root.dark` token values**

Replace lines 41-59 (the old `:root.dark` block) with:

```css
:root.dark {
  --color-brand: #fb923c;
  --color-brand-dark: #f97316;
  --color-surface: #201412;
  --color-surface-2: #2b1c18;
  --color-surface-3: #3a2621;
  --color-accent: #f472b6;
  --color-star: #fbbf24;
  --text-primary: #fdf4ee;
  --text-secondary: #e0c9bd;
  --text-muted: #b39a8e;
  --border-color: #3a2621;
  --border-accent: rgba(251, 146, 60, 0.3);
  --bg-gradient: linear-gradient(135deg, #1a0f0d 0%, #2b1418 50%, #2e1024 100%);
  --spinner-border: rgba(255, 255, 255, 0.3);
  --spinner-top: white;
  --skeleton-base: #2b1c18;
  --skeleton-shine: #3a2621;
}
```

- [ ] **Step 3: Update the `glow-pulse` keyframe color to match**

In the same file, find the `@keyframes glow-pulse` block (originally lines 98-101) and replace the hardcoded violet rgba with the orange brand color:

```css
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.25); }
  50% { box-shadow: 0 0 0 8px rgba(249, 115, 22, 0); }
}
```

- [ ] **Step 4: Verify build**

Run: `cd frontend && npm run build && npm run lint`
Expected: both succeed with no errors (pure CSS value changes, no code touched).

- [ ] **Step 5: Manual visual check**

Run: `cd frontend && npm run dev`, open the app, toggle dark/light theme. Confirm backgrounds, buttons, and text now render in orange/pink tones in both themes, with readable contrast.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: switch color tokens to sunset orange/pink palette"
```

---

## Task 2: Add hamburger menu icon

**Files:**
- Modify: `frontend/src/components/Icons.tsx`

**Interfaces:**
- Produces: `IconMenu(props: IconProps): JSX.Element` — exported function component, same shape as every other icon in this file (uses `defaultProps`/`spreadProps` helpers already defined at the top of the file).

- [ ] **Step 1: Add the `IconMenu` component**

Append to the end of `frontend/src/components/Icons.tsx`:

```tsx
export function IconMenu(props: IconProps) {
  const p = { ...defaultProps('w-5 h-5'), ...props };
  return (
    <svg {...spreadProps(p)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build && npm run lint`
Expected: both succeed (new exported function, no other file references it yet, so no unused-import errors are possible — only a new unused-export, which TypeScript/ESLint don't flag).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Icons.tsx
git commit -m "feat: add hamburger menu icon"
```

---

## Task 3: Sidebar component

**Files:**
- Create: `frontend/src/components/Sidebar.tsx`

**Interfaces:**
- Consumes: a `tabs` array of `{ id: string; label: string }` (same shape as the `tabs` array currently built in `App.tsx:177-183`), the current `activeTab` string, a `setActiveTab` callback, plus everything `Header.tsx` currently needs for the user/theme controls (`darkMode`, `toggleTheme`, `isAuthenticated`, `onAuthClick`, `onLogout`, `userEmail`, `onOpenSettings`) since those move from `Header` into the sidebar footer.
- Produces: `Sidebar(props: SidebarProps): JSX.Element` default export. Renders a `<nav>` fixed to the left on desktop; on mobile renders as an overlay drawer controlled by `open`/`onClose` props. Emits `onSelectTab(id: string)` when a nav item is clicked (closes the drawer on mobile automatically via calling `onClose`).

- [ ] **Step 1: Write the component**

Create `frontend/src/components/Sidebar.tsx`:

```tsx
import { IconDice, IconSearch, IconGem, IconChart, IconHeart, IconSun, IconMoon, IconUser, IconLogout, IconSettings, IconX } from './Icons';

export interface SidebarTab {
  id: string;
  label: string;
  icon: 'randomizer' | 'search' | 'gems' | 'stats' | 'favorites';
}

const TAB_ICONS: Record<SidebarTab['icon'], (props: { className?: string }) => JSX.Element> = {
  randomizer: IconDice,
  search: IconSearch,
  gems: IconGem,
  stats: IconChart,
  favorites: IconHeart,
};

interface SidebarProps {
  tabs: SidebarTab[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  open: boolean;
  onClose: () => void;
  darkMode: boolean;
  toggleTheme: () => void;
  isAuthenticated: boolean;
  onAuthClick: () => void;
  onLogout: () => void;
  userEmail: string | null;
  onOpenSettings: () => void;
}

export default function Sidebar({
  tabs,
  activeTab,
  onSelectTab,
  open,
  onClose,
  darkMode,
  toggleTheme,
  isAuthenticated,
  onAuthClick,
  onLogout,
  userEmail,
  onOpenSettings,
}: SidebarProps) {
  const handleSelect = (id: string) => {
    onSelectTab(id);
    onClose();
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-surface border-r border-surface-3 flex flex-col z-50 transition-transform md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand to-accent shadow-lg">
              <IconDice className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-primary text-sm leading-tight">
              Starred<br />Randomizer
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-2 md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Chiudi menu"
          >
            <IconX className="w-5 h-5 text-muted" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = TAB_ICONS[tab.icon];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelect(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  isActive ? 'bg-brand/15 text-brand' : 'text-secondary hover:bg-surface-2'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-surface-3 space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-secondary hover:bg-surface-2 transition-colors min-h-[44px]"
            aria-label={darkMode ? 'Attiva tema chiaro' : 'Attiva tema scuro'}
          >
            {darkMode ? <IconSun className="w-4 h-4 text-star" /> : <IconMoon className="w-4 h-4 text-brand" />}
            {darkMode ? 'Tema chiaro' : 'Tema scuro'}
          </button>
          {isAuthenticated ? (
            <>
              <button
                onClick={onOpenSettings}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-secondary hover:bg-surface-2 transition-colors min-h-[44px]"
                title={userEmail ?? ''}
              >
                <IconSettings className="w-4 h-4 text-brand" />
                <span className="truncate">{userEmail ?? 'Impostazioni'}</span>
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-secondary hover:bg-surface-2 transition-colors min-h-[44px]"
              >
                <IconLogout className="w-4 h-4 text-red-400" />
                Esci
              </button>
            </>
          ) : (
            <button
              onClick={onAuthClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-secondary hover:bg-surface-2 transition-colors min-h-[44px]"
            >
              <IconUser className="w-4 h-4" />
              Accedi
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build && npm run lint`
Expected: succeeds. `Sidebar.tsx` is not imported anywhere yet, so it must compile standalone with no type errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Sidebar.tsx
git commit -m "feat: add Sidebar component"
```

---

## Task 4: Wire Sidebar into App layout, simplify Header

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Header.tsx`

**Interfaces:**
- Consumes: `Sidebar` from Task 3 (`SidebarTab[]`, `activeTab`, `onSelectTab`, `open`, `onClose`, plus the theme/auth props).
- Produces: `App.tsx` now renders `<div className="flex">`, with `<Sidebar>` followed by a `<main>` content column that contains everything currently inside the `max-w-2xl mx-auto` wrapper (App.tsx:194-368) except the tab bar (App.tsx:236-252, removed) and the username-entry/theme/auth parts of `Header` (those move to `Sidebar`/a slimmer top bar).

- [ ] **Step 1: Slim down `Header.tsx` to just the username input + mobile menu trigger**

Replace the full content of `frontend/src/components/Header.tsx` with:

```tsx
import { useState, useCallback } from 'react';
import { IconMenu } from './Icons';

interface HeaderProps {
  username: string;
  onUsernameChange: (username: string) => void;
  onOpenSidebar: () => void;
}

export default function Header({ username, onUsernameChange, onOpenSidebar }: HeaderProps) {
  const [inputValue, setInputValue] = useState(username);

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed && trimmed !== username) {
      onUsernameChange(trimmed);
    }
  }, [inputValue, username, onUsernameChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <header className="flex items-center gap-3 animate-fade-in mb-2">
      <button
        onClick={onOpenSidebar}
        className="p-2.5 rounded-xl bg-surface border border-surface-3 hover:bg-surface-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center md:hidden focus:outline-none focus:ring-2 focus:ring-brand/50"
        aria-label="Apri menu"
      >
        <IconMenu className="w-5 h-5 text-brand" />
      </button>
      <div className="flex items-center gap-2 flex-1 max-w-xs">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Username GitHub"
          className="flex-1 bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition text-primary"
          aria-label="Username GitHub"
        />
        <button
          onClick={handleSubmit}
          disabled={inputValue.trim() === username || !inputValue.trim()}
          className="px-4 py-2 bg-brand/10 hover:bg-brand/20 disabled:opacity-50 disabled:hover:bg-brand/10 rounded-lg transition-colors text-sm font-medium text-brand min-h-[40px] whitespace-nowrap"
        >
          Applica
        </button>
      </div>
    </header>
  );
}
```

(The old title/tagline block, theme toggle, and auth/settings buttons are removed from `Header` — title moves into `Sidebar`'s brand block from Task 3, theme/auth/settings moved into `Sidebar`'s footer.)

- [ ] **Step 2: Update `App.tsx` imports and tab data**

In `frontend/src/App.tsx`, add the import:

```tsx
import Sidebar from './components/Sidebar';
import type { SidebarTab } from './components/Sidebar';
```

Replace the `tabs` array (App.tsx:177-183) with:

```tsx
const tabs: SidebarTab[] = [
  { id: 'randomizer', label: 'Randomizer', icon: 'randomizer' },
  { id: 'search', label: 'Cerca', icon: 'search' },
  { id: 'gems', label: 'Hidden Gems', icon: 'gems' },
  { id: 'stats', label: 'Statistiche', icon: 'stats' },
  { id: 'favorites', label: `Preferiti (${favorites.length})`, icon: 'favorites' },
];
```

- [ ] **Step 3: Add sidebar-open state**

Near the other `useState` declarations in `AppContent` (around App.tsx:43-44), add:

```tsx
const [sidebarOpen, setSidebarOpen] = useState(false);
```

- [ ] **Step 4: Replace the root layout and remove the old tab bar**

Replace the return block's outer structure (App.tsx:193-368). The new structure wraps everything in a flex row with `Sidebar` first, then a `<main>` that holds the old `max-w-2xl mx-auto space-y-5` column (minus `Header`'s removed props and minus the old tab-bar block at App.tsx:236-252):

```tsx
return (
  <div className="flex min-h-screen">
    <Sidebar
      tabs={tabs}
      activeTab={activeTab}
      onSelectTab={(id) => setActiveTab(id as typeof activeTab)}
      open={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      darkMode={darkMode}
      toggleTheme={toggleTheme}
      isAuthenticated={!!user}
      onAuthClick={() => setAuthModalOpen(true)}
      onLogout={logout}
      userEmail={user?.email ?? null}
      onOpenSettings={() => setSettingsOpen(true)}
    />
    <main className="flex-1 p-4 sm:p-6 md:p-8 min-w-0">
      <div className="max-w-2xl mx-auto space-y-5">
        <Header
          username={username}
          onUsernameChange={setUsername}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        {/* ...everything from the old repos-loading block through the footer stays here unchanged, EXCEPT the tab-bar block (old App.tsx:236-252) which is deleted... */}
      </div>
    </main>

    <AuthModal
      isOpen={authModalOpen}
      onClose={() => setAuthModalOpen(false)}
      onLogin={login}
      onRegister={register}
    />

    <SettingsPanel
      isOpen={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      onSaveToken={updateToken}
    />
  </div>
);
```

Concretely: keep the JSX for the "Carica Starred" card, `StatisticsPanel`, the `activeTab === '...'` conditional blocks, and the footer exactly as they are today (App.tsx:208-347, App.tsx:349-366) inside the new `<div className="max-w-2xl mx-auto space-y-5">` wrapper — only delete the tab-bar `<div className="flex gap-2 overflow-x-auto pb-2">...</div>` block (old App.tsx:236-252) since navigation now lives in `Sidebar`. Move `AuthModal` and `SettingsPanel` outside `<main>` as siblings of `Sidebar` (shown above) since they're modals, not part of the content column.

- [ ] **Step 5: Verify build**

Run: `cd frontend && npm run build && npm run lint`
Expected: both succeed with no TypeScript errors (no leftover references to removed `Header` props like `darkMode`, `toggleTheme`, `isAuthenticated`, etc.).

- [ ] **Step 6: Manual visual check**

Run: `cd frontend && npm run dev`. Confirm:
- Desktop width (≥768px): sidebar visible on the left, no hamburger button, clicking nav items switches `activeTab` content.
- Mobile width (<768px, via devtools responsive mode): sidebar hidden by default, hamburger button in the header opens it as an overlay drawer, clicking a nav item or the backdrop closes it.
- Theme toggle, login/logout, and settings buttons (now in the sidebar footer) still work.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/App.tsx frontend/src/components/Header.tsx
git commit -m "refactor: replace horizontal tab bar with Sidebar layout"
```

---

## Task 5: Polish ResultCard reveal

**Files:**
- Modify: `frontend/src/components/ResultCard.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- No prop/type changes — `ResultCardProps` stays identical. Purely visual/class changes plus one new CSS animation.

- [ ] **Step 1: Add a "pop" keyframe and class to `index.css`**

Add near the other keyframes in `frontend/src/index.css` (after the `scale-in` keyframe block):

```css
@keyframes pop-in {
  0% { opacity: 0; transform: scale(0.85) translateY(6px); }
  60% { opacity: 1; transform: scale(1.03) translateY(0); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.animate-pop-in {
  animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (prefers-reduced-motion: reduce) {
  .animate-pop-in {
    animation: none !important;
  }
}
```

- [ ] **Step 2: Use the new animation and sunset gradient border on `ResultCard`**

In `frontend/src/components/ResultCard.tsx`, replace the outer `<div>` className (line 20):

```tsx
className="bg-surface/80 backdrop-blur rounded-xl border-2 border-transparent bg-clip-padding shadow-xl animate-pop-in animate-glow-pulse [background-image:linear-gradient(var(--color-surface),var(--color-surface)),linear-gradient(135deg,var(--color-brand),var(--color-accent))] [background-origin:border-box] [background-clip:padding-box,border-box]"
```

And give the reroll icon a hover spin — replace the `IconRefresh` usage (line 48):

```tsx
<IconRefresh className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
```

adding `group` to that button's className (line 45, append ` group` to the existing class string).

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build && npm run lint`
Expected: both succeed.

- [ ] **Step 4: Manual visual check**

Run: `cd frontend && npm run dev`, load starred repos, click "Estrai Random". Confirm the ResultCard pops in with a spring-like bounce and shows a sunset gradient border; hovering the reroll button spins its icon.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ResultCard.tsx frontend/src/index.css
git commit -m "style: polish ResultCard reveal animation and gradient border"
```

---

## Task 6: Slot-machine ShuffleAnimation

**Files:**
- Modify: `frontend/src/components/ShuffleAnimation.tsx`

**Interfaces:**
- No prop changes — `ShuffleAnimationProps` (`{ filteredRepos: Repo[] }`) stays identical. Internal rendering changes to show a vertically-scrolling stack of names instead of a single swapping name.

- [ ] **Step 1: Rewrite the component to render a scrolling stack**

Replace the full content of `frontend/src/components/ShuffleAnimation.tsx`:

```tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import type { Repo } from '../types';
import LanguageBadge from './LanguageBadge';
import { IconStar } from './Icons';
import { formatStars } from '../utils/format';

const SHUFFLE_COUNT = 10;
const SHUFFLE_INTERVAL = 90;
const SHUFFLE_FINAL_DELAY = 250;
const TRAIL_LENGTH = 4;

interface ShuffleAnimationProps {
  filteredRepos: Repo[];
}

export default function ShuffleAnimation({ filteredRepos }: ShuffleAnimationProps) {
  const [trail, setTrail] = useState<Repo[]>([]);
  const [settled, setSettled] = useState(false);
  const cancelledRef = useRef(false);

  const runShuffle = useCallback(async () => {
    if (filteredRepos.length === 0) return;
    cancelledRef.current = false;
    setSettled(false);

    const randomIndex = Math.floor(Math.random() * filteredRepos.length);
    const finalRepo = filteredRepos[randomIndex];

    for (let i = 0; i < SHUFFLE_COUNT; i++) {
      if (cancelledRef.current) return;
      const idx = Math.floor(Math.random() * filteredRepos.length);
      setTrail((prev) => [filteredRepos[idx], ...prev].slice(0, TRAIL_LENGTH));
      await new Promise((resolve) => setTimeout(resolve, SHUFFLE_INTERVAL));
    }

    if (cancelledRef.current) return;
    setTrail((prev) => [finalRepo, ...prev].slice(0, TRAIL_LENGTH));
    setSettled(true);
    await new Promise((resolve) => setTimeout(resolve, SHUFFLE_FINAL_DELAY));
  }, [filteredRepos]);

  useEffect(() => {
    runShuffle();
    return () => {
      cancelledRef.current = true;
    };
  }, [runShuffle]);

  if (trail.length === 0) return null;

  const [current, ...rest] = trail;

  return (
    <div className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-brand/30 shadow-lg overflow-hidden">
      <div className="flex items-center gap-3 mb-3">
        <span className="spinner" />
        <span className="text-sm font-medium text-muted">
          {settled ? 'Estratto!' : 'Selezione in corso...'}
        </span>
      </div>
      <div className="relative">
        <div key={current.full_name + trail.length} className="animate-fade-in">
          <h3 className="text-lg font-bold mb-1 text-primary">{current.full_name}</h3>
          <div className="flex items-center gap-3">
            <LanguageBadge language={current.language} />
            <span className="flex items-center gap-1 text-sm font-medium text-star">
              <IconStar className="w-3.5 h-3.5" />
              {formatStars(current.stargazers_count)}
            </span>
          </div>
        </div>
        {!settled && rest.length > 0 && (
          <div className="mt-2 space-y-1 opacity-40">
            {rest.map((repo, i) => (
              <p
                key={repo.full_name + i}
                className="text-xs text-muted truncate"
                style={{ opacity: 1 - i * 0.22 }}
              >
                {repo.full_name}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build && npm run lint`
Expected: both succeed.

- [ ] **Step 3: Manual visual check**

Run: `cd frontend && npm run dev`, load starred repos, click "Estrai Random" a few times. Confirm a short trail of recently-shown repo names appears faded beneath the current name while shuffling, then settles on the final pick and shows "Estratto!".

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ShuffleAnimation.tsx
git commit -m "feat: slot-machine trail effect for ShuffleAnimation"
```

---

## Task 7: Uniform card/shadow polish across remaining panels

**Files:**
- Modify: `frontend/src/components/FilterPanel.tsx`
- Modify: `frontend/src/components/SearchPanel.tsx`
- Modify: `frontend/src/components/HiddenGems.tsx`
- Modify: `frontend/src/components/StatsDashboard.tsx`
- Modify: `frontend/src/components/FavoritesPanel.tsx`
- Modify: `frontend/src/components/HistoryPanel.tsx`

**Interfaces:**
- No prop/type changes anywhere in this task — className-only edits.

- [ ] **Step 1: Grep for grey/neutral shadow utilities to replace**

Run: `cd frontend/src && grep -rn "shadow-lg\|shadow-xl\|shadow-md" components/FilterPanel.tsx components/SearchPanel.tsx components/HiddenGems.tsx components/StatsDashboard.tsx components/FavoritesPanel.tsx components/HistoryPanel.tsx`

For each match found, if the element does not already have a `border-brand/30` or similar brand-tinted border, add `hover:shadow-brand/10` (or keep as-is if it already uses semantic tokens — many already do via `border-surface-3`, which auto-updates from Task 1's token change). This step is a manual pass: open each file, and wherever a card container uses `shadow-lg`/`shadow-xl` with a plain `border-surface-3`, change the border to `border-brand/20` for slightly warmer, on-brand edges, e.g.:

```tsx
className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-surface-3/50 shadow-lg ..."
```

becomes:

```tsx
className="bg-surface/80 backdrop-blur rounded-xl p-5 border border-brand/15 shadow-lg hover:shadow-brand/10 ..."
```

Apply this same border/shadow tweak consistently to the top-level card container in each of the six files listed above. Do not change any other structure, copy, or logic in these files.

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build && npm run lint`
Expected: both succeed (className-only changes).

- [ ] **Step 3: Manual visual check**

Run: `cd frontend && npm run dev`. Visit each of the five tabs (Randomizer's FilterPanel, Cerca, Hidden Gems, Statistiche, Preferiti) plus the history panel on the Randomizer tab. Confirm all cards now show a subtle warm-tinted border consistent with the sunset palette, in both light and dark themes.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/FilterPanel.tsx frontend/src/components/SearchPanel.tsx frontend/src/components/HiddenGems.tsx frontend/src/components/StatsDashboard.tsx frontend/src/components/FavoritesPanel.tsx frontend/src/components/HistoryPanel.tsx
git commit -m "style: apply consistent sunset-tinted card borders across panels"
```

---

## Task 8: Final end-to-end check

**Files:** none (verification-only task)

**Interfaces:** none

- [ ] **Step 1: Full build**

Run: `cd frontend && npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 2: Full lint**

Run: `cd frontend && npm run lint`
Expected: no errors.

- [ ] **Step 3: Full manual walkthrough**

Run: `cd frontend && npm run dev` (and `cd backend && npm run dev` in another terminal so data loads). In the browser:
1. Load starred repos for the default username.
2. Desktop width: sidebar present, all 5 tabs reachable and switching content correctly.
3. Mobile width (devtools responsive): hamburger opens/closes sidebar drawer correctly.
4. Toggle dark/light theme: sunset palette renders correctly in both.
5. Apply a filter, click "Estrai Random": shuffle trail animation plays, ResultCard pops in with gradient border, reroll button spins its icon on hover, favorite toggle works.
6. Visit Cerca, Hidden Gems, Statistiche, Preferiti: each panel loads and displays data with the new card styling.
7. Login/logout and settings modal still open/close correctly from the sidebar footer.

- [ ] **Step 4: Commit (only if Step 3 surfaced fixes)**

If any issues were found and fixed during the walkthrough, commit them individually with descriptive messages. If everything already works from prior task commits, no commit is needed here.
