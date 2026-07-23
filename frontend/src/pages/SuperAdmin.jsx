import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Users as UsersIcon,
  UserPlus,
  Trash2,
  Shield,
  UserX,
  UserCheck,
  CreditCard,
  ScanLine
} from 'lucide-react';

function SubAdminSkeleton() {
  return (
    <tr>
      <td><div className="skeleton" style={{ width: 120, height: 16 }} /></td>
      <td><div className="skeleton" style={{ width: 80, height: 24, borderRadius: 12 }} /></td>
      <td><div className="skeleton" style={{ width: 40, height: 14 }} /></td>
      <td><div className="skeleton" style={{ width: 40, height: 14 }} /></td>
      <td><div className="skeleton" style={{ width: 90, height: 14 }} /></td>
      <td><div className="skeleton" style={{ width: 80, height: 32 }} /></td>
    </tr>
  );
}

export default function SuperAdmin() {
  const [subadmins, setSubadmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { token } = useAuth();

  useEffect(() => { fetchSubadmins(); }, []);

  const fetchSubadmins = async () => {
    try {
      const res = await fetch('/api/superadmin/subadmins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubadmins(await res.json());
    } catch (error) {
      console.error('Failed to fetch sub-admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSubadmin = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    try {
      const res = await fetch('/api/superadmin/subadmins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setUsername(''); setPassword(''); setShowForm(false);
      fetchSubadmins();
    } catch (error) { console.error(error.message); }
  };

  const toggleSubadmin = async (id) => {
    try {
      const res = await fetch(`/api/superadmin/subadmins/${id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      fetchSubadmins();
    } catch (error) { console.error(error.message); }
  };

  const deleteSubadmin = async (id) => {
    if (!confirm('Delete this sub-admin and all their data?')) return;
    try {
      const res = await fetch(`/api/superadmin/subadmins/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      fetchSubadmins();
    } catch (error) { console.error(error.message); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Manage Sub-Admins</h1>
        <p>Create and manage sub-admin accounts</p>
      </div>

      {!showForm ? (
        <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ marginBottom: '1rem' }}>
          <UserPlus size={16} /> Add Sub-Admin
        </button>
      ) : (
        <form className="add-user-form" onSubmit={addSubadmin} style={{ marginBottom: '1rem' }}>
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="btn btn-primary btn-sm">
            <UserPlus size={14} /> Create
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setShowForm(false); setUsername(''); setPassword(''); }}>
            Cancel
          </button>
        </form>
      )}

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Status</th>
              <th>Cards</th>
              <th>Scanners</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <SubAdminSkeleton />
                <SubAdminSkeleton />
                <SubAdminSkeleton />
              </>
            ) : subadmins.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No sub-admins yet</td></tr>
            ) : subadmins.map(sa => (
              <tr key={sa.id}>
                <td style={{ fontWeight: 500 }}>{sa.username}</td>
                <td>
                  <span className={`role-badge ${sa.active ? 'active' : 'inactive'}`}>
                    {sa.active ? <><UserCheck size={12} /> Active</> : <><UserX size={12} /> Inactive</>}
                  </span>
                </td>
                <td><CreditCard size={14} style={{ marginRight: 4 }} />{sa.card_count}</td>
                <td><ScanLine size={14} style={{ marginRight: 4 }} />{sa.scanner_count}</td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(sa.created_at).toLocaleDateString()}</td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className={`btn btn-sm ${sa.active ? 'btn-warning' : 'btn-primary'}`}
                    onClick={() => toggleSubadmin(sa.id)}
                    title={sa.active ? 'Deactivate' : 'Activate'}
                  >
                    {sa.active ? <UserX size={14} /> : <UserCheck size={14} />}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteSubadmin(sa.id)}>
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
