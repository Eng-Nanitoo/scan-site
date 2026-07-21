import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Html5Qrcode } from 'html5-qrcode';
import { useNotify } from '../contexts/NotificationContext';
import {
  ScanLine,
  LogOut,
  LayoutDashboard,
  User,
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wifi,
  WifiOff,
  CloudOff,
  RefreshCw,
  Camera,
  Loader2
} from 'lucide-react';

const QUEUE_KEY = 'scan_queue';

function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; }
  catch { return []; }
}
function saveQueue(queue) { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); }
function addToQueue(item) {
  const queue = getQueue();
  queue.push({ ...item, queuedAt: Date.now() });
  saveQueue(queue);
  return queue;
}
function clearQueue() { localStorage.removeItem(QUEUE_KEY); }

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stats, setStats] = useState(null);
  const [liveActivity, setLiveActivity] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedScans, setQueuedScans] = useState(getQueue());
  const [syncing, setSyncing] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const html5QrCodeRef = useRef(null);
  const { token, user, logout } = useAuth();
  const notify = useNotify();
  const socket = useSocket();
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/scan/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    return () => stopScanner();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      notify.success('Back online! Syncing queued scans...');
      syncQueuedScans();
    };
    const handleOffline = () => {
      setIsOnline(false);
      notify.warning('You are offline. Scans will be queued.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onCheckIn = (data) => {
      setLiveActivity(data);
      notify.info(`${data.guest_name} checked in`);
      fetchStats();
      setTimeout(() => setLiveActivity(null), 5000);
    };
    socket.on('guest_checked_in', onCheckIn);
    socket.on('stats_updated', fetchStats);
    return () => { socket.off('guest_checked_in', onCheckIn); socket.off('stats_updated', fetchStats); };
  }, [socket]);

  const syncQueuedScans = useCallback(async () => {
    const queue = getQueue();
    if (queue.length === 0) return;
    setSyncing(true);
    let synced = 0, failed = 0;
    for (const item of queue) {
      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ unique_key: item.unique_key })
        });
        if (res.ok) synced++; else failed++;
      } catch { failed++; }
    }
    clearQueue();
    setQueuedScans([]);
    setSyncing(false);
    if (synced > 0) notify.success(`Synced ${synced} queued scan${synced > 1 ? 's' : ''}`);
    if (failed > 0) notify.error(`${failed} scan${failed > 1 ? 's' : ''} failed to sync`);
    fetchStats();
  }, [token]);

  const onScanSuccess = useCallback(async (decodedText) => {
    if (!isOnline) {
      const queue = addToQueue({ unique_key: decodedText });
      setQueuedScans(queue);
      setScanResult({ type: 'warning', message: `Queued for sync (${queue.length} pending)`, icon: <CloudOff size={24} /> });
      notify.info('Scan queued - will sync when online');
      setTimeout(() => setScanResult(null), 3000);
      return;
    }

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ unique_key: decodedText })
      });
      const data = await res.json();

      if (res.ok) {
        setScanResult({ type: 'success', message: `${data.guest_name} checked in!`, icon: <CheckCircle2 size={24} /> });
        notify.success(`${data.guest_name} checked in!`);
      } else if (data.status === 'already_scanned') {
        setScanResult({ type: 'warning', message: `Already scanned: ${data.guest_name}`, icon: <AlertTriangle size={24} /> });
        notify.warning('Card already scanned');
      } else {
        setScanResult({ type: 'error', message: data.error, icon: <XCircle size={24} /> });
        notify.error(data.error);
      }
      setTimeout(() => setScanResult(null), 5000);
    } catch (error) {
      const queue = addToQueue({ unique_key: decodedText });
      setQueuedScans(queue);
      setScanResult({ type: 'warning', message: `Connection failed. Queued (${queue.length} pending)`, icon: <CloudOff size={24} /> });
      notify.info('Scan queued - will sync when online');
      setTimeout(() => setScanResult(null), 3000);
    }
  }, [isOnline, token]);

  const startScanner = async () => {
    setStarting(true);
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, disableFlip: false },
        onScanSuccess,
        () => {}
      );
      setCameraStarted(true);
      setStarting(false);
    } catch (error) {
      console.error('Camera error:', error);
      setStarting(false);
      setCameraStarted(false);
      const msg = error?.message || String(error);
      if (msg.includes('NotAllowedError') || msg.includes('Permission') || msg.includes('permission')) {
        notify.error('Camera permission denied. Please allow camera access in Settings > Safari.');
      } else if (msg.includes('NotFoundError') || msg.includes('not found')) {
        notify.error('No camera found on this device.');
      } else if (msg.includes('NotReadableError') || msg.includes('could not start') || msg.includes('Could not start')) {
        notify.error('Camera is in use by another app. Close other camera apps and try again.');
      } else {
        notify.error('Camera error: ' + msg);
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.stop(); } catch (e) {}
      html5QrCodeRef.current = null;
    }
    setCameraStarted(false);
  };

  const handleLogout = () => { stopScanner(); logout(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, background: 'var(--primary-glow)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <ScanLine size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Scanner Mode</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <User size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              {user?.username}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {user?.role === 'admin' && (
            <button className="btn btn-secondary btn-sm" onClick={() => { stopScanner(); navigate('/'); }}>
              <LayoutDashboard size={14} /> Dashboard
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      <div className="scanner-container" style={{ padding: '2rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1.25rem', borderRadius: 'var(--radius)',
          background: isOnline ? 'var(--success-bg)' : 'var(--danger-bg)',
          border: `1px solid ${isOnline ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
          color: isOnline ? 'var(--success)' : 'var(--danger)',
          marginBottom: '1.5rem', fontWeight: 600, fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
            {isOnline ? 'Connected' : 'Offline Mode'}
          </div>
          {queuedScans.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', background: 'rgba(255,255,255,0.15)' }}>
                {queuedScans.length} queued
              </span>
              {isOnline && (
                <button onClick={syncQueuedScans} disabled={syncing} style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6,
                  padding: '0.3rem 0.6rem', color: 'inherit', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit'
                }}>
                  <RefreshCw size={12} className={syncing ? 'spin' : ''} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              )}
            </div>
          )}
        </div>

        {stats && (
          <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: '1fr' }}>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon green"><CheckCircle2 size={20} /></div>
                <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="live-dot" /> LIVE
                </span>
              </div>
              <div className="stat-value">{stats.scanned}/{stats.total}</div>
              <div className="stat-label">Checked In</div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${stats.percentage}%` }} />
              </div>
            </div>
          </div>
        )}

        {liveActivity && (
          <div style={{
            background: 'var(--success-bg)', border: '1px solid rgba(52,211,153,0.2)',
            color: 'var(--success)', padding: '1rem 1.5rem', borderRadius: 'var(--radius)',
            marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
            animation: 'slideIn 0.3s'
          }}>
            <Bell size={18} />
            <span><strong>{liveActivity.guest_name}</strong> checked in by {liveActivity.scanned_by}</span>
          </div>
        )}

        <div className="scanner-box">
          <div id="qr-reader" style={{ display: (cameraStarted || starting) ? 'block' : 'none', width: '100%', minHeight: 300 }} />

          {!cameraStarted && !starting && (
            <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              {starting ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <Loader2 size={48} className="spin" style={{ color: 'var(--primary)' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Starting camera...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: 20, background: 'var(--primary-glow)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
                  }}>
                    <Camera size={36} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Ready to Scan</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Tap the button below to start your camera
                    </p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={startScanner}
                    style={{ width: 'auto', padding: '1rem 2rem', fontSize: '1rem' }}
                  >
                    <Camera size={18} /> Start Camera
                  </button>

                  <div style={{
                    width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem'
                  }}>
                    <div style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem'
                    }}>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>or enter code manually</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (manualCode.trim()) {
                          onScanSuccess(manualCode.trim());
                          setManualCode('');
                        }
                      }}
                      style={{ width: '100%', display: 'flex', gap: '0.5rem' }}
                    >
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="Type or paste invitation code"
                        style={{
                          flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--radius)',
                          border: '1px solid var(--border)', background: 'var(--bg)',
                          color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'monospace',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!manualCode.trim()}
                        style={{ width: 'auto', padding: '0.75rem 1.25rem', fontSize: '0.9rem', opacity: manualCode.trim() ? 1 : 0.5 }}
                      >
                        Submit
                      </button>
                    </form>
                  </div>

                  <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', maxWidth: 280 }}>
                    Camera requires HTTPS on iOS. Use manual entry as a fallback.
                  </p>
                </div>
              )}
            </div>
          )}

          {scanResult && (
            <div className={`scanner-result ${scanResult.type}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                {scanResult.icon}
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{scanResult.message}</h3>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {cameraStarted ? 'Point your camera at a QR code to scan' : 'Start camera or enter code manually above'}
        </div>
      </div>
    </div>
  );
}
