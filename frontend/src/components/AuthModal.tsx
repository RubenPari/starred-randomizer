import { useState, useCallback } from 'react';
import { IconX } from './Icons';
import { handleApiError } from '../utils/format';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
}

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        await onRegister(email, password);
      }
      setEmail('');
      setPassword('');
      onClose();
    } catch (err: unknown) {
      setError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  }, [isLogin, email, password, onLogin, onRegister, onClose]);

  const handleClose = useCallback(() => {
    setError('');
    setEmail('');
    setPassword('');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="bg-surface rounded-xl p-6 border border-surface-3 shadow-xl w-full max-w-sm mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary">
            {isLogin ? 'Accedi' : 'Registrati'}
          </h2>
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
            <label className="block text-sm font-medium text-secondary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-2 border border-surface-3 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition text-sm text-primary"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-2 border border-surface-3 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition text-sm text-primary"
              required
              minLength={8}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            {!isLogin && (
              <p className="text-xs text-muted mt-1">Minimo 8 caratteri</p>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full min-h-[48px] px-5 py-3 bg-gradient-to-r from-brand to-brand-dark text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <span className="spinner" />
            ) : isLogin ? (
              'Accedi'
            ) : (
              'Registrati'
            )}
          </button>
        </form>

        <p className="text-sm text-center text-secondary mt-4">
          {isLogin ? 'Non hai un account? ' : 'Hai giÃ  un account? '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-brand hover:text-brand/80 transition-colors font-medium"
          >
            {isLogin ? 'Registrati' : 'Accedi'}
          </button>
        </p>
      </div>
    </div>
  );
}
