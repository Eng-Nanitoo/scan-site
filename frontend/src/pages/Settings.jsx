import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Upload,
  Image,
  Type,
  Save,
  Loader2,
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
  const [settings, setSettings] = useState({});
  const [form, setForm] = useState({
    event_name: '', event_subtitle: '', event_date: '', event_time: '',
    event_location_line1: '', event_location_line2: '', org_logo_text: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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
      if (data.logo_url) setLogoPreview(data.logo_url);
    } catch (error) { console.error('Failed to fetch settings:', error); }
    finally { setLoading(false); }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
  };

  const uploadLogo = async () => {
    if (!logoFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      const res = await fetch('/api/cards/logo', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setSettings(prev => ({ ...prev, logo_url: data.logoUrl }));
      setLogoFile(null);
    } catch (error) { console.error('Failed to upload logo'); }
    finally { setUploading(false); }
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
          <h1>Settings</h1>
          <p>Configure your graduation party event</p>
        </div>
        <div className="settings-card">
          <div className="skeleton" style={{ width: 160, height: 100, borderRadius: 'var(--radius)', marginBottom: '1.5rem' }} />
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
        <h1>Settings</h1>
        <p>Configure your graduation party event</p>
      </div>

      <div className="settings-card">
        {/* Logo */}
        <div className="section-header">
          <div className="section-icon"><Image size={18} /></div>
          <h3>Event Logo</h3>
        </div>
        <div className="settings-logo-row" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="logo-preview">
            {logoPreview ? <img src={logoPreview} alt="Logo" /> : <Image size={28} style={{ color: 'var(--text-dim)' }} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Upload size={16} /> Choose Logo
              <input type="file" accept="image/*" onChange={handleLogoChange}
                style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden' }} />
            </label>
            {logoFile && (
              <button className="btn btn-primary" onClick={uploadLogo} disabled={uploading}>
                {uploading ? <><Loader2 size={16} className="spin" /> Uploading...</> : <><Upload size={16} /> Upload</>}
              </button>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="section-header" style={{ marginTop: '1.5rem' }}>
          <div className="section-icon"><Type size={18} /></div>
          <h3>Event Details</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <label style={LABEL_STYLE}>Event Name</label>
            <input style={INPUT_STYLE} value={form.event_name}
              onChange={(e) => handleChange('event_name', e.target.value)}
              placeholder="Cérémonie de Fin d'Études" />
          </div>
          <div>
            <label style={LABEL_STYLE}>Subtitle</label>
            <input style={INPUT_STYLE} value={form.event_subtitle}
              onChange={(e) => handleChange('event_subtitle', e.target.value)}
              placeholder="Licence 2026 – ISCAE" />
          </div>
          <div>
            <label style={LABEL_STYLE}>Org Logo Text (badge initials)</label>
            <input style={{ ...INPUT_STYLE, maxWidth: 200 }} value={form.org_logo_text}
              onChange={(e) => handleChange('org_logo_text', e.target.value)}
              placeholder="ISCAE" />
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={LABEL_STYLE}><Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Date</label>
              <input style={INPUT_STYLE} value={form.event_date}
                onChange={(e) => handleChange('event_date', e.target.value)}
                placeholder="15 Juin 2026" />
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={LABEL_STYLE}><Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Time</label>
              <input style={INPUT_STYLE} value={form.event_time}
                onChange={(e) => handleChange('event_time', e.target.value)}
                placeholder="14:00 GMT" />
            </div>
          </div>
          <div>
            <label style={LABEL_STYLE}><MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Location Line 1</label>
            <input style={INPUT_STYLE} value={form.event_location_line1}
              onChange={(e) => handleChange('event_location_line1', e.target.value)}
              placeholder="Palais des Congrès" />
          </div>
          <div>
            <label style={LABEL_STYLE}><Building size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Location Line 2</label>
            <input style={INPUT_STYLE} value={form.event_location_line2}
              onChange={(e) => handleChange('event_location_line2', e.target.value)}
              placeholder="Nouakchott" />
          </div>
        </div>

        <button className="btn btn-primary" onClick={saveSettings} style={{ marginTop: '1.5rem', width: 'auto', padding: '0.75rem 2rem' }}>
          <Save size={16} /> Save All Settings
        </button>
      </div>
    </div>
  );
}
