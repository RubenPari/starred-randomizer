export function formatStars(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export function timeAgo(dateString: string, short = false): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (short) {
    if (seconds < 60) return 'ora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}g`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}m`;
    return `${Math.floor(seconds / 31536000)}a`;
  }

  if (seconds < 60) return 'meno di un minuto fa';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minuti fa`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ore fa`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} giorni fa`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} mesi fa`;
  return `${Math.floor(seconds / 31536000)} anni fa`;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export function handleApiError(err: unknown): string {
  const error = err as { response?: { data?: { error?: string } }; code?: string };
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.code === 'ERR_NETWORK') {
    return 'Impossibile connettersi al server. Verifica che il backend sia attivo.';
  }
  return 'Errore imprevisto. Riprova.';
}
