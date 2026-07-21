import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  CreditCard,
  PlusCircle,
  Users,
  Settings,
  Activity,
  LogOut,
  GraduationCap,
  User,
  ScanLine
} from 'lucide-react';

export default function Layout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <div className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GraduationCap size={20} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Grad Check-in</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700
          }}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <GraduationCap size={22} />
          </div>
          <div>
            <h2>Grad Check-in</h2>
            <span>Party Management</span>
          </div>
        </div>

        <nav>
          <ul className="sidebar-nav">
            <li><NavLink to="/" end><LayoutDashboard size={18} /> Dashboard</NavLink></li>
            <li><NavLink to="/activity"><Activity size={18} /> Activity</NavLink></li>
            <li><NavLink to="/cards"><CreditCard size={18} /> Cards</NavLink></li>
            <li><NavLink to="/cards/generate"><PlusCircle size={18} /> Generate Cards</NavLink></li>
            <li><NavLink to="/users"><Users size={18} /> Users</NavLink></li>
            <li><NavLink to="/settings"><Settings size={18} /> Settings</NavLink></li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar"><User size={16} /></div>
            <div>
              <div className="user-name">{user?.username}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      <nav className="mobile-bottom-nav">
        <NavLink to="/" end><LayoutDashboard size={18} /> Home</NavLink>
        <NavLink to="/activity"><Activity size={18} /> Activity</NavLink>
        <NavLink to="/cards/generate"><PlusCircle size={18} /> Generate</NavLink>
        <NavLink to="/cards"><CreditCard size={18} /> Cards</NavLink>
        <NavLink to="/users"><Users size={18} /> Users</NavLink>
        <NavLink to="/settings"><Settings size={18} /> More</NavLink>
      </nav>
    </div>
  );
}
