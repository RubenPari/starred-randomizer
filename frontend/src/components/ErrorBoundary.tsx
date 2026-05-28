import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-surface/80 backdrop-blur rounded-xl p-8 border border-red-400/30 shadow-xl max-w-md text-center">
            <h2 className="text-xl font-bold text-red-400 mb-3">Qualcosa è andato storto</h2>
            <p className="text-sm text-muted mb-4">Si è verificato un errore imprevisto. Ricarica la pagina per riprovare.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-brand/10 hover:bg-brand/20 rounded-xl transition-colors font-medium"
            >
              Ricarica pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
