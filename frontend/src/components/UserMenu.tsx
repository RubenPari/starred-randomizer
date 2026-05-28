import { useState, useCallback, useRef, useEffect } from 'react';
import { IconUser, IconLogout } from './Icons';

interface UserMenuProps {
  email: string;
  onLogout: () => void;
}

export default function UserMenu({ email, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = useCallback(async () => {
    await onLogout();
    setOpen(false);
  }, [onLogout]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl bg-surface border border-surface-3 hover:bg-surface-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand/50"
        aria-label="Menu utente"
      >
        <IconUser className="w-5 h-5 text-brand" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-surface-3 rounded-xl shadow-xl overflow-hidden animate-fade-in z-50">
          <div className="p-3 border-b border-surface-3">
            <p className="text-sm font-medium text-primary truncate">{email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-surface-2 transition-colors flex items-center gap-2"
          >
            <IconLogout className="w-4 h-4" />
            Esci
          </button>
        </div>
      )}
    </div>
  );
}
