import { Outlet } from 'react-router-dom';
import { PublicNavbar } from './PublicNavbar';

export function PublicLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0a0a0a', color: '#ffffff' }}>
      <PublicNavbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer
        style={{
          borderTop: '1px solid #2a2a2a',
          padding: '40px 24px',
          textAlign: 'center',
          backgroundColor: '#060606',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.15em', color: '#ffffff', display: 'block', marginBottom: '12px' }}>
            ATRIOS ENTERTAINMENT
          </span>
          <p style={{ color: '#6b6b6b', fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            © {new Date().getFullYear()} Atrios Entertainment. All rights reserved.
          </p>
          <div style={{ marginTop: '14px' }}>
            <a href="/admin/login" style={{ color: '#8b8b8b', fontSize: '0.75rem', textDecoration: 'none', transition: 'color 0.2s' }}
               onMouseEnter={e => (e.currentTarget.style.color = '#c0c0c0')}
               onMouseLeave={e => (e.currentTarget.style.color = '#8b8b8b')}>
              Staff / Admin Login →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
