import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { I18nProvider } from './i18n/I18nContext'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <React.StrictMode>
      <BrowserRouter>
        <I18nProvider>
          <AuthProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </AuthProvider>
        </I18nProvider>
      </BrowserRouter>
    </React.StrictMode>
  </ErrorBoundary>
)
