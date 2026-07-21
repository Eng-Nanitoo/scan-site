import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import {
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  UserCheck,
  Activity,
  Wifi,
  WifiOff,
  ScanLine
} from 'lucide-react';

function StatSkeleton() {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
      </div>
      <div className="skeleton" style={{ width: 60, height: 32, marginTop: 8 }} />
      <div className="skeleton" style={{ width: 100, height: 14, marginTop: 6 }} />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div style={{ padding: '1rem 0' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
          <div className="skeleton" style={{ width: 100, height: 14 }} />
          <div className="skeleton" style={{ width: 80, height: 14 }} />
          <div className="skeleton" style={{ width: 60, height: 14 }} />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [scanners, setScanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const socket = useSocket();

  useEffect(() => {
    fetchStats();
    fetchScanners();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('guest_checked_in', () => fetchStats());
    socket.on('stats_updated', () => fetchStats());
    socket.on('scanners_status', (data) => setScanners(data));

    return () => {
      socket.off('guest_checked_in');
      socket.off('stats_updated');
      socket.off('scanners_status');
    };
  }, [socket]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/scan/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScanners = async () => {
    try {
      const res = await fetch('/api/scan/scanners-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setScanners(data);
    } catch (error) {
      console.error('Failed to fetch scanners:', error);
    }
  };

  if (!stats && loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Overview of your graduation party check-in</p>
        </div>
        <div className="stats-grid">
          <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div className="recent-scans">
            <div className="section-header">
              <div className="section-icon"><ScanLine size={18} /></div>
              <h3>Scanner Status</h3>
            </div>
            <TableSkeleton />
          </div>
          <div className="recent-scans">
            <div className="section-header">
              <div className="section-icon"><Activity size={18} /></div>
              <h3>Recent Check-ins</h3>
            </div>
            <TableSkeleton />
          </div>
        </div>
      </div>
    );
  }
  if (!stats) return <div>Failed to load stats</div>;

  const onlineScanners = scanners.filter(s => s.username !== 'admin');

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your graduation party check-in</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon purple"><Users size={20} /></div>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Invitations</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green"><CheckCircle2 size={20} /></div>
          </div>
          <div className="stat-value">{stats.scanned}</div>
          <div className="stat-label">Checked In</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon yellow"><Clock size={20} /></div>
          </div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue"><TrendingUp size={20} /></div>
          </div>
          <div className="stat-value">{stats.percentage}%</div>
          <div className="stat-label">Check-in Rate</div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${stats.percentage}%` }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div className="recent-scans">
          <div className="section-header">
            <div className="section-icon"><ScanLine size={18} /></div>
            <h3>Scanner Status</h3>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="live-dot" />
              <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>LIVE</span>
            </div>
          </div>

          {onlineScanners.length === 0 ? (
            <div style={{ padding: '1rem 0', color: 'var(--text-dim)', fontSize: '0.9rem', textAlign: 'center' }}>
              <WifiOff size={24} style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.5 }} />
              No scanners online
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {onlineScanners.map((scanner) => (
                <div key={scanner.socketId} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'var(--success-bg)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'var(--success)'
                    }}>
                      <ScanLine size={16} />
                    </div>
                    <span style={{
                      position: 'absolute', top: -2, right: -2,
                      width: 10, height: 10, background: 'var(--success)',
                      borderRadius: '50%', border: '2px solid var(--bg-card)'
                    }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{scanner.username}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Connected {new Date(scanner.connectedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '0.7rem',
                    fontWeight: 600, background: 'var(--success-bg)', color: 'var(--success)'
                  }}>
                    <Wifi size={12} /> Online
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="recent-scans">
          <div className="section-header">
            <div className="section-icon"><Activity size={18} /></div>
            <h3>Recent Check-ins</h3>
          </div>

          {stats.recent_scans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><UserCheck size={28} /></div>
              <p>No check-ins yet</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>By</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_scans.map((scan, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{scan.guest_name}</td>
                    <td>{scan.scanned_by}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(scan.scanned_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
