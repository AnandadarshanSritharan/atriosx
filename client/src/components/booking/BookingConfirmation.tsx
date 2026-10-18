import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Download, RotateCcw, Home } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

export default function BookingConfirmation({ booking, onReset }: { booking: any; onReset: () => void }) {
  const { data: settings } = useSettings();
  const [isDownloading, setIsDownloading] = useState(false);

  // Scroll to top on mount immediately to fix scroll position
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  // Business info from settings with graceful fallbacks
  const businessName = settings?.businessName || 'ATRIOS ENTERTAINMENT';
  const businessAddress = settings?.address || 'No. 146, Nursing Home Road, Hatton, Sri Lanka';
  const businessPhone = settings?.phone || '051 222 3132';
  const businessEmail = settings?.email || 'atriosentertainment@gmail.com';

  // Experience and booking details
  const experienceTitle = booking.categoryName || booking.facility?.name || booking.facilityName || 'Entertainment Experience';
  const duration = booking.durationMinutes || booking.duration || 60;
  const customerName = booking.customer?.name || booking.customerName || booking.name || 'Valued Guest';
  const customerPhone = booking.customer?.phone || booking.customerPhone || booking.phone || '—';
  const customerEmail = booking.customer?.email || booking.customerEmail || booking.email || '—';
  const bookingRef = booking.bookingNumber || (booking.id ? `ATR-${String(booking.id).padStart(6, '0')}` : 'ATR-000001');
  const totalAmount = Number(booking.total || booking.totalAmount || 0);
  const personCount = Number(booking.personCount || 1);

  const formattedDate = booking.date
    ? new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  // Build the clean, official white paper invoice HTML for direct download
  const buildInvoiceHtml = () => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #111111; padding: 24px 20px; background: #ffffff; width: 700px; margin: 0 auto; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #111111; margin-bottom: 20px; gap: 16px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; color: #000000; margin: 0 0 6px 0;">${businessName}</h1>
          <div style="font-size: 11px; color: #555555; line-height: 1.45;">
            ${businessAddress}<br/>
            ${businessPhone} · ${businessEmail}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #666666; margin-bottom: 2px;">BOOKING RECEIPT</div>
          <div style="font-size: 18px; font-weight: 900; color: #0f4c81; font-family: monospace; letter-spacing: 0.05em; margin-bottom: 6px;">${bookingRef}</div>
          <span style="display: inline-block; background: #ecfdf5; border: 1px solid #10b981; color: #047857; font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.04em;">● CONFIRMED</span>
        </div>
      </div>

      <div style="display: flex; gap: 20px; padding: 16px 20px; background: #fafafa; border-radius: 10px; border: 1px solid #eeeeee; margin-bottom: 24px;">
        <div style="flex: 1;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #777777; margin-bottom: 4px;">Customer Details</div>
          <div style="font-size: 14px; font-weight: 800; color: #111111;">${customerName}</div>
          <div style="font-size: 12px; color: #555555; margin-top: 2px;">Phone: ${customerPhone}</div>
          ${customerEmail && customerEmail !== '—' ? `<div style="font-size: 12px; color: #555555;">Email: ${customerEmail}</div>` : ''}
        </div>
        <div style="flex: 1;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #777777; margin-bottom: 4px;">Session Schedule</div>
          <div style="font-size: 14px; font-weight: 800; color: #111111;">${formattedDate}</div>
          <div style="font-size: 12px; color: #555555; margin-top: 2px;">Start Time: <strong style="color: #111111;">${booking.startTime}</strong></div>
          <div style="font-size: 12px; color: #555555;">Duration: <strong style="color: #111111;">${duration} Minutes</strong></div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px;">
        <thead>
          <tr style="background: #f4f4f4; border-bottom: 1px solid #e0e0e0;">
            <th style="text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #555555;">Description</th>
            <th style="text-align: center; padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #555555;">Players</th>
            <th style="text-align: center; padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #555555;">Duration</th>
            <th style="text-align: right; padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #555555;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #eeeeee;">
            <td style="text-align: left; padding: 14px; font-size: 13px; color: #111111;">
              <strong style="display: block; font-size: 13px;">${experienceTitle}</strong>
              <div style="font-size: 11px; color: #666666; margin-top: 2px;">Gaming & entertainment station booking</div>
            </td>
            <td style="text-align: center; padding: 14px; font-size: 13px; color: #333333;">${personCount} ${personCount > 1 ? 'Players' : 'Player'}</td>
            <td style="text-align: center; padding: 14px; font-size: 13px; color: #333333;">${duration} Mins</td>
            <td style="text-align: right; padding: 14px; font-size: 13px; font-weight: 800; color: #111111;">Rs. ${totalAmount.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #111111; color: #ffffff; border-radius: 10px; margin-bottom: 22px;">
        <div>
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #cccccc;">Total Payable on Arrival</div>
          <div style="font-size: 11px; color: #999999; margin-top: 2px;">Payment Method: Pay at Venue (Cash / Card)</div>
        </div>
        <div style="font-size: 20px; font-weight: 900; color: #ffffff;">Rs. ${totalAmount.toLocaleString()}</div>
      </div>

      <div style="padding: 12px 16px; background: #f8fafc; border-left: 3px solid #3b82f6; border-radius: 6px; font-size: 11px; color: #475569; line-height: 1.6; margin-bottom: 22px;">
        <strong>Arrival Instructions:</strong> Please arrive 10 minutes prior to your scheduled time (${booking.startTime}). Present this receipt or your Reference No. (<strong>${bookingRef}</strong>) at the reception counter.
      </div>

      <div style="text-align: center; border-top: 1px dashed #dddddd; padding-top: 16px; font-size: 11px; color: #888888; line-height: 1.5;">
        Thank you for choosing <strong>${businessName}</strong>!<br/>
        For cancellations or inquiries, please contact us at ${businessPhone}.
      </div>
    </div>
  `;

  // Direct PDF Download
  const handleDownloadReceipt = async () => {
    setIsDownloading(true);

    const invoiceContainer = document.createElement('div');
    invoiceContainer.style.width = '700px';
    invoiceContainer.style.background = '#ffffff';
    invoiceContainer.style.boxSizing = 'border-box';
    invoiceContainer.innerHTML = buildInvoiceHtml();

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Receipt-${bookingRef}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    try {
      let html2pdf = (window as any).html2pdf;
      if (typeof html2pdf !== 'function') {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load html2pdf'));
          document.head.appendChild(s);
        });
        html2pdf = (window as any).html2pdf;
      }

      await html2pdf().set(opt).from(invoiceContainer).save();
    } catch (err) {
      console.error('Failed to download PDF:', err);
      openPrintWindow();
    } finally {
      setIsDownloading(false);
    }
  };

  const openPrintWindow = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      window.print();
      return;
    }
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${bookingRef}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { margin: 0; padding: 20px; background: #fff; }
  </style>
</head>
<body>
  ${buildInvoiceHtml()}
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Confirmed Card with summary and actions */}
      <div
        style={{
          background: '#111111',
          border: '1px solid #2a2a2a',
          borderRadius: '16px',
          padding: '36px 32px',
          textAlign: 'center',
          color: '#ffffff',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#2d7a4f20',
            border: '1px solid #2d7a4f50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
          }}
        >
          <CheckCircle2 size={32} color="#2d7a4f" />
        </div>

        <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2d7a4f', marginBottom: '6px' }}>
          Booking Confirmed
        </div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '6px' }}>
          You're All Set!
        </h2>
        <p style={{ color: '#8b8b8b', fontSize: '0.86rem', maxWidth: '480px', margin: '0 auto 26px', lineHeight: 1.5 }}>
          Your reservation has been confirmed. You can download your official receipt below or present reference{' '}
          <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>{bookingRef}</strong> on arrival.
        </p>

        {/* Booking Summary Box */}
        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid #262626',
            borderRadius: '14px',
            overflow: 'hidden',
            textAlign: 'left',
            marginBottom: '28px',
          }}
        >
          {/* Header row */}
          <div
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(180deg, #161616 0%, #101010 100%)',
              borderBottom: '1px solid #262626',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.68rem', color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                Booking Reference
              </span>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                {bookingRef}
              </span>
            </div>
            <div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: '#2d7a4f15',
                  color: '#2d7a4f',
                  border: '1px solid #2d7a4f40',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                ● Confirmed
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ padding: '20px 22px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '16px',
                paddingBottom: '18px',
                borderBottom: '1px solid #1a1a1a',
                marginBottom: '18px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.68rem', color: '#6b6b6b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Experience
                </div>
                <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 800 }}>{experienceTitle}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: '#6b6b6b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Date
                </div>
                <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 800 }}>{booking.date}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: '#6b6b6b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Time & Duration
                </div>
                <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 800 }}>
                  {booking.startTime} ({duration}m)
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: '#6b6b6b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Group Size
                </div>
                <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 800 }}>
                  {personCount} {personCount > 1 ? 'Players' : 'Player'}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '16px',
                paddingBottom: '18px',
                borderBottom: '1px solid #1a1a1a',
                marginBottom: '18px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.68rem', color: '#6b6b6b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Guest Name
                </div>
                <div style={{ fontSize: '0.88rem', color: '#c0c0c0', fontWeight: 700 }}>{customerName}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: '#6b6b6b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Phone
                </div>
                <div style={{ fontSize: '0.88rem', color: '#c0c0c0', fontWeight: 700 }}>{customerPhone}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: '#6b6b6b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Payment Method
                </div>
                <div style={{ fontSize: '0.88rem', color: '#3d85c8', fontWeight: 700 }}>Pay at Venue</div>
              </div>
            </div>

            {/* Total Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                background: '#141414',
                border: '1px solid #242424',
                borderRadius: '10px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', color: '#8b8b8b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block' }}>
                  Total Payable on Arrival
                </span>
                <span style={{ fontSize: '0.72rem', color: '#555555' }}>
                  Cash or Card at Reception
                </span>
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff' }}>
                Rs. {totalAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleDownloadReceipt}
            disabled={isDownloading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: '#c0c0c0',
              border: 'none',
              borderRadius: '8px',
              color: '#000000',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: isDownloading ? 'wait' : 'pointer',
              opacity: isDownloading ? 0.7 : 1,
              letterSpacing: '0.02em',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => !isDownloading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <Download size={16} /> {isDownloading ? 'Generating PDF...' : 'Download Receipt'}
          </button>

          <button
            type="button"
            onClick={onReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              background: '#161616',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#c0c0c0')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
          >
            <RotateCcw size={15} /> Book Another
          </button>

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              background: 'transparent',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              color: '#c0c0c0',
              fontWeight: 600,
              fontSize: '0.85rem',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#c0c0c0')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
          >
            <Home size={15} /> Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
