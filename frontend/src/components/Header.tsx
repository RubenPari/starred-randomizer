import { useState, useCallback } from 'react';
import { IconDice, IconSun, IconMoon, IconUser, IconLogout, IconSettings } from './Icons';

interface HeaderProps {
  darkMode: boolean;
  toggleTheme: () => void;
  username: string;
  onUsernameChange: (username: string) => void;
  isAuthenticated: boolean;
  onAuthClick: () => void;
  onLogout: () => void;
  userEmail: string | null;
  onOpenSettings: () => void;
}

export default function Header({ darkMode, toggleTheme, username, onUsernameChange, isAuthenticated, onAuthClick, onLogout, userEmail, onOpenSettings }: HeaderProps) {
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
    <header className="text-center animate-fade-in">
      <div className="flex items-center justify-end gap-2 mb-3">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-surface border border-surface-3 hover:bg-surface-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand/50"
          aria-label={darkMode ? 'Attiva tema chiaro' : 'Attiva tema scuro'}
        >
          {darkMode ? (
            <IconSun className="w-5 h-5 text-star" />
          ) : (
            <IconMoon className="w-5 h-5 text-brand" />
          )}
        </button>
        {isAuthenticated ? (
          <>
            <div className="relative group">
              <button
                className="p-2.5 rounded-xl bg-surface border border-surface-3 hover:bg-surface-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand/50"
                onClick={onOpenSettings}
                aria-label={`Impostazioni account ${userEmail}`}
                title={userEmail ?? ''}
              >
                <IconSettings className="w-5 h-5 text-brand" />
              </button>
              <span className="absolute right-0 top-full mt-1 px-2 py-1 bg-surface border border-surface-3 rounded text-xs text-muted whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {userEmail}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="p-2.5 rounded-xl bg-surface border border-surface-3 hover:bg-surface-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand/50"
              aria-label="Esci"
            >
              <IconLogout className="w-5 h-5 text-red-400" />
            </button>
          </>
        ) : (
          <button
            onClick={onAuthClick}
            className="p-2.5 rounded-xl bg-surface border border-surface-3 hover:bg-surface-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand/50"
            aria-label="Accedi o registrati"
          >
            <IconUser className="w-5 h-5 text-muted hover:text-brand transition-colors" />
          </button>
        )}
      </div>
      <div className="flex items-center justify-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-brand to-accent shadow-lg">
          <IconDice className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
          GitHub Starred Randomizer
        </h1>
      </div>
      <p className="text-sm sm:text-base text-muted mb-4">
        Esplora e scopri casualmente i repository GitHub che hai salvato tra i preferiti
      </p>
      <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
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
          className="px-4 py-2 bg-brand/10 hover:bg-brand/20 disabled:opacity-50 disabled:hover:bg-brand/10 rounded-lg transition-colors text-sm font-medium text-brand min-h-[40px]"
        >
          Applica
        </button>
      </div>
    </header>
  );
}
