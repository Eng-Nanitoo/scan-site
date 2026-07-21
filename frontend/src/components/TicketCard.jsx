import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ChevronLeft, Share2, Scissors } from 'lucide-react';

const COLORS = {
  navy: '#111827',
  blue: '#2563EB',
  pageBg: '#F2F3F5',
  cardBg: '#FFFFFF',
  grayBg: '#F3F4F6',
  grayLabel: '#6B7280',
  blackText: '#111111',
  divider: '#D1D5DB',
};

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function useQrDataUrl(value, size = 230) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      width: size,
      margin: 0,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }).then(setUrl);
  }, [value, size]);
  return url;
}

export default function TicketCard({
  orgLogoText = '',
  eventTitle = '',
  eventSubtitle = '',
  qrValue = '',
  qrCenterInitial = '',
  guestName = '',
  date = '',
  time = '',
  locationLine1 = '',
  locationLine2 = '',
  embedded = false,
  onBack,
}) {
  const qrUrl = useQrDataUrl(qrValue, 230);

  const cardInner = (
    <>
      {/* Top badge */}
      <div style={{
        width: 64, height: 64,
        borderRadius: '50%',
        background: COLORS.navy,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: embedded ? '-32px auto 0' : '-32px auto 0',
        position: 'relative', zIndex: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        flexShrink: 0,
      }}>
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>
          {orgLogoText}
        </span>
      </div>

      {/* Card body */}
      <div style={{
        background: COLORS.cardBg,
        borderRadius: 24,
        boxShadow: embedded
          ? '0 2px 12px rgba(0,0,0,0.06)'
          : '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'visible',
        position: 'relative',
      }}>
        {/* Title + Subtitle */}
        <div style={{ padding: '44px 24px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.blackText, lineHeight: 1.3 }}>
            {eventTitle}
          </div>
          {eventSubtitle && (
            <div style={{ fontSize: 15, fontWeight: 500, color: COLORS.blue, marginTop: 6 }}>
              {eventSubtitle}
            </div>
          )}
        </div>

        {/* QR Code block */}
        <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            background: COLORS.grayBg,
            borderRadius: 16,
            padding: 16,
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {qrUrl ? (
              <img src={qrUrl} alt="QR Code" width={230} height={230}
                style={{ display: 'block', borderRadius: 8 }} />
            ) : (
              <div style={{ width: 230, height: 230, background: '#e5e7eb', borderRadius: 8 }} />
            )}
            {qrCenterInitial && (
              <div style={{
                position: 'absolute',
                width: 48, height: 48,
                borderRadius: '50%',
                background: COLORS.navy,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}>
                <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>
                  {qrCenterInitial}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Guest name */}
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ background: COLORS.grayBg, borderRadius: 12, padding: '12px 16px' }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: COLORS.grayLabel,
              textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2,
            }}>
              Guest Name
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.blackText }}>
              {guestName}
            </div>
          </div>
        </div>

        {/* Divider with notches */}
        <div style={{ position: 'relative', margin: '24px 0 0', height: 40 }}>
          <div style={{
            position: 'absolute', left: -14, top: '50%',
            transform: 'translateY(-50%)',
            width: 28, height: 28, borderRadius: '50%',
            background: embedded ? 'transparent' : COLORS.pageBg,
            zIndex: 2,
          }} />
          <div style={{
            position: 'absolute', right: -14, top: '50%',
            transform: 'translateY(-50%)',
            width: 28, height: 28, borderRadius: '50%',
            background: embedded ? 'transparent' : COLORS.pageBg,
            zIndex: 2,
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: 24, right: 24,
            borderTop: `2px dashed ${COLORS.divider}`,
            transform: 'translateY(-50%)',
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: COLORS.cardBg, padding: '0 6px', zIndex: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Scissors size={16} style={{ color: COLORS.grayLabel, transform: 'rotate(90deg)' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: COLORS.grayLabel,
              textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4,
            }}>
              Date & Time
            </div>
            {date && <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.blackText, lineHeight: 1.4 }}>{date}</div>}
            {time && <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.blackText, lineHeight: 1.4 }}>{time}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: COLORS.grayLabel,
              textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4,
            }}>
              Location
            </div>
            {locationLine1 && <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.blackText, lineHeight: 1.4 }}>{locationLine1}</div>}
            {locationLine2 && <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.blackText, lineHeight: 1.4 }}>{locationLine2}</div>}
          </div>
        </div>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {cardInner}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.pageBg,
      fontFamily: FONT,
      margin: 0, padding: 0,
    }}>
      {/* Header */}
      <div style={{
        background: COLORS.navy,
        height: 64,
        display: 'flex', alignItems: 'center',
        padding: '0 16px',
        position: 'relative', zIndex: 10,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#fff', padding: 8, display: 'flex', alignItems: 'center',
        }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{
          position: 'absolute', left: 0, right: 0, textAlign: 'center',
          color: '#fff', fontSize: 17, fontWeight: 600, pointerEvents: 'none',
        }}>
          Mon Billet
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#fff', padding: 8, display: 'flex', alignItems: 'center',
          }}>
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* Ticket */}
      <div style={{ position: 'relative', margin: '-20px 16px 24px', zIndex: 5 }}>
        {cardInner}
      </div>
    </div>
  );
}
