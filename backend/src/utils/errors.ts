export function getGithubErrorMessage(status: number): string {
  switch (status) {
    case 404:
      return 'Username non trovato su GitHub';
    case 401:
      return 'Token GitHub non valido o scaduto';
    case 403:
      return 'Accesso negato. Verifica il token GitHub o i limiti di rate';
    case 422:
      return 'Username non valido per GitHub';
    default:
      if (status >= 500) return 'Errore server GitHub. Riprova più tardi';
      return `Errore GitHub API (${status})`;
  }
}
