import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  const [role, setRole] = useState('scanner');
  const { token } = useAuth();

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
        body: JSON.stringify({ username, password, role })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setUsername(''); setPassword(''); setRole('scanner');
      fetchUsers();
    } catch (error) { console.error(error.message); }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      const res = await fetch(`/api/auth/scanners/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      fetchUsers();
    } catch (error) { console.error(error.message); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Manage Users</h1>
        <p>Add or remove scanners who can check-in guests</p>
      </div>

      <form className="add-user-form" onSubmit={addUser}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="scanner">Scanner</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className="btn btn-primary btn-sm">
          <UserPlus size={14} /> Add User
        </button>
      </form>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <UserSkeleton />
                <UserSkeleton />
                <UserSkeleton />
              </>
            ) : users.map(user => (
              <tr key={user.id}>
                <td style={{ fontWeight: 500 }}>{user.username}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'admin' ? <Crown size={12} /> : <ScanLine size={12} />}
                    {user.role}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteUser(user.id)}>
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
