import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/I18nContext';
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
  Shield,
  Globe
} from 'lucide-react';

export default function Layout() {
  const { logout, user, isSuperAdmin } = useAuth();
  const { t, lang, setLang, isRTL } = useI18n();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLang = () => {
    const next = lang === 'en' ? 'fr' : lang === 'fr' ? 'ar' : 'en';
    setLang(next);
  };

  const langLabel = lang === 'en' ? 'FR' : lang === 'fr' ? 'عربي' : 'EN';

  const navItems = isSuperAdmin ? (
    <>
      <li><NavLink to="/super-admin" end><Shield size={18} /> {t('subAdmins')}</NavLink></li>
    </>
  ) : (
    <>
      <li><NavLink to="/" end><LayoutDashboard size={18} /> {t('dashboard')}</NavLink></li>
      <li><NavLink to="/activity"><Activity size={18} /> {t('liveActivity')}</NavLink></li>
      <li><NavLink to="/cards"><CreditCard size={18} /> {t('cards')}</NavLink></li>
      <li><NavLink to="/cards/generate"><PlusCircle size={18} /> {t('generateCards')}</NavLink></li>
      <li><NavLink to="/users"><Users size={18} /> {t('manageUsers')}</NavLink></li>
      <li><NavLink to="/settings"><Settings size={18} /> {t('settings')}</NavLink></li>
    </>
  );

  const mobileNavItems = isSuperAdmin ? (
    <NavLink to="/super-admin" end><Shield size={18} /> {t('subAdmins')}</NavLink>
  ) : (
    <>
      <NavLink to="/" end><LayoutDashboard size={18} /> {t('dashboard')}</NavLink>
      <NavLink to="/activity"><Activity size={18} /> {t('liveActivity')}</NavLink>
      <NavLink to="/cards/generate"><PlusCircle size={18} /> {t('generate')}</NavLink>
      <NavLink to="/cards"><CreditCard size={18} /> {t('cards')}</NavLink>
      <NavLink to="/users"><Users size={18} /> {t('manageUsers')}</NavLink>
      <NavLink to="/settings"><Settings size={18} /> {t('settings')}</NavLink>
    </>
  );

  return (
    <div className="layout" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GraduationCap size={20} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {isSuperAdmin ? t('superAdmin') : t('gradCheckin')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={toggleLang} style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 8, height: 32, padding: '0 8px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600
          }}>
            <Globe size={14} style={{ marginRight: 4 }} /> {langLabel}
          </button>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700
          }}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 8, width: 32, height: 32, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
            cursor: 'pointer', padding: 0
          }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            {isSuperAdmin ? <Shield size={22} /> : <GraduationCap size={22} />}
          </div>
          <div>
            <h2>{isSuperAdmin ? t('superAdmin') : t('gradCheckin')}</h2>
            <span>{isSuperAdmin ? t('systemManagement') : t('partyManagement')}</span>
          </div>
        </div>

        <nav>
          <ul className="sidebar-nav">
            {navItems}
          </ul>
        </nav>

        <div style={{ padding: '0 1rem', marginBottom: '0.5rem' }}>
          <button onClick={toggleLang} className="btn btn-secondary btn-sm" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <Globe size={14} /> {lang === 'en' ? 'Francais' : lang === 'fr' ? 'العربية' : 'English'}
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar"><User size={16} /></div>
            <div>
              <div className="user-name">{user?.username}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout}>
            <LogOut size={16} /> {t('signOut')}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      <nav className="mobile-bottom-nav">
        {mobileNavItems}
      </nav>
    </div>
  );
}
