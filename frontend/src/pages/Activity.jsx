import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useI18n } from '../i18n/I18nContext';
import {
  Activity as ActivityIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  ScanLine,
  LogIn,
  LogOut
} from 'lucide-react';

function ActivitySkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 6 }} />
            <div className="skeleton" style={{ width: '25%', height: 12 }} />
          </div>
          <div className="skeleton" style={{ width: 70, height: 24, borderRadius: 12, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

export default function Activity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const socket = useSocket();
  const { t } = useI18n();

  useEffect(() => { fetchActivities(); }, []);

  useEffect(() => {
    if (!socket) return;

    const handleActivity = (data) => {
      setActivities((prev) => [data, ...prev].slice(0, 200));
    };

    socket.on('activity', handleActivity);
    return () => socket.off('activity', handleActivity);
  }, [socket]);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/scan/activity?limit=200', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setActivities(data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'check_in': return <CheckCircle2 size={18} />;
      case 'scan_duplicate': return <AlertTriangle size={18} />;
      case 'scan_failed': return <XCircle size={18} />;
      case 'scanner_online': return <LogIn size={18} />;
      case 'scanner_offline': return <LogOut size={18} />;
      default: return <ScanLine size={18} />;
    }
  };

  const getActionClass = (action) => {
    switch (action) {
      case 'check_in': return 'check-in';
      case 'scan_duplicate': return 'duplicate';
      case 'scan_failed': return 'failed';
      case 'scanner_online': return 'online';
      case 'scanner_offline': return 'offline';
      default: return 'check-in';
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'check_in': return t('checkInAction');
      case 'scan_duplicate': return t('duplicate');
      case 'scan_failed': return t('failed');
      case 'scanner_online': return t('online');
      case 'scanner_offline': return t('offline');
      default: return action;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return t('justNow');
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('liveActivity')}</h1>
        <p>{t('activityDesc')}</p>
      </div>

      <div className="recent-scans">
        <div className="section-header activity-header-row">
          <div className="section-icon">
            <ActivityIcon size={18} />
          </div>
          <h3>{t('activityStream')}</h3>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="live-dot" />
            <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>{t('live')}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchActivities} style={{ marginLeft: '0.5rem' }}>
            <RefreshCw size={14} /> {t('refresh')}
          </button>
        </div>

        {loading ? (
          <ActivitySkeleton />
        ) : activities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><ActivityIcon size={28} /></div>
            <p>{t('noActivityYet')}</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {t('noActivityDesc')}
            </p>
          </div>
        ) : (
          <div className="activity-list">
            {activities.map((item, i) => (
              <div className="activity-item" key={item.id || i}>
                <div className={`activity-icon ${getActionClass(item.action)}`}>
                  {getActionIcon(item.action)}
                </div>
                <div className="activity-content">
                  <div className="activity-text">
                    <strong>{item.username}</strong>
                    {item.action === 'check_in' && (
                      <> {t('checkedInText')} <strong>{item.guest_name}</strong></>
                    )}
                    {item.action === 'scan_duplicate' && (
                      <> {t('duplicateScanFor')} <strong>{item.guest_name}</strong></>
                    )}
                    {item.action === 'scan_failed' && (
                      <> {t('scannedUnknownQR')}</>
                    )}
                    {item.action === 'scanner_online' && (
                      <span style={{ color: 'var(--success)' }}> {t('connectedAsScanner')}</span>
                    )}
                    {item.action === 'scanner_offline' && (
                      <span style={{ color: 'var(--text-muted)' }}> {t('disconnected')}</span>
                    )}
                  </div>
                  <div className="activity-time">
                    <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                    {formatTime(item.created_at)}
                  </div>
                </div>
                <span className={`activity-badge ${getActionClass(item.action)}`}>
                  {getActionLabel(item.action)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
