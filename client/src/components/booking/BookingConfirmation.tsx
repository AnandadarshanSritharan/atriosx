import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Download, RotateCcw, Home } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

export default function BookingConfirmation({ booking, onReset }: { booking: any; onReset: () => void }) {
  const { data: settings } = useSettings();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

  // Direct PDF Download of the clean white invoice
  const handleDownloadReceipt = async () => {
    if (!invoiceRef.current) return;
    setIsDownloading(true);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Receipt-${bookingRef}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    try {
      let html2pdf = (window as any).html2pdf;
      if (typeof html2pdf !== 'function') {
        // Load dynamically if CDN script not ready
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load html2pdf'));
          document.head.appendChild(s);
        });
        html2pdf = (window as any).html2pdf;
      }

      await html2pdf().set(opt).from(invoiceRef.current).save();
    } catch (err) {
      console.error('Failed to download PDF:', err);
      // Fallback: Open clean printable window
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
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #111; margin: 0; padding: 24px; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #111; }
    .brand-title { font-size: 22px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; color: #000; margin: 0 0 4px 0; }
    .brand-sub { font-size: 11px; color: #555; line-height: 1.4; }
    .receipt-title { font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #666; text-align: right; }
    .ref-number { font-size: 18px; font-weight: 900; color: #0f4c81; font-family: monospace; letter-spacing: 0.05em; text-align: right; margin: 2px 0 6px 0; }
    .badge { display: inline-block; background: #ecfdf5; border: 1px solid #10b981; color: #047857; font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; }
    .info-card { display: flex; gap: 20px; padding: 16px 20px; background: #fafafa; border-radius: 10px; border: 1px solid #eeeeee; margin: 20px 0; }
    .info-col { flex: 1; }
    .info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #777; margin-bottom: 4px; }
    .info-val { font-size: 14px; font-weight: 800; color: #111; }
    .info-sub { font-size: 12px; color: #555; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f4f4f4; border-bottom: 1px solid #e0e0e0; padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #555; }
    td { padding: 14px 12px; font-size: 13px; border-bottom: 1px solid #eeeeee; }
    .total-banner { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #111; color: #fff; border-radius: 10px; margin-bottom: 20px; }
    .total-label { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #ccc; }
    .total-sub { font-size: 11px; color: #999; margin-top: 2px; }
    .total-val { font-size: 22px; font-weight: 900; color: #fff; }
    .instruction-box { padding: 12px 16px; background: #f8fafc; border-left: 3px solid #3b82f6; border-radius: 6px; font-size: 11px; color: #475569; line-height: 1.6; margin-bottom: 20px; }
    .footer { text-align: center; border-top: 1px dashed #ddd; padding-top: 16px; font-size: 11px; color: #888; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">${businessName}</div>
      <div class="brand-sub">${businessAddress}<br/>${businessPhone} · ${businessEmail}</div>
    </div>
    <div style="text-align: right;">
      <div class="receipt-title">BOOKING RECEIPT</div>
      <div class="ref-number">${bookingRef}</div>
      <span class="badge">● CONFIRMED</span>
    </div>
  </div>

  <div class="info-card">
    <div class="info-col">
      <div class="info-label">Customer Details</div>
      <div class="info-val">${customerName}</div>
      <div class="info-sub">Phone: ${customerPhone}</div>
      ${customerEmail !== '—' ? `<div class="info-sub">Email: ${customerEmail}</div>` : ''}
    </div>
    <div class="info-col">
      <div class="info-label">Session Schedule</div>
      <div class="info-val">${formattedDate}</div>
      <div class="info-sub">Start Time: <strong>${booking.startTime}</strong></div>
      <div class="info-sub">Duration: <strong>${duration} Minutes</strong></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align: left;">Description</th>
        <th style="text-align: center;">Players</th>
        <th style="text-align: center;">Duration</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align: left;">
          <strong>${experienceTitle}</strong>
          <div style="font-size: 11px; color: #666; margin-top: 2px;">Gaming & entertainment station booking</div>
        </td>
        <td style="text-align: center;">${personCount} ${personCount > 1 ? 'Players' : 'Player'}</td>
        <td style="text-align: center;">${duration} Mins</td>
        <td style="text-align: right; font-weight: 800;">Rs. ${totalAmount.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <div class="total-banner">
    <div>
      <div class="total-label">Total Payable on Arrival</div>
      <div class="total-sub">Payment Method: Pay at Venue (Cash / Card)</div>
    </div>
    <div class="total-val">Rs. ${totalAmount.toLocaleString()}</div>
  </div>

  <div class="instruction-box">
    <strong>Arrival Instructions:</strong> Please arrive 10 minutes prior to your scheduled time (${booking.startTime}). Present this receipt or your Reference No. (<strong>${bookingRef}</strong>) at the reception counter.
  </div>

  <div class="footer">
    Thank you for choosing <strong>${businessName}</strong>!<br/>
    For cancellations or inquiries, please contact us at ${businessPhone}.
  </div>
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
    <>
      {/* Print CSS overrides */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #atrios-invoice-document, #atrios-invoice-document * {
            visibility: visible !important;
          }
          #atrios-invoice-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Dark Header Card with Action Buttons */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #2a2a2a',
            borderRadius: '16px',
            padding: '32px 28px',
            textAlign: 'center',
            color: '#ffffff',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#2d7a4f20',
              border: '1px solid #2d7a4f50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle2 size={30} color="#2d7a4f" />
          </div>

          <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2d7a4f', marginBottom: '6px' }}>
            Booking Confirmed
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '6px' }}>
            You're All Set!
          </h2>
          <p style={{ color: '#8b8b8b', fontSize: '0.86rem', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            Your reservation has been confirmed. You can download your official booking receipt below or show reference{' '}
            <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>{bookingRef}</strong> at the reception counter.
          </p>

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
                background: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                color: '#000000',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: isDownloading ? 'wait' : 'pointer',
                opacity: isDownloading ? 0.7 : 1,
                letterSpacing: '0.02em',
                boxShadow: '0 4px 14px rgba(255,255,255,0.2)',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => !isDownloading && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
            >
              <Download size={16} /> {isDownloading ? 'Downloading PDF...' : 'Download Receipt'}
            </button>

            <button
              type="button"
              onClick={onReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                background: '#181818',
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

        {/* Clean Official White Paper Receipt / Invoice */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            padding: '24px 20px',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <div
              ref={invoiceRef}
              id="atrios-invoice-document"
              style={{
                width: '100%',
                minWidth: '600px',
                maxWidth: '720px',
                margin: '0 auto',
                background: '#ffffff',
                color: '#111111',
                padding: '24px 20px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                boxSizing: 'border-box',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #111111',
                  marginBottom: '20px',
                  gap: '16px',
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: '22px',
                      fontWeight: 900,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: '#000000',
                      margin: '0 0 6px 0',
                    }}
                  >
                    {businessName}
                  </h1>
                  <div style={{ fontSize: '11px', color: '#555555', lineHeight: '1.45' }}>
                    {businessAddress}
                    <br />
                    {businessPhone} · {businessEmail}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#666666',
                      marginBottom: '2px',
                    }}
                  >
                    BOOKING RECEIPT
                  </div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 900,
                      color: '#0f4c81',
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em',
                      marginBottom: '6px',
                    }}
                  >
                    {bookingRef}
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      background: '#ecfdf5',
                      border: '1px solid #10b981',
                      color: '#047857',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '20px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    ● CONFIRMED
                  </span>
                </div>
              </div>

              {/* Customer Details & Schedule Box */}
              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  padding: '16px 20px',
                  background: '#fafafa',
                  borderRadius: '10px',
                  border: '1px solid #eeeeee',
                  marginBottom: '24px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#777777',
                      marginBottom: '4px',
                    }}
                  >
                    Customer Details
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#111111' }}>{customerName}</div>
                  <div style={{ fontSize: '12px', color: '#555555', marginTop: '2px' }}>Phone: {customerPhone}</div>
                  {customerEmail && customerEmail !== '—' && (
                    <div style={{ fontSize: '12px', color: '#555555' }}>Email: {customerEmail}</div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#777777',
                      marginBottom: '4px',
                    }}
                  >
                    Session Schedule
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#111111' }}>{formattedDate}</div>
                  <div style={{ fontSize: '12px', color: '#555555', marginTop: '2px' }}>
                    Start Time: <strong style={{ color: '#111111' }}>{booking.startTime}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#555555' }}>
                    Duration: <strong style={{ color: '#111111' }}>{duration} Minutes</strong>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '22px' }}>
                <thead>
                  <tr style={{ background: '#f4f4f4', borderBottom: '1px solid #e0e0e0' }}>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#555555',
                      }}
                    >
                      Description
                    </th>
                    <th
                      style={{
                        textAlign: 'center',
                        padding: '10px 14px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#555555',
                      }}
                    >
                      Players
                    </th>
                    <th
                      style={{
                        textAlign: 'center',
                        padding: '10px 14px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#555555',
                      }}
                    >
                      Duration
                    </th>
                    <th
                      style={{
                        textAlign: 'right',
                        padding: '10px 14px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#555555',
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #eeeeee' }}>
                    <td style={{ textAlign: 'left', padding: '14px', fontSize: '13px', color: '#111111' }}>
                      <strong style={{ display: 'block', fontSize: '13px' }}>{experienceTitle}</strong>
                      <div style={{ fontSize: '11px', color: '#666666', marginTop: '2px' }}>
                        Gaming & entertainment station booking
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '14px', fontSize: '13px', color: '#333333' }}>
                      {personCount} {personCount > 1 ? 'Players' : 'Player'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '14px', fontSize: '13px', color: '#333333' }}>
                      {duration} Mins
                    </td>
                    <td style={{ textAlign: 'right', padding: '14px', fontSize: '13px', fontWeight: 800, color: '#111111' }}>
                      Rs. {totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Total Payable Box */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: '#111111',
                  color: '#ffffff',
                  borderRadius: '10px',
                  marginBottom: '22px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#cccccc',
                    }}
                  >
                    Total Payable on Arrival
                  </div>
                  <div style={{ fontSize: '11px', color: '#999999', marginTop: '2px' }}>
                    Payment Method: Pay at Venue (Cash / Card)
                  </div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff' }}>
                  Rs. {totalAmount.toLocaleString()}
                </div>
              </div>

              {/* Arrival Instructions */}
              <div
                style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderLeft: '3px solid #3b82f6',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#475569',
                  lineHeight: '1.6',
                  marginBottom: '22px',
                }}
              >
                <strong>Arrival Instructions:</strong> Please arrive 10 minutes prior to your scheduled time ({booking.startTime}).
                Present this receipt or your Reference No. (<strong>{bookingRef}</strong>) at the reception counter.
              </div>

              {/* Footer Note */}
              <div
                style={{
                  textAlign: 'center',
                  borderTop: '1px dashed #dddddd',
                  paddingTop: '16px',
                  fontSize: '11px',
                  color: '#888888',
                  lineHeight: '1.5',
                }}
              >
                Thank you for choosing <strong>{businessName}</strong>!<br />
                For cancellations or inquiries, please contact us at {businessPhone}.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
