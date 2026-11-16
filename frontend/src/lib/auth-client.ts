import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  basePath: '/api/auth',
  fetchOptions: { credentials: 'include' },
});

const AUTH_ERRORS: Record<string, string> = {
  INVALID_EMAIL: 'Email non valida',
  INVALID_EMAIL_OR_PASSWORD: 'Email o password non corrette',
  USER_ALREADY_EXISTS: 'Email già registrata',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Email già registrata',
  PASSWORD_TOO_SHORT: 'La password è troppo corta',
  PASSWORD_TOO_LONG: 'La password è troppo lunga',
  INVALID_PASSWORD: 'Password non valida',
  SESSION_EXPIRED: 'Sessione scaduta. Accedi di nuovo.',
  INVALID_ORIGIN: 'Origine della richiesta non consentita',
};

export class AuthActionError extends Error {
  constructor(error: { code?: string; status?: number }) {
    super(error.status === 429
      ? 'Troppi tentativi. Attendi qualche istante e riprova.'
      : AUTH_ERRORS[error.code ?? ''] ?? 'Impossibile completare l’autenticazione. Riprova.');
    this.name = 'AuthActionError';
  }
}
