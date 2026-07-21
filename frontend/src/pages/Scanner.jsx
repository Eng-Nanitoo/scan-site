import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Html5Qrcode } from 'html5-qrcode';
import { getCardByKey, markCardScannedLocally, getCardsCount } from '../lib/offlineDb';
import { syncCardsFromServer, syncQueuedScans, syncSettingsFromServer } from '../lib/sync';
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
  Loader2,
  Database,
  Pause
} from 'lucide-react';

const SCAN_COOLDOWN_MS = 2500;
const DUP_IGNORE_MS = 5000;

let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playSuccess() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.25);
    });
  } catch {}
}

function playInvalid() {
  try {
    navigator.vibrate([100, 50, 100]);
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    [380, 300, 220].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.15);
    });
  } catch {}
}

function playAlreadyScanned() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 440;
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(300, now + 0.35);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch {}
}

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stats, setStats] = useState(null);
  const [liveActivity, setLiveActivity] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedScans, setQueuedScans] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [cachedCards, setCachedCards] = useState(0);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const html5QrCodeRef = useRef(null);
  const cooldownUntilRef = useRef(0);
  const lastScannedKeyRef = useRef(null);
  const lastScannedTimeRef = useRef(0);
  const cooldownTimerRef = useRef(null);
  const { token, user, logout } = useAuth();
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

  const refreshLocalData = useCallback(async () => {
    try {
      const count = await getCardsCount();
      setCachedCards(count);
    } catch {}
  }, []);

  const doSyncQueuedScans = useCallback(async () => {
    const { getQueue } = await import('../lib/offlineDb');
    const queue = await getQueue();
    if (queue.length === 0) return;
    setSyncing(true);
    const { synced, failed } = await syncQueuedScans(token);
    const updatedQueue = await getQueue();
    setQueuedScans(updatedQueue);
    setSyncing(false);
    if (synced > 0) fetchStats();
    refreshLocalData();
    return { synced, failed };
  }, [token, fetchStats, refreshLocalData]);

  useEffect(() => {
    const init = async () => {
      if (navigator.onLine) {
        await syncCardsFromServer(token);
        await syncSettingsFromServer();
        await doSyncQueuedScans();
      }
      await refreshLocalData();
      const { getQueue } = await import('../lib/offlineDb');
      const q = await getQueue();
      setQueuedScans(q);
    };
    init();
    fetchStats();
    return () => {
      stopScanner();
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await syncCardsFromServer(token);
      await syncSettingsFromServer();
      await doSyncQueuedScans();
      await refreshLocalData();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [token, doSyncQueuedScans, refreshLocalData]);

  useEffect(() => {
    if (!socket) return;
    const onCheckIn = (data) => {
      setLiveActivity(data);
      fetchStats();
      setTimeout(() => setLiveActivity(null), 5000);
    };
    socket.on('guest_checked_in', onCheckIn);
    socket.on('stats_updated', fetchStats);
    return () => { socket.off('guest_checked_in', onCheckIn); socket.off('stats_updated', fetchStats); };
  }, [socket]);

  const startCooldown = useCallback(() => {
    cooldownUntilRef.current = Date.now() + SCAN_COOLDOWN_MS;
    setCooldownActive(true);
    setCooldownRemaining(Math.ceil(SCAN_COOLDOWN_MS / 1000));

    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      const remaining = cooldownUntilRef.current - Date.now();
      if (remaining <= 0) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
        setCooldownActive(false);
        setCooldownRemaining(0);
      } else {
        setCooldownRemaining(Math.ceil(remaining / 1000));
      }
    }, 200);
  }, []);

  const onScanSuccess = useCallback(async (decodedText) => {
    if (cooldownActive || Date.now() < cooldownUntilRef.current) return;
    if (lastScannedKeyRef.current === decodedText && Date.now() - lastScannedTimeRef.current < DUP_IGNORE_MS) return;

    if (!isOnline) {
      const card = await getCardByKey(decodedText);
      if (!card) {
        lastScannedKeyRef.current = decodedText;
        lastScannedTimeRef.current = Date.now();
        playInvalid();
        setScanResult({ type: 'error', message: 'Invalid QR code', icon: <XCircle size={24} /> });
        startCooldown();
        setTimeout(() => setScanResult(null), 5000);
        return;
      }
      if (card.scanned) {
        lastScannedKeyRef.current = decodedText;
        lastScannedTimeRef.current = Date.now();
        playAlreadyScanned();
        setScanResult({ type: 'warning', message: `Already scanned: ${card.guest_name}`, icon: <AlertTriangle size={24} /> });
        startCooldown();
        setTimeout(() => setScanResult(null), 5000);
        return;
      }
      const { addToQueue } = await import('../lib/offlineDb');
      await addToQueue({ unique_key: decodedText });
      await markCardScannedLocally(decodedText);
      const q = await (await import('../lib/offlineDb')).getQueue();
      setQueuedScans(q);
      lastScannedKeyRef.current = decodedText;
      lastScannedTimeRef.current = Date.now();
      playSuccess();
      setScanResult({ type: 'success', message: `${card.guest_name} checked in (offline)`, icon: <CheckCircle2 size={24} /> });
      startCooldown();
      await refreshLocalData();
      setTimeout(() => setScanResult(null), 5000);
      return;
    }

    setVerifying(true);
    setScanResult(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ unique_key: decodedText })
      });
      const data = await res.json();

      await new Promise(r => setTimeout(r, 1000));
      setVerifying(false);

      if (res.ok) {
        lastScannedKeyRef.current = decodedText;
        lastScannedTimeRef.current = Date.now();
        playSuccess();
        setScanResult({ type: 'success', message: `${data.guest_name} checked in!`, icon: <CheckCircle2 size={24} /> });
        startCooldown();
        await markCardScannedLocally(decodedText, data.scanned_at);
      } else if (data.status === 'already_scanned') {
        lastScannedKeyRef.current = decodedText;
        lastScannedTimeRef.current = Date.now();
        playAlreadyScanned();
        setScanResult({ type: 'warning', message: `Already scanned: ${data.guest_name}`, icon: <AlertTriangle size={24} /> });
        startCooldown();
      } else {
        lastScannedKeyRef.current = decodedText;
        lastScannedTimeRef.current = Date.now();
        playInvalid();
        setScanResult({ type: 'error', message: data.error, icon: <XCircle size={24} /> });
        startCooldown();
      }
      setTimeout(() => setScanResult(null), 5000);
    } catch (error) {
      await new Promise(r => setTimeout(r, 1000));
      setVerifying(false);
      lastScannedKeyRef.current = decodedText;
      lastScannedTimeRef.current = Date.now();
      const { addToQueue } = await import('../lib/offlineDb');
      await addToQueue({ unique_key: decodedText });
      const q = await (await import('../lib/offlineDb')).getQueue();
      setQueuedScans(q);
      playInvalid();
      setScanResult({ type: 'warning', message: `Connection lost. Queued for retry.`, icon: <CloudOff size={24} /> });
      startCooldown();
      setTimeout(() => setScanResult(null), 3000);
    }
  }, [isOnline, token, refreshLocalData, startCooldown]);

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
        setScanResult({ type: 'error', message: 'Camera permission denied. Allow in Settings > Safari.', icon: <XCircle size={24} /> });
      } else if (msg.includes('NotFoundError') || msg.includes('not found')) {
        setScanResult({ type: 'error', message: 'No camera found on this device.', icon: <XCircle size={24} /> });
      } else if (msg.includes('NotReadableError') || msg.includes('could not start') || msg.includes('Could not start')) {
        setScanResult({ type: 'error', message: 'Camera in use by another app.', icon: <XCircle size={24} /> });
      } else {
        setScanResult({ type: 'error', message: 'Camera error: ' + msg, icon: <XCircle size={24} /> });
      }
      setTimeout(() => setScanResult(null), 5000);
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
      <div className="scanner-topbar" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
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
        <div className="scanner-topbar-right" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
          padding: '0.75rem 1.25rem', borderRadius: 'var(--radius)',
          background: isOnline ? 'var(--success-bg)' : 'var(--danger-bg)',
          border: `1px solid ${isOnline ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
          color: isOnline ? 'var(--success)' : 'var(--danger)',
          marginBottom: '1.5rem', fontWeight: 600, fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
              {isOnline ? 'Connected' : 'Offline Mode'}
            </div>
            {cachedCards > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', opacity: 0.8 }}>
                <Database size={12} /> {cachedCards} cards cached
              </span>
            )}
          </div>
          {queuedScans.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', background: 'rgba(255,255,255,0.15)' }}>
                {queuedScans.length} queued
              </span>
              {isOnline && (
                <button onClick={doSyncQueuedScans} disabled={syncing} style={{
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
                    Camera requires HTTPS on iOS. Works fully offline once cards are cached.
                  </p>
                </div>
              )}
            </div>
          )}

          {verifying && (
            <div className="scanner-result warning" style={{ animation: 'pulse 1s ease-in-out infinite' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <Loader2 size={24} className="spin" />
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Verifying...</h3>
              </div>
            </div>
          )}

          {!verifying && scanResult && (
            <div className={`scanner-result ${scanResult.type}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                {scanResult.icon}
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{scanResult.message}</h3>
              </div>
              {cooldownActive && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: 0.8 }}>
                  <Pause size={14} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Resuming in {cooldownRemaining}s</span>
                  <div style={{
                    width: 60, height: 4, borderRadius: 2,
                    background: 'rgba(255,255,255,0.2)', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 2, background: 'currentColor',
                      width: `${(cooldownRemaining / Math.ceil(SCAN_COOLDOWN_MS / 1000)) * 100}%`,
                      transition: 'width 0.2s linear',
                    }} />
                  </div>
                </div>
              )}
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
