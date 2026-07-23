import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import {
  PlusCircle,
  List,
  Hash,
  Loader2,
  CheckCircle2,
  Clock,
  Eye
} from 'lucide-react';

export default function GenerateCards() {
  const [mode, setMode] = useState('names');
  const [namesText, setNamesText] = useState('');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState([]);
  const { token } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let body = {};
      if (mode === 'names') {
        const names = namesText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
        if (names.length === 0) { setLoading(false); return; }
        body.guest_names = names;
      } else {
        body.count = count;
      }

      const res = await fetch('/api/cards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const cards = await res.json();
      setGenerated(cards);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t('generateCardsTitle')}</h1>
        <p>{t('generateCardsDesc')}</p>
      </div>

      <div className="generate-form">
        <div className="tabs">
          <button className={`tab ${mode === 'names' ? 'active' : ''}`} onClick={() => setMode('names')}>
            <List size={16} /> {t('enterNames')}
          </button>
          <button className={`tab ${mode === 'count' ? 'active' : ''}`} onClick={() => setMode('count')}>
            <Hash size={16} /> {t('quickGenerate')}
          </button>
        </div>

        <form onSubmit={handleGenerate}>
          {mode === 'names' ? (
            <div className="form-group">
              <label>{t('guestNamesLabel')}</label>
              <textarea
                value={namesText}
                onChange={(e) => setNamesText(e.target.value)}
                placeholder={t('guestNamesPlaceholder')}
              />
            </div>
          ) : (
            <div className="form-group">
              <label>{t('numberOfCards')}</label>
              <input type="number" min="1" max="2000" value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)} />
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><Loader2 size={16} className="spin" /> {t('generating')}</> : <><PlusCircle size={16} /> {t('generateCards')}</>}
          </button>
        </form>
      </div>

      {generated.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <div className="section-icon"><CheckCircle2 size={18} /></div>
            <h3>{t('generatedCount', { count: generated.length })}</h3>
          </div>
          <div className="cards-grid">
            {generated.map(card => (
              <div key={card.id} className="card-item">
                <div className="card-preview">
                  <h3>{t('graduationParty')}</h3>
                  <div className="qr-placeholder">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${card.unique_key}`}
                      alt="QR" width="110" height="110" />
                  </div>
                </div>
                <div className="card-info">
                  <div className="guest-name">{card.guest_name}</div>
                  <div className="card-key">{card.unique_key}</div>
                  <span className="card-status pending"><Clock size={12} /> {t('pending')}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/cards')}>
            <Eye size={16} /> {t('viewAllCards')}
          </button>
        </div>
      )}
    </div>
  );
}
