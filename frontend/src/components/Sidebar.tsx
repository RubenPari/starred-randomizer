import type { ReactElement } from 'react';
import { IconDice, IconSearch, IconGem, IconChart, IconHeart, IconSun, IconMoon, IconUser, IconLogout, IconSettings, IconX } from './Icons';

export interface SidebarTab {
  id: string;
  label: string;
  icon: 'randomizer' | 'search' | 'gems' | 'stats' | 'favorites';
}

const TAB_ICONS: Record<SidebarTab['icon'], (props: { className?: string }) => ReactElement> = {
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
