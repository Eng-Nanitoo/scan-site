import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotify } from '../contexts/NotificationContext';
import {
  CreditCard,
  Plus,
  Printer,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  Trash
} from 'lucide-react';

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ event_name: 'Graduation Party', logo_url: null });
  const { token } = useAuth();
  const notify = useNotify();


  useEffect(() => {
    fetchCards();
    fetchSettings();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await fetch('/api/cards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCards(data);
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/cards/settings');
      const data = await res.json();
      setSettings({ event_name: data.event_name || 'Graduation Party', logo_url: data.logo_url || null });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const deleteCard = async (id) => {
    if (!confirm('Delete this card?')) return;
    try {
      await fetch(`/api/cards/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setCards(cards.filter(c => c.id !== id));
      notify.success('Card deleted');
    } catch (error) {
      notify.error('Failed to delete card');
    }
  };

  const deleteAllCards = async () => {
    if (!confirm(`Delete ALL ${cards.length} cards? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/cards/all', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCards([]);
      notify.success(`Deleted ${data.count} cards`);
    } catch (error) {
      notify.error('Failed to delete cards');
    }
  };

  const getQrUrl = (key, size) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${key}`;

  const printCard = (card) => {
    const qrUrl = getQrUrl(card.unique_key, 150);
    const logoSrc = settings.logo_url || '';
    const eventName = settings.event_name || 'Graduation Party';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Card - ${card.guest_name}</title>
        <style>
          @page{size:landscape;margin:10mm}
          body{margin:0;padding:0;font-family:Arial,sans-serif;background:#0f0f12;display:flex;align-items:center;justify-content:center;min-height:100vh}
          .card{width:340px;height:210px;background:white;border-radius:14px;position:relative;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center}
          .card img.logo{width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0}
          .qr-overlay{position:relative;z-index:2;background:white;padding:6px;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,0.25)}
          .qr-overlay img{display:block}
          .guest-label{position:absolute;bottom:8px;left:0;right:0;text-align:center;z-index:2;font-size:11px;font-weight:bold;color:white;text-shadow:0 1px 4px rgba(0,0,0,0.7);letter-spacing:0.5px}
        </style></head>
        <body>
          <div class="card">
            ${logoSrc ? `<img class="logo" src="${logoSrc}" alt="Logo" />` : ''}
            <div class="qr-overlay">
              <img src="${qrUrl}" width="90" height="90"/>
            </div>
            <div class="guest-label">${card.guest_name}</div>
          </div>
        </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const downloadCard = (card) => {
    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 700, 1000);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 700, 1000);

    const eventName = settings.event_name || 'Graduation Party';
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(eventName, 350, 120);

    ctx.font = '36px Arial';
    ctx.fillText(card.guest_name, 350, 200);

    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.src = getQrUrl(card.unique_key, 300);

    const drawCard = (logoImg) => {
      if (logoImg) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(200, 260, 300, 300, 24);
        ctx.clip();
        ctx.drawImage(logoImg, 200, 260, 300, 300);
        ctx.restore();

        ctx.drawImage(qrImg, 280, 380, 140, 140);
      } else {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.roundRect(200, 280, 300, 300, 16);
        ctx.fill();

        ctx.drawImage(qrImg, 275, 350, 150, 150);
      }

      ctx.fillStyle = '#666';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Scan at entrance', 350, 720);

      const link = document.createElement('a');
      link.download = `card-${card.guest_name}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };

    qrImg.onload = () => {
      if (settings.logo_url) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => drawCard(logoImg);
        logoImg.onerror = () => drawCard(null);
        logoImg.src = settings.logo_url;
      } else {
        drawCard(null);
      }
    };
  };

  const printAllCards = () => {
    const logoUrl = settings.logo_url ? new URL(settings.logo_url, window.location.origin).href : '';
    const eventName = settings.event_name || 'Graduation Party';

    const buildPage = () => {
      const ticketsHtml = cards.map(card => `
        <div class="ticket">
          ${logoUrl ? `<img class="logo" src="${logoUrl}" crossorigin="anonymous" />` : ''}
          <div class="qr-overlay">
            <img src="${getQrUrl(card.unique_key, 120)}" width="70" height="70"/>
          </div>
          <div class="guest-label">${card.guest_name}</div>
        </div>
      `).join('');

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head><title>All Tickets - ${eventName}</title>
          <style>
            @page{size:A4;margin:8mm}
            *{margin:0;padding:0;box-sizing:border-box}
            body{font-family:Arial,sans-serif;background:white}
            .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm;padding:2mm}
            .ticket{position:relative;width:100%;aspect-ratio:3/2;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.15);break-inside:avoid}
            .ticket .logo{width:100%;height:100%;object-fit:cover;display:block}
            .ticket .qr-overlay{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:4px;border-radius:6px;box-shadow:0 1px 6px rgba(0,0,0,0.2)}
            .ticket .qr-overlay img{display:block}
            .ticket .guest-label{position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:8px;font-weight:bold;color:white;text-shadow:0 1px 3px rgba(0,0,0,0.7);letter-spacing:0.3px}
            ${!logoUrl ? `
            .ticket{background:linear-gradient(135deg,#1a1a2e,#16213e);display:flex;align-items:center;justify-content:center}
            .ticket .guest-label{color:#a0a0c0;text-shadow:none;font-size:9px;bottom:8px}
            ` : ''}
            @media print{
              body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
            }
          </style></head>
          <body>
            <div class="grid">
              ${ticketsHtml}
            </div>
            <script>
              let loaded = 0;
              const total = document.querySelectorAll('img').length;
              if (total === 0) { window.onload = function() { window.print(); }; }
              else {
                document.querySelectorAll('img').forEach(function(img) {
                  if (img.complete) { loaded++; if (loaded >= total) window.print(); }
                  else { img.onload = function() { loaded++; if (loaded >= total) window.print(); }; img.onerror = function() { loaded++; if (loaded >= total) window.print(); }; }
                });
              }
            </script>
          </body></html>
      `);
      printWindow.document.close();
    };

    if (logoUrl) {
      const preload = new Image();
      preload.crossOrigin = 'anonymous';
      preload.onload = buildPage;
      preload.onerror = buildPage;
      preload.src = logoUrl;
    } else {
      buildPage();
    }
  };

  if (loading) return (
    <div>
      <div className="page-header">
        <h1>Invitation Cards</h1>
        <p>Manage all generated invitation cards</p>
      </div>
      <div className="cards-grid">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="card-item">
            <div className="card-preview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="skeleton" style={{ width: 110, height: 110, borderRadius: 12 }} />
            </div>
            <div className="card-info">
              <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: '100%', height: 12, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 12 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Invitation Cards</h1>
        <p>Manage all generated invitation cards</p>
      </div>

      <div className="cards-header">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {cards.length} cards total
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {cards.length > 0 && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={printAllCards}>
                <Layers size={14} /> Print All
              </button>
              <button className="btn btn-danger btn-sm" onClick={deleteAllCards}>
                <Trash size={14} /> Delete All
              </button>
            </>
          )}
          <Link to="/cards/generate" className="btn btn-primary btn-sm">
            <Plus size={16} /> Generate Cards
          </Link>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><CreditCard size={28} /></div>
          <p>No cards generated yet</p>
          <Link to="/cards/generate" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
            <Plus size={16} /> Generate Your First Cards
          </Link>
        </div>
      ) : (
        <div className="cards-grid">
          {cards.map(card => (
            <div key={card.id} className="card-item">
              <div className="card-preview">
                <h3>{settings.event_name || 'Graduation Party'}</h3>
                <div style={{
                  position: 'relative',
                  width: settings.logo_url ? 160 : 'auto',
                  height: settings.logo_url ? 160 : 'auto',
                  margin: '0 auto'
                }}>
                  {settings.logo_url ? (
                    <>
                      <img
                        src={settings.logo_url}
                        alt="Logo"
                        style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 12 }}
                      />
                      <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}>
                        <img
                          src={getQrUrl(card.unique_key, 80)}
                          alt="QR Code" width="80" height="80"
                          style={{ borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="qr-placeholder">
                      <img
                        src={getQrUrl(card.unique_key, 110)}
                        alt="QR Code" width="110" height="110"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="card-info">
                <div className="guest-name">{card.guest_name}</div>
                <div className="card-key">{card.unique_key}</div>
                <span className={`card-status ${card.scanned ? 'scanned' : 'pending'}`}>
                  {card.scanned ? <><CheckCircle2 size={12} /> Checked in</> : <><Clock size={12} /> Pending</>}
                </span>
              </div>
              <div className="card-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => printCard(card)}>
                  <Printer size={14} /> Print
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => downloadCard(card)}>
                  <Download size={14} /> Save
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteCard(card.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
