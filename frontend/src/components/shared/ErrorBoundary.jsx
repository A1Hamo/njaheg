// src/components/shared/ErrorBoundary.jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error boundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'var(--ink)', padding: 24,
        }}>
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-head)', marginBottom: 8, color: 'var(--text)' }}>
              Something went wrong
            </h2>
            <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              {this.state.error?.message || 'An unexpected error occurred. Please refresh the page.'}
            </p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              style={{
                padding: '12px 24px', background: 'var(--primary)', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Reload Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
