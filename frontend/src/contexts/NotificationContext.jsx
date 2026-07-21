import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext(null);

let nextId = 0;

const icons = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />
};

const colors = {
  success: { bg: 'var(--success-bg)', border: 'rgba(52,211,153,0.25)', text: 'var(--success)' },
  error: { bg: 'var(--danger-bg)', border: 'rgba(248,113,113,0.25)', text: 'var(--danger)' },
  warning: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', text: '#fbbf24' },
  info: { bg: 'var(--primary-glow)', border: 'rgba(99,102,241,0.25)', text: 'var(--primary)' }
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const notify = useCallback((type, message, duration) => {
    const id = nextId++;
    setNotifications(prev => [...prev, { id, type, message }]);
    if (duration !== 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration || (type === 'success' ? 4000 : 0));
    }
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const api = {
    success: (msg, dur) => notify('success', msg, dur),
    error: (msg, dur) => notify('error', msg, dur ?? 0),
    warning: (msg, dur) => notify('warning', msg, dur ?? 0),
    info: (msg, dur) => notify('info', msg, dur)
  };

  return (
    <NotificationContext.Provider value={api}>
      {children}
      <div style={{
        position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
        maxWidth: 380, width: '100%', pointerEvents: 'none'
      }}>
        {notifications.map(n => {
          const c = colors[n.type] || colors.info;
          return (
            <div
              key={n.id}
              style={{
                pointerEvents: 'auto',
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '0.85rem 1rem', borderRadius: 12,
                background: c.bg, border: `1px solid ${c.border}`,
                color: c.text, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                animation: 'slideInRight 0.3s ease-out',
                fontWeight: 500, fontSize: '0.9rem', lineHeight: 1.4
              }}
            >
              <div style={{ flexShrink: 0, marginTop: 1 }}>{icons[n.type]}</div>
              <div style={{ flex: 1 }}>{n.message}</div>
              <button
                onClick={() => dismiss(n.id)}
                style={{
                  flexShrink: 0, background: 'none', border: 'none',
                  color: 'inherit', cursor: 'pointer', padding: 2,
                  opacity: 0.6, lineHeight: 1
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  return useContext(NotificationContext);
}
