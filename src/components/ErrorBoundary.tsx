import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '0 var(--page-pad)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: 'var(--ink)' }}>
            Something went wrong
          </div>
          <p style={{ color: 'var(--ink-soft)', maxWidth: 420, lineHeight: 1.7 }}>
            An unexpected error interrupted this page. Please try reloading — your cart and wishlist are safe.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}