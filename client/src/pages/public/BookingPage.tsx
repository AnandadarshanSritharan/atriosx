import BookingWizard from '@/components/booking/BookingWizard';

export default function BookingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#ffffff', paddingTop: '96px', paddingBottom: '60px', paddingLeft: '24px', paddingRight: '24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c0c0c0', marginBottom: '12px' }}>
            Reserve Your Spot
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '14px' }}>
            Book Your Session
          </h1>
          <p style={{ color: '#6b6b6b', fontSize: '0.95rem', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
            Select your premium entertainment experience, choose a convenient time, and get ready to play. No account or payment required.
          </p>
        </div>
        <BookingWizard />
      </div>
    </div>
  );
}
