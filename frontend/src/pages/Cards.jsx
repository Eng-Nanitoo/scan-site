import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotify } from '../contexts/NotificationContext';
import TicketCard from '../components/TicketCard';
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
  const [settings, setSettings] = useState({});
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
      setSettings(data);
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

  const getTicketProps = useCallback((card) => ({
    orgLogoText: settings.org_logo_text || '',
    eventTitle: settings.event_name || 'Graduation Party',
    eventSubtitle: settings.event_subtitle || '',
    qrValue: card.unique_key,
    qrCenterInitial: card.guest_name?.charAt(0)?.toUpperCase() || '',
    guestName: card.guest_name,
    date: settings.event_date || '',
    time: settings.event_time || '',
    locationLine1: settings.event_location_line1 || '',
    locationLine2: settings.event_location_line2 || '',
  }), [settings]);

  const printCard = (card) => {
    const props = getTicketProps(card);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>Ticket - ${card.guest_name}</title>
      <style>
        @page{size:portrait;margin:0}
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
          display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F2F3F5}
      </style>
      <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
    </head><body>
      <div id="root"></div>
      <script type="text/babel">
        const { useState, useEffect } = React;
        function QrImg({ value, size }) {
          const [url, setUrl] = useState('');
          useEffect(() => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js';
            s.onload = () => {
              window.QRCode.toDataURL(value, { width: size, margin: 0,
                color: { dark: '#000000', light: '#ffffff' },
                errorCorrectionLevel: 'H' }).then(setUrl);
            };
            document.head.appendChild(s);
          }, [value, size]);
          return url ? React.createElement('img', { src: url, width: size, height: size,
            style: { display: 'block', borderRadius: 8 } }) :
            React.createElement('div', { style: { width: size, height: size,
              background: '#e5e7eb', borderRadius: 8 } });
        }
        function Ticket() {
          const [ready, setReady] = useState(false);
          useEffect(() => { setTimeout(() => setReady(true), 500); }, []);
          if (!ready) return null;
          ReactDOM.createRoot(document.getElementById('root')).render(
            React.createElement(window.TicketCard.default, ${JSON.stringify({ ...props, embedded: false })})
          );
          setTimeout(() => window.print(), 300);
          return null;
        }
        ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Ticket));
      <\/script>
    </body></html>`);
    printWindow.document.close();
  };

  const printAllCards = () => {
    const allProps = cards.map(card => getTicketProps(card));
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>All Tickets</title>
      <style>
        @page{size:A4 portrait;margin:10mm}
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
          background:#F2F3F5}
        .ticket-wrap{width:100%;page-break-inside:avoid;break-inside:avoid;
          display:flex;justify-content:center;padding:10mm 0}
      </style>
      <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
    </head><body>
      <div id="root"></div>
      <script type="text/babel">
        const allProps = ${JSON.stringify(allProps.map(p => ({ ...p, embedded: true })))};
        function App() {
          const [ready, setReady] = React.useState(false);
          React.useEffect(() => { setTimeout(() => setReady(true), 800); }, []);
          if (!ready) return null;
          const el = React.createElement;
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(el('div', null,
            allProps.map((p, i) => el('div', { key: i, className: 'ticket-wrap' },
              el(window.TicketCard.default, p)
            ))
          ));
          setTimeout(() => window.print(), 400);
          return null;
        }
        ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
      <\/script>
    </body></html>`);
    printWindow.document.close();
  };

  const downloadCard = async (card) => {
    try {
      const props = getTicketProps(card);
      const QRCode = (await import('qrcode')).default;
      const qrDataUrl = await QRCode.toDataURL(card.unique_key, {
        width: 460, margin: 0,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });

      const W = 680, PAD = 40;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#F2F3F5';
      ctx.fillRect(0, 0, W, 1200);

      // Card
      const cardX = PAD, cardTop = 20, cardW = W - PAD * 2;
      const radius = 24;

      // Badge
      const badgeR = 32;
      const badgeCX = W / 2, badgeCY = cardTop + badgeR;
      ctx.beginPath();
      ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '700 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(props.orgLogoText, badgeCX, badgeCY);

      // Card white rect
      const cardY = cardTop + badgeR + 8;
      ctx.fillStyle = '#fff';
      roundRect(ctx, cardX, cardY, cardW, 800, radius);
      ctx.fill();
      ctx.shadowColor = 'rgba(0,0,0,0.08)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 4;

      // Title
      let y = cardY + 56;
      ctx.fillStyle = '#111111';
      ctx.font = '700 22px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(truncate(ctx, props.eventTitle, cardW - 40), W / 2, y);

      // Subtitle
      if (props.eventSubtitle) {
        y += 28;
        ctx.fillStyle = '#2563EB';
        ctx.font = '500 15px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(truncate(ctx, props.eventSubtitle, cardW - 40), W / 2, y);
      }

      // QR
      y += 24;
      const qrSize = 230;
      const qrBoxSize = qrSize + 32;
      const qrBoxX = (W - qrBoxSize) / 2;
      ctx.fillStyle = '#F3F4F6';
      roundRect(ctx, qrBoxX, y, qrBoxSize, qrBoxSize, 16);
      ctx.fill();

      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise(r => { qrImg.onload = r; qrImg.onerror = r; });
      const qrDrawX = (W - qrSize) / 2;
      const qrDrawY = y + 16;
      ctx.drawImage(qrImg, qrDrawX, qrDrawY, qrSize, qrSize);

      // QR center badge
      const qrCX = W / 2, qrCY = qrDrawY + qrSize / 2;
      ctx.beginPath();
      ctx.arc(qrCX, qrCY, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '700 18px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(props.qrCenterInitial, qrCX, qrCY);

      // Guest name box
      y = qrDrawY + qrSize + 24;
      const nameBoxH = 56;
      ctx.fillStyle = '#F3F4F6';
      roundRect(ctx, PAD + 24, y, cardW - 48, nameBoxH, 12);
      ctx.fill();
      ctx.fillStyle = '#6B7280';
      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.letterSpacing = '1px';
      ctx.fillText('GUEST NAME', PAD + 40, y + 10);
      ctx.fillStyle = '#111111';
      ctx.font = '700 18px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(truncate(ctx, props.guestName, cardW - 80), PAD + 40, y + 30);

      // Divider
      y += nameBoxH + 24;
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PAD + 48, y);
      ctx.lineTo(W - PAD - 48, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Scissors
      ctx.fillStyle = '#6B7280';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✂', W / 2, y);

      // Notches
      ctx.fillStyle = '#F2F3F5';
      ctx.beginPath();
      ctx.arc(cardX, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cardX + cardW, y, 14, 0, Math.PI * 2);
      ctx.fill();

      // Footer
      y += 28;
      const colW = (cardW - 48) / 2;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#6B7280';
      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('DATE & TIME', PAD + 24, y);
      ctx.fillStyle = '#111111';
      ctx.font = '700 15px -apple-system, BlinkMacSystemFont, sans-serif';
      if (props.date) ctx.fillText(props.date, PAD + 24, y + 18);
      if (props.time) ctx.fillText(props.time, PAD + 24, y + 36);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#6B7280';
      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('LOCATION', W - PAD - 24, y);
      ctx.fillStyle = '#111111';
      ctx.font = '700 15px -apple-system, BlinkMacSystemFont, sans-serif';
      if (props.locationLine1) ctx.fillText(truncate(ctx, props.locationLine1, colW), W - PAD - 24, y + 18);
      if (props.locationLine2) ctx.fillText(truncate(ctx, props.locationLine2, colW), W - PAD - 24, y + 36);

      // Clip card to rounded rect and export
      const finalH = y + 60;
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = W;
      finalCanvas.height = finalH;
      const fctx = finalCanvas.getContext('2d');
      fctx.fillStyle = '#F2F3F5';
      fctx.fillRect(0, 0, W, finalH);
      fctx.drawImage(canvas, 0, 0);

      const link = document.createElement('a');
      link.download = `ticket-${card.guest_name}.png`;
      link.href = finalCanvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      notify.error('Failed to generate ticket image');
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
            <div key={card.id} className="card-item" style={{ overflow: 'visible' }}>
              <div className="card-preview" style={{
                padding: 0, overflow: 'hidden',
                background: 'transparent',
                borderBottom: 'none',
              }}>
                <div style={{
                  transform: 'scale(0.42)',
                  transformOrigin: 'top center',
                  width: 680,
                  marginBottom: -440,
                  pointerEvents: 'none',
                }}>
                  <TicketCard {...getTicketProps(card)} embedded />
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

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function truncate(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  while (text.length > 0 && ctx.measureText(text + '…').width > maxW) {
    text = text.slice(0, -1);
  }
  return text + '…';
}
