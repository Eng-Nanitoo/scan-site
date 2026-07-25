import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import {
  Type,
  Save,
  Calendar,
  Clock,
  MapPin,
  Building
} from 'lucide-react';

const INPUT_STYLE = {
  width: '100%', padding: '0.75rem 1rem', background: 'var(--bg)',
  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  fontSize: '0.95rem', color: 'var(--text)', fontFamily: 'inherit',
};

const LABEL_STYLE = {
  fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem',
  display: 'block',
};

export default function Settings() {
  const { t } = useI18n();
  const [settings, setSettings] = useState({});
  const [form, setForm] = useState({
    event_name: '', event_subtitle: '', event_date: '', event_time: '',
    event_location_line1: '', event_location_line2: '', org_logo_text: '',
  });
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/cards/settings');
      const data = await res.json();
      setSettings(data);
      setForm({
        event_name: data.event_name || '',
        event_subtitle: data.event_subtitle || '',
        event_date: data.event_date || '',
        event_time: data.event_time || '',
        event_location_line1: data.event_location_line1 || '',
        event_location_line2: data.event_location_line2 || '',
        org_logo_text: data.org_logo_text || '',
      });
    } catch (error) { console.error('Failed to fetch settings:', error); }
    finally { setLoading(false); }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const saveSettings = async () => {
    try {
      const res = await fetch('/api/cards/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Update failed');
      setSettings(await res.json());
    } catch (error) { console.error('Failed to update settings'); }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>{t('settings')}</h1>
          <p>{t('settingsDesc')}</p>
        </div>
        <div className="settings-card">
          <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 'var(--radius)', marginBottom: '1rem' }} />
          <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 'var(--radius)', marginBottom: '1rem' }} />
          <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 'var(--radius)' }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t('settings')}</h1>
        <p>{t('settingsDesc')}</p>
      </div>

      <div className="settings-card">
        <div className="section-header">
          <div className="section-icon"><Type size={18} /></div>
          <h3>{t('eventDetails')}</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <label style={LABEL_STYLE}>{t('eventName')}</label>
            <input style={INPUT_STYLE} value={form.event_name}
              onChange={(e) => handleChange('event_name', e.target.value)}
              placeholder={t('eventNamePlaceholder')} />
          </div>
          <div>
            <label style={LABEL_STYLE}>{t('subtitle')}</label>
            <input style={INPUT_STYLE} value={form.event_subtitle}
              onChange={(e) => handleChange('event_subtitle', e.target.value)}
              placeholder={t('subtitlePlaceholder')} />
          </div>
          <div>
            <label style={LABEL_STYLE}>{t('orgLogoText')}</label>
            <input style={{ ...INPUT_STYLE, maxWidth: 200 }} value={form.org_logo_text}
              onChange={(e) => handleChange('org_logo_text', e.target.value)}
              placeholder={t('orgLogoTextPlaceholder')} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={LABEL_STYLE}><Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{t('date')}</label>
              <input style={INPUT_STYLE} value={form.event_date}
                onChange={(e) => handleChange('event_date', e.target.value)}
                placeholder={t('datePlaceholder')} />
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={LABEL_STYLE}><Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Time</label>
              <input style={INPUT_STYLE} value={form.event_time}
                onChange={(e) => handleChange('event_time', e.target.value)}
                placeholder={t('timePlaceholder')} />
            </div>
          </div>
          <div>
            <label style={LABEL_STYLE}><MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{t('locationLine1')}</label>
            <input style={INPUT_STYLE} value={form.event_location_line1}
              onChange={(e) => handleChange('event_location_line1', e.target.value)}
              placeholder={t('locationLine1Placeholder')} />
          </div>
          <div>
            <label style={LABEL_STYLE}><Building size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{t('locationLine2')}</label>
            <input style={INPUT_STYLE} value={form.event_location_line2}
              onChange={(e) => handleChange('event_location_line2', e.target.value)}
              placeholder={t('locationLine2Placeholder')} />
          </div>
        </div>

        <button className="btn btn-primary" onClick={saveSettings} style={{ marginTop: '1.5rem', width: 'auto', padding: '0.75rem 2rem' }}>
          <Save size={16} /> {t('saveAllSettings')}
        </button>
      </div>
    </div>
  );
}
