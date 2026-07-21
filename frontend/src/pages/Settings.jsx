import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotify } from '../contexts/NotificationContext';
import {
  Upload,
  Image,
  Type,
  Save,
  Loader2
} from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({ event_name: 'Graduation Party', logo_url: null });
  const [eventName, setEventName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { token } = useAuth();
  const notify = useNotify();

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/cards/settings');
      const data = await res.json();
      setSettings(data);
      setEventName(data.event_name || '');
      if (data.logo_url) setLogoPreview(data.logo_url);
    } catch (error) { console.error('Failed to fetch settings:', error); }
    finally { setLoading(false); }
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
      notify.success('Logo uploaded');
    } catch (error) { notify.error('Failed to upload logo'); }
    finally { setUploading(false); }
  };

  const updateEventName = async () => {
    try {
      const res = await fetch('/api/cards/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event_name: eventName })
      });
      if (!res.ok) throw new Error('Update failed');
      setSettings(await res.json());
      notify.success('Settings updated');
    } catch (error) { notify.error('Failed to update settings'); }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Settings</h1>
          <p>Configure your graduation party event</p>
        </div>
        <div className="settings-card">
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div className="skeleton" style={{ width: 160, height: 100, borderRadius: 'var(--radius)' }} />
            <div>
              <div className="skeleton" style={{ width: 140, height: 36, borderRadius: 8 }} />
            </div>
          </div>
          <div className="skeleton" style={{ width: 120, height: 18, marginBottom: '0.75rem' }} />
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
        <div className="section-header">
          <div className="section-icon"><Image size={18} /></div>
          <h3>Event Logo</h3>
        </div>

        <div className="settings-logo-row" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>          <div className="logo-preview">
            {logoPreview ? <img src={logoPreview} alt="Logo" /> : <Image size={28} style={{ color: 'var(--text-dim)' }} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Upload size={16} /> Choose Logo
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden' }}
              />
            </label>
            {logoFile && (
              <button className="btn btn-primary" onClick={uploadLogo} disabled={uploading}>
                {uploading ? <><Loader2 size={16} className="spin" /> Uploading...</> : <><Upload size={16} /> Upload</>}
              </button>
            )}
          </div>
        </div>

        <div className="section-header" style={{ marginTop: '2rem' }}>
          <div className="section-icon"><Type size={18} /></div>
          <h3>Event Name</h3>
        </div>

        <div className="settings-name-row" style={{ display: 'flex', gap: '0.75rem' }}>          <input
            type="text" value={eventName} onChange={(e) => setEventName(e.target.value)}
            style={{ flex: 1, padding: '0.75rem 1rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.95rem', color: 'var(--text)', fontFamily: 'inherit' }}
          />
          <button className="btn btn-primary" onClick={updateEventName}>
            <Save size={16} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
