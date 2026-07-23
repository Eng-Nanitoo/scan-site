import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import {
  Users as UsersIcon,
  UserPlus,
  Trash2,
  Shield,
  ScanLine,
  Crown
} from 'lucide-react';

function UserSkeleton() {
  return (
    <tr>
      <td><div className="skeleton" style={{ width: 120, height: 16 }} /></td>
      <td><div className="skeleton" style={{ width: 80, height: 24, borderRadius: 12 }} /></td>
      <td><div className="skeleton" style={{ width: 90, height: 14 }} /></td>
      <td><div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} /></td>
    </tr>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { token, user } = useAuth();
  const { t } = useI18n();
  const isSuperAdmin = user?.role === 'superadmin';

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/scanners', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(await res.json());
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username, password, role: 'scanner' })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setUsername(''); setPassword('');
      fetchUsers();
    } catch (error) { console.error(error.message); }
  };

  const deleteUser = async (id) => {
    if (!confirm(t('deleteUserConfirm'))) return;
    try {
      const res = await fetch(`/api/auth/scanners/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      fetchUsers();
    } catch (error) { console.error(error.message); }
  };

  if (isSuperAdmin) {
    return (
      <div>
        <div className="page-header">
          <h1>{t('manageUsers')}</h1>
          <p>{t('superAdminNoScanners')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t('manageUsers')}</h1>
        <p>{t('addRemoveScanners')}</p>
      </div>

      <form className="add-user-form" onSubmit={addUser}>
        <input type="text" placeholder={t('username')} value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="btn btn-primary btn-sm">
          <UserPlus size={14} /> {t('addScanner')}
        </button>
      </form>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>{t('username')}</th>
              <th>{t('role')}</th>
              <th>{t('created')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <UserSkeleton />
                <UserSkeleton />
                <UserSkeleton />
              </>
            ) : users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.username}</td>
                <td>
                  <span className={`role-badge ${u.role}`}>
                    {u.role === 'admin' ? <Crown size={12} /> : <ScanLine size={12} />}
                    {u.role === 'admin' ? t('admin') : t('scanner')}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
