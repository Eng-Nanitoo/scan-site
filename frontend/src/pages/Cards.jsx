import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TicketCard from '../components/TicketCard';
import QRCode from 'qrcode';
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
    } catch (error) {
      console.error('Failed to delete card');
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
    } catch (error) {
      console.error('Failed to delete cards');
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

  const buildTicketHtml = (p, qrDataUrl) => `
    <div style="max-width:420px;margin:0 auto;background:#fff;border-radius:24px;
      box-shadow:0 8px 32px rgba(0,0,0,0.08);overflow:visible;position:relative;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
      <div style="width:64px;height:64px;border-radius:50%;background:#111827;
        display:flex;align-items:center;justify-content:center;
        margin:-32px auto 0;position:relative;z-index:6;
        box-shadow:0 2px 8px rgba(0,0,0,0.15)">
        <span style="color:#fff;font-size:14px;font-weight:700;letter-spacing:1px">${esc(p.orgLogoText)}</span>
      </div>
      <div style="padding:44px 24px 0;text-align:center">
        <div style="font-size:22px;font-weight:700;color:#111;line-height:1.3">${esc(p.eventTitle)}</div>
        ${p.eventSubtitle ? `<div style="font-size:15px;font-weight:500;color:#2563EB;margin-top:6px">${esc(p.eventSubtitle)}</div>` : ''}
      </div>
      <div style="padding:24px 24px 0;display:flex;justify-content:center">
        <div style="background:#F3F4F6;border-radius:16px;padding:16px;position:relative;
          display:inline-flex;align-items:center;justify-content:center">
          <img src="${qrDataUrl}" width="230" height="230" style="display:block;border-radius:8px" />
          ${p.qrCenterInitial ? `<div style="position:absolute;width:48px;height:48px;border-radius:50%;background:#111827;
            display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.15)">
            <span style="color:#fff;font-size:18px;font-weight:700">${esc(p.qrCenterInitial)}</span>
          </div>` : ''}
        </div>
      </div>
      <div style="position:relative;margin:24px 0 0;height:40px">
        <div style="position:absolute;left:-14px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:50%;background:#F2F3F5;z-index:2"></div>
        <div style="position:absolute;right:-14px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:50%;background:#F2F3F5;z-index:2"></div>
        <div style="position:absolute;top:50%;left:24px;right:24px;border-top:2px dashed #D1D5DB;transform:translateY(-50%)"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:0 6px;z-index:3;
          display:flex;align-items:center;justify-content:center;font-size:16px;color:#6B7280">✂</div>
      </div>
      <div style="padding:0 24px 24px;display:flex;justify-content:space-between">
        <div style="text-align:left">
          <div style="font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:4px">Date &amp; Time</div>
          ${p.date ? `<div style="font-size:15px;font-weight:700;color:#111;line-height:1.4">${esc(p.date)}</div>` : ''}
          ${p.time ? `<div style="font-size:15px;font-weight:700;color:#111;line-height:1.4">${esc(p.time)}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:4px">Location</div>
          ${p.locationLine1 ? `<div style="font-size:15px;font-weight:700;color:#111;line-height:1.4">${esc(p.locationLine1)}</div>` : ''}
          ${p.locationLine2 ? `<div style="font-size:15px;font-weight:700;color:#111;line-height:1.4">${esc(p.locationLine2)}</div>` : ''}
        </div>
      </div>
    </div>`;

  const printCard = async (card) => {
    const props = getTicketProps(card);
    const qrDataUrl = await QRCode.toDataURL(card.unique_key, {
      width: 460, margin: 0,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    });
    const html = buildTicketHtml(props, qrDataUrl);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>Ticket - ${card.guest_name}</title>
      <style>
        @page{size:portrait;margin:10mm}
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
          display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F2F3F5}
      </style></head><body>${html}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 200);
  };

  const buildTicketPrintHtml = (p, qrDataUrl) => `
    <div style="background:#fff;border-radius:4px;overflow:hidden;position:relative;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      border:1px solid #e5e7eb;width:100%;height:100%;display:flex;flex-direction:column">
      <div style="width:18px;height:18px;border-radius:50%;background:#111827;
        display:flex;align-items:center;justify-content:center;
        margin:-9px auto 0;position:relative;z-index:2;
        box-shadow:0 1px 2px rgba(0,0,0,0.15);flex-shrink:0">
        <span style="color:#fff;font-size:5px;font-weight:700;letter-spacing:0.2px">${esc(p.orgLogoText)}</span>
      </div>
      <div style="padding:3px 3px 0;text-align:center;flex-shrink:0">
        <div style="font-size:6px;font-weight:700;color:#111;line-height:1.1">${esc(p.eventTitle)}</div>
        ${p.eventSubtitle ? `<div style="font-size:5px;font-weight:500;color:#2563EB;margin-top:0.5px">${esc(p.eventSubtitle)}</div>` : ''}
      </div>
      <div style="padding:2px 3px 0;display:flex;justify-content:center;flex-shrink:0">
        <div style="background:#F3F4F6;border-radius:4px;padding:2px;position:relative;
          display:inline-flex;align-items:center;justify-content:center">
          <img src="${qrDataUrl}" width="52" height="52" style="display:block;border-radius:2px" />
          ${p.qrCenterInitial ? `<div style="position:absolute;width:12px;height:12px;border-radius:50%;background:#111827;
            display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(0,0,0,0.15)">
            <span style="color:#fff;font-size:5px;font-weight:700">${esc(p.qrCenterInitial)}</span>
          </div>` : ''}
        </div>
      </div>
      <div style="position:relative;margin:2px 3px 0;height:8px;flex-shrink:0">
        <div style="position:absolute;left:-4px;top:50%;transform:translateY(-50%);width:8px;height:8px;border-radius:50%;background:#F2F3F5;z-index:2"></div>
        <div style="position:absolute;right:-4px;top:50%;transform:translateY(-50%);width:8px;height:8px;border-radius:50%;background:#F2F3F5;z-index:2"></div>
        <div style="position:absolute;top:50%;left:3px;right:3px;border-top:1px dashed #D1D5DB;transform:translateY(-50%)"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:0 1px;z-index:3;
          display:flex;align-items:center;justify-content:center;font-size:5px;color:#6B7280">✂</div>
      </div>
      <div style="padding:0 3px 2px;display:flex;justify-content:space-between;flex-shrink:0">
        <div style="text-align:left">
          <div style="font-size:4px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.2px;margin-bottom:0">Date &amp; Time</div>
          ${p.date ? `<div style="font-size:5.5px;font-weight:700;color:#111;line-height:1.1">${esc(p.date)}</div>` : ''}
          ${p.time ? `<div style="font-size:5.5px;font-weight:700;color:#111;line-height:1.1">${esc(p.time)}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div style="font-size:4px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.2px;margin-bottom:0">Location</div>
          ${p.locationLine1 ? `<div style="font-size:5.5px;font-weight:700;color:#111;line-height:1.1">${esc(p.locationLine1)}</div>` : ''}
          ${p.locationLine2 ? `<div style="font-size:5.5px;font-weight:700;color:#111;line-height:1.1">${esc(p.locationLine2)}</div>` : ''}
        </div>
      </div>
    </div>`;

  const printAllCards = async () => {
    const qrUrls = await Promise.all(
      cards.map(card => QRCode.toDataURL(card.unique_key, {
        width: 360, margin: 0,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      }))
    );

    const pages = [];
    for (let i = 0; i < cards.length; i += 9) {
      pages.push(cards.slice(i, i + 9));
    }

    const pagesHtml = pages.map((page, pi) => {
      const ticketsHtml = page.map((card, ci) => {
        const props = getTicketProps(card);
        return `<div style="width:65mm;height:88mm">${buildTicketPrintHtml(props, qrUrls[pi * 9 + ci])}</div>`;
      }).join('');

      const emptySlots = 9 - page.length;
      const emptyHtml = Array.from({ length: emptySlots }, () =>
        '<div style="width:65mm;height:88mm"></div>'
      ).join('');

      return `<div class="print-page">
        <div class="print-grid">${ticketsHtml}${emptyHtml}</div>
      </div>`;
    }).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>All Tickets</title>
      <style>
        @page{size:A4 portrait;margin:5mm}
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#fff}
        .print-page{
          width:100%;height:100%;
          page-break-after:always;break-after:page;
        }
        .print-page:last-child{page-break-after:auto}
        .print-grid{
          display:grid;
          grid-template-columns:repeat(3,65mm);
          grid-template-rows:repeat(3,88mm);
          gap:1.5mm;
          justify-content:center;
        }
      </style></head><body>${pagesHtml}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400);
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

      // Divider
      y = qrDrawY + qrSize + 24;
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
      console.error('Failed to generate ticket image');
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
            <div key={card.id} className="card-item" style={{ overflow: 'hidden' }}>
              <div style={{
                padding: 0, overflow: 'hidden',
                background: 'transparent',
                borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'center',
                height: 320,
              }}>
                <div style={{
                  transform: 'scale(0.42)',
                  transformOrigin: 'top center',
                  width: 680,
                  flexShrink: 0,
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

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
