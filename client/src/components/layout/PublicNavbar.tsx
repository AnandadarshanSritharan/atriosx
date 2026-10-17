import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
          transition: 'all 0.3s ease',
          background: scrolled ? 'rgba(10,10,10,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid #2a2a2a' : '1px solid transparent',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 24px',
            height: '72px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'baseline', textDecoration: 'none' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '0.15em', color: '#ffffff', textTransform: 'uppercase' }}>ATRIOS</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#8b8b8b', letterSpacing: '0.2em', textTransform: 'uppercase', marginLeft: '6px' }}>ENTERTAINMENT</span>
          </Link>

          {/* Desktop Nav Links */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '36px',
            }}
            className="hidden md:flex"
          >
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                style={{
                  color: isActive(link.href) ? '#ffffff' : '#8b8b8b',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  position: 'relative',
                  paddingBottom: '2px',
                  borderBottom: isActive(link.href) ? '1px solid #c0c0c0' : '1px solid transparent',
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = '#ffffff'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = isActive(link.href) ? '#ffffff' : '#8b8b8b'; }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button + Mobile Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to="/admin/dashboard"
              className="hidden md:inline-flex"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '40px',
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
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#c0c0c0'; (e.target as HTMLElement).style.color = '#ffffff'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#2a2a2a'; (e.target as HTMLElement).style.color = '#c0c0c0'; }}
            >
              Admin Portal
            </Link>

            <Link
              to="/book"
              className="hidden md:inline-flex"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '40px',
                padding: '0 24px',
                backgroundColor: '#c0c0c0',
                color: '#000000',
                fontSize: '0.8rem',
                fontWeight: '700',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderRadius: '6px',
                transition: 'background-color 0.2s',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.backgroundColor = '#e8e8e8'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = '#c0c0c0'; }}
            >
              Book Now
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden"
              onClick={() => setMobileOpen(o => !o)}
              style={{
                background: 'none',
                border: '1px solid #2a2a2a',
                borderRadius: '6px',
                color: '#c0c0c0',
                width: '40px',
                height: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer',
                padding: '8px',
              }}
              aria-label="Toggle menu"
            >
              <span style={{ width: '18px', height: '2px', backgroundColor: '#c0c0c0', display: 'block', transition: 'all 0.2s', transform: mobileOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
              <span style={{ width: '18px', height: '2px', backgroundColor: '#c0c0c0', display: 'block', opacity: mobileOpen ? '0' : '1', transition: 'opacity 0.2s' }} />
              <span style={{ width: '18px', height: '2px', backgroundColor: '#c0c0c0', display: 'block', transition: 'all 0.2s', transform: mobileOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div
            style={{
              background: '#0a0a0a',
              borderTop: '1px solid #2a2a2a',
              padding: '16px 24px 24px',
            }}
            className="md:hidden"
          >
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                style={{
                  display: 'block',
                  padding: '14px 0',
                  color: isActive(link.href) ? '#ffffff' : '#8b8b8b',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  borderBottom: '1px solid #1a1a1a',
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/book"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '20px',
                height: '48px',
                backgroundColor: '#c0c0c0',
                color: '#000000',
                fontSize: '0.85rem',
                fontWeight: '800',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderRadius: '8px',
              }}
            >
              Book Now
            </Link>
            <Link
              to="/admin/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '10px',
                height: '44px',
                backgroundColor: 'transparent',
                color: '#8b8b8b',
                border: '1px solid #2a2a2a',
                fontSize: '0.8rem',
                fontWeight: '700',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderRadius: '8px',
              }}
            >
              Admin Portal
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}
