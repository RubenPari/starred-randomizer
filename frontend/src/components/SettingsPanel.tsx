import { useState, useCallback } from 'react';
import { IconX } from './Icons';
import { handleApiError } from '../utils/format';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToken: (token: string) => Promise<void>;
}

export default function SettingsPanel({ isOpen, onClose, onSaveToken }: SettingsPanelProps) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await onSaveToken(token);
      setSuccess('Token GitHub salvato con successo');
      setToken('');
    } catch (err: unknown) {
      setError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  }, [token, onSaveToken]);

  const handleClose = useCallback(() => {
    setError('');
    setSuccess('');
    setToken('');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="bg-surface rounded-xl p-6 border border-surface-3 shadow-xl w-full max-w-md mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary">Impostazioni Account</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors text-muted"
            aria-label="Chiudi"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">GitHub Personal Access Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full bg-surface-2 border border-surface-3 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition text-sm text-primary"
              autoComplete="off"
            />
            <p className="text-xs text-muted mt-1">
              Inserisci il tuo token per usare il tuo rate limit personale di GitHub. Se lasciato vuoto, verrà usato il token globale dell'applicazione.
            </p>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          {success && (
            <p className="text-green-400 text-sm text-center">{success}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] px-5 py-3 bg-gradient-to-r from-brand to-brand-dark text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <span className="spinner" />
            ) : (
              'Salva Token'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
