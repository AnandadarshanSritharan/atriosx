import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 860);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/experiences', label: 'Experiences' },
    { href: '/games', label: 'Games' },
    { href: '/offers', label: 'Offers' },
    { href: '/news', label: 'News' },
    { href: '/contact', label: 'Contact' },
  ];

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          transition: 'background 0.25s ease, border-color 0.25s ease',
          background: scrolled || mobileOpen ? 'rgba(10,10,10,0.98)' : 'rgba(10,10,10,0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled || mobileOpen ? '1px solid #2a2a2a' : '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: isMobile ? '0 16px' : '0 24px',
            height: isMobile ? '64px' : '72px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontSize: isMobile ? '1.15rem' : '1.35rem',
                fontWeight: 900,
                letterSpacing: '0.14em',
                color: '#ffffff',
                textTransform: 'uppercase',
              }}
            >
              ATRIOS
            </span>
            <span
              style={{
                fontSize: isMobile ? '0.55rem' : '0.65rem',
                fontWeight: 600,
                color: '#8b8b8b',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                display: isMobile ? 'none' : 'inline',
              }}
            >
              ENTERTAINMENT
            </span>
          </Link>

          {/* Desktop Nav Links */}
          {!isMobile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '32px',
              }}
            >
              {navLinks.map(link => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    style={{
                      color: active ? '#ffffff' : '#8b8b8b',
                      fontSize: '0.8125rem',
                      fontWeight: active ? '700' : '500',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      transition: 'color 0.15s ease',
                      position: 'relative',
                      paddingBottom: '4px',
                      borderBottom: active ? '2px solid #c0c0c0' : '2px solid transparent',
                    }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.color = '#ffffff'; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.color = active ? '#ffffff' : '#8b8b8b'; }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Desktop CTA / Mobile Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
            {!isMobile ? (
              <>
                <Link
                  to="/admin/dashboard"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '38px',
                    padding: '0 16px',
                    backgroundColor: '#161616',
                    color: '#c0c0c0',
                    border: '1px solid #2a2a2a',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#c0c0c0'; (e.target as HTMLElement).style.color = '#ffffff'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#2a2a2a'; (e.target as HTMLElement).style.color = '#c0c0c0'; }}
                >
                  Admin Portal
                </Link>

                <Link
                  to="/book"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '38px',
                    padding: '0 22px',
                    backgroundColor: '#c0c0c0',
                    color: '#000000',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    transition: 'background-color 0.15s ease',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.backgroundColor = '#ffffff'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = '#c0c0c0'; }}
                >
                  Book Now
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/book"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '34px',
                    padding: '0 14px',
                    backgroundColor: '#c0c0c0',
                    color: '#000000',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    borderRadius: '5px',
                  }}
                >
                  Book
                </Link>

                {/* Mobile hamburger button */}
                <button
                  onClick={() => setMobileOpen(o => !o)}
                  style={{
                    background: mobileOpen ? '#1f1f1f' : '#141414',
                    border: '1px solid #2a2a2a',
                    borderRadius: '6px',
                    color: '#c0c0c0',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    padding: '8px',
                    outline: 'none',
                  }}
                  aria-label="Toggle menu"
                >
                  <span
                    style={{
                      width: '18px',
                      height: '2px',
                      backgroundColor: '#ffffff',
                      display: 'block',
                      transition: 'all 0.2s ease',
                      transform: mobileOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none',
                    }}
                  />
                  <span
                    style={{
                      width: '18px',
                      height: '2px',
                      backgroundColor: '#ffffff',
                      display: 'block',
                      opacity: mobileOpen ? 0 : 1,
                      transition: 'opacity 0.15s ease',
                    }}
                  />
                  <span
                    style={{
                      width: '18px',
                      height: '2px',
                      backgroundColor: '#ffffff',
                      display: 'block',
                      transition: 'all 0.2s ease',
                      transform: mobileOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none',
                    }}
                  />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobile && mobileOpen && (
          <div
            style={{
              background: '#0d0d0d',
              borderTop: '1px solid #1c1c1c',
              borderBottom: '1px solid #2a2a2a',
              padding: '16px 20px 24px',
              maxHeight: 'calc(100vh - 64px)',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {navLinks.map(link => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '13px 0',
                      color: active ? '#ffffff' : '#a0a0a0',
                      fontSize: '0.88rem',
                      fontWeight: active ? '700' : '500',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      borderBottom: '1px solid #171717',
                    }}
                  >
                    <span>{link.label}</span>
                    {active && <span style={{ color: '#c0c0c0', fontSize: '0.75rem' }}>●</span>}
                  </Link>
                );
              })}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                to="/book"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '44px',
                  backgroundColor: '#c0c0c0',
                  color: '#000000',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  borderRadius: '6px',
                }}
              >
                Book a Session
              </Link>
              <Link
                to="/admin/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '42px',
                  backgroundColor: '#161616',
                  color: '#8b8b8b',
                  border: '1px solid #2a2a2a',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  borderRadius: '6px',
                }}
              >
                Admin Portal
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
