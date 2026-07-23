import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { GraduationCap, Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-icon">
          <GraduationCap size={28} />
        </div>
        <h1>{t('welcomeBack')}</h1>
        <p className="subtitle">{t('signInToApp')}</p>

        {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

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
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t('enterPassword')}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><Loader2 size={18} className="spin" /> {t('signingIn')}</> : t('signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
