import React from 'react';
import { useI18n } from '../i18n/I18nContext';

function ErrorBoundaryContent({ error, errorInfo }) {
  const { t } = useI18n();
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: 500,
        width: '100%',
        background: '#12121a',
        border: '1px solid #1e1e2e',
        borderRadius: 16,
        padding: '2.5rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: 'rgba(248,113,113,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          fontSize: '2rem'
        }}>
          ⚠️
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          {t('somethingWrong')}
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          {t('unexpectedError')}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          {t('refreshPage')}
        </button>
        {error && (
          <details style={{ marginTop: '1.5rem', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', color: '#64748b', fontSize: '0.85rem' }}>
              {t('errorDetails')}
            </summary>
            <pre style={{
              marginTop: '0.75rem',
              padding: '1rem',
              background: '#0a0a0f',
              borderRadius: 8,
              fontSize: '0.8rem',
              color: '#f87171',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {error.toString()}
              {errorInfo?.componentStack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryContent error={this.state.error} errorInfo={this.state.errorInfo} />
      );
    }

    return this.props.children;
  }
}
