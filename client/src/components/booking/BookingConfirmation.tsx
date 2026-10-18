import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Download, RotateCcw, Home } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { jsPDF } from 'jspdf';

export default function BookingConfirmation({ booking, onReset }: { booking: any; onReset: () => void }) {
  const { data: settings } = useSettings();
  const [isDownloading, setIsDownloading] = useState(false);

  // Scroll to top on mount immediately
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

  // Business info from settings with fallbacks
  const businessName = settings?.businessName || 'Atrios Entertainment';
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

  // Direct Vector PDF Generation using jsPDF (100% reliable, never blank)
  const handleDownloadReceipt = () => {
    setIsDownloading(true);

    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const contentWidth = pageWidth - (margin * 2);
      const rightX = pageWidth - margin;

      let y = 20;

      // Header Left: Business Name & Details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.setTextColor(17, 17, 17);
      doc.text(businessName.toUpperCase(), margin, y);

      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(85, 85, 85);
      doc.text(businessAddress, margin, y);
      y += 4.5;
      doc.text(`${businessPhone}  ·  ${businessEmail}`, margin, y);

      // Header Right: Reference & Status Badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.text('BOOKING RECEIPT', rightX, 16, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 76, 129);
      doc.text(bookingRef, rightX, 22.5, { align: 'right' });

      // Status Pill: Confirmed
      doc.setDrawColor(16, 185, 129);
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(rightX - 30, 25.5, 30, 6, 3, 3, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(4, 120, 87);
      doc.text('● CONFIRMED', rightX - 15, 29.8, { align: 'center' });

      // Horizontal Divider
      y = 35;
      doc.setDrawColor(20, 20, 20);
      doc.setLineWidth(0.6);
      doc.line(margin, y, rightX, y);

      // Customer Details & Session Schedule Card
      y += 6;
      const cardY = y;
      const cardH = 28;
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, cardY, contentWidth, cardH, 3, 3, 'FD');

      // Left Column: Customer Details
      const col1X = margin + 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text('CUSTOMER DETAILS', col1X, cardY + 7);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(20, 20, 20);
      doc.text(customerName, col1X, cardY + 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(90, 90, 90);
      doc.text(`Phone: ${customerPhone}`, col1X, cardY + 18.5);
      if (customerEmail && customerEmail !== '—') {
        doc.text(`Email: ${customerEmail}`, col1X, cardY + 23.5);
      }

      // Right Column: Session Schedule
      const col2X = margin + (contentWidth / 2) + 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text('SESSION SCHEDULE', col2X, cardY + 7);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(20, 20, 20);
      doc.text(formattedDate, col2X, cardY + 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(90, 90, 90);
      doc.text(`Start Time: ${booking.startTime || '—'}`, col2X, cardY + 18.5);
      doc.text(`Duration: ${duration} Minutes`, col2X, cardY + 23.5);

      // Items Table Header
      y = cardY + cardH + 8;
      const tableHeaderH = 8;
      doc.setFillColor(243, 244, 246);
      doc.rect(margin, y, contentWidth, tableHeaderH, 'F');
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y + tableHeaderH, rightX, y + tableHeaderH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text('DESCRIPTION', margin + 4, y + 5.5);
      doc.text('PLAYERS', margin + 95, y + 5.5, { align: 'center' });
      doc.text('DURATION', margin + 135, y + 5.5, { align: 'center' });
      doc.text('AMOUNT', rightX - 4, y + 5.5, { align: 'right' });

      // Table Row
      const rowY = y + tableHeaderH;
      const rowH = 16;
      doc.setDrawColor(238, 238, 238);
      doc.line(margin, rowY + rowH, rightX, rowY + rowH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(20, 20, 20);
      doc.text(experienceTitle, margin + 4, rowY + 6.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text('Gaming & entertainment station booking', margin + 4, rowY + 11.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      const playersLabel = `${personCount} ${personCount > 1 ? 'Players' : 'Player'}`;
      doc.text(playersLabel, margin + 95, rowY + 9, { align: 'center' });
      doc.text(`${duration} Mins`, margin + 135, rowY + 9, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(20, 20, 20);
      doc.text(`Rs. ${totalAmount.toLocaleString()}`, rightX - 4, rowY + 9, { align: 'right' });

      // Total Payable on Arrival Banner
      y = rowY + rowH + 8;
      const totalH = 18;
      doc.setFillColor(17, 17, 17);
      doc.roundedRect(margin, y, contentWidth, totalH, 3, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(220, 220, 220);
      doc.text('TOTAL PAYABLE ON ARRIVAL', margin + 6, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text('Payment Method: Pay at Venue (Cash / Card)', margin + 6, y + 13);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(`Rs. ${totalAmount.toLocaleString()}`, rightX - 6, y + 11.5, { align: 'right' });

      // Arrival Instructions Box
      y += totalH + 6;
      const noteH = 14;
      doc.setFillColor(240, 247, 255);
      doc.roundedRect(margin, y, contentWidth, noteH, 2, 2, 'F');
      doc.setFillColor(59, 130, 246);
      doc.rect(margin, y, 2.5, noteH, 'F'); // Blue left border

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 58, 138);
      doc.text('Arrival Instructions:', margin + 6, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(71, 85, 105);
      const noteText = `Please arrive 10 minutes prior to your scheduled time (${booking.startTime || '—'}). Present this receipt or your Reference No. (${bookingRef}) at the reception counter.`;
      const splitText = doc.splitTextToSize(noteText, contentWidth - 12);
      doc.text(splitText, margin + 6, y + 10);

      // Footer
      y += noteH + 12;
      doc.setDrawColor(210, 210, 210);
      if (typeof (doc as any).setLineDashPattern === 'function') {
        (doc as any).setLineDashPattern([2, 2], 0);
      }
      doc.line(margin, y, rightX, y);
      if (typeof (doc as any).setLineDashPattern === 'function') {
        (doc as any).setLineDashPattern([], 0);
      }

      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(90, 90, 90);
      doc.text(`Thank you for choosing ${businessName}!`, pageWidth / 2, y, { align: 'center' });

      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(130, 130, 130);
      doc.text(`For cancellations or inquiries, please contact us at ${businessPhone}.`, pageWidth / 2, y, { align: 'center' });

      doc.save(`Receipt-${bookingRef}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF receipt:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Confirmed Card */}
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
