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
