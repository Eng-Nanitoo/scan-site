import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { GraduationCap, Loader2, Eye, EyeOff, Globe, AlertCircle, X } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();

  const toggleLang = () => {
    setLang(lang === 'fr' ? 'ar' : 'fr');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(username, password);
      if (user.role === 'superadmin') {
        navigate('/super-admin');
      } else if (user.role === 'subadmin') {
        navigate('/');
      } else {
        navigate('/scanner');
      }
    } catch (err) {
      const msg = err.message;
      if (msg === 'Account is deactivated. Contact administrator.') {
        setError(t('errorDeactivated'));
      } else if (msg === 'Invalid credentials') {
        setError(t('errorInvalidCredentials'));
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError(t('errorNetwork'));
      } else {
        setError(t('errorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <button onClick={toggleLang} style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 8, height: 32, padding: '0 8px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, gap: 4
          }}>
            <Globe size={14} /> {lang === 'fr' ? 'عربي' : 'Francais'}
          </button>
        </div>

        <div className="auth-icon">
          <GraduationCap size={28} />
        </div>
        <h1>{t('welcomeBack')}</h1>
        <p className="subtitle">{t('signInToApp')}</p>

        {error && (
          <div className="error-banner">
            <span className="error-icon"><AlertCircle size={18} /></span>
            <span className="error-text">{error}</span>
            <button className="error-dismiss" onClick={() => setError('')}>
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">{t('username')}</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder={t('enterUsername')}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('password')}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t('enterPassword')}
                style={{ paddingRight: 40 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 4, display: 'flex', zIndex: 2
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><Loader2 size={18} className="spin" /> {t('signingIn')}</> : t('signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
