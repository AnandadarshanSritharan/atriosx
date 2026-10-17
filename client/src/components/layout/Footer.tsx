import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';

export function Footer() {
  const { data: settings } = useSettings();
  
  return (
    <footer className="bg-surface border-t border-border py-12 px-4 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-4">
            <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full" />
            <span className="font-bold text-xl text-white">ATRIOS</span>
          </Link>
          <p className="text-sm text-muted">{settings?.websiteSettings?.heroSubtitle || 'Play. Compete. Experience.'}</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link to="/experiences" className="hover:text-silver transition-colors">Experiences</Link></li>
            <li><Link to="/games" className="hover:text-silver transition-colors">Games Library</Link></li>
            <li><Link to="/offers" className="hover:text-silver transition-colors">Special Offers</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Contact</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>{settings?.phone || 'Contact us for bookings'}</li>
            <li>{settings?.email || 'info@atrios.com'}</li>
            <li>{settings?.address || 'Premium Entertainment Center'}</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Follow Us</h4>
          <div className="flex gap-4">
            {settings?.socialLinks?.instagram && <a href={settings.socialLinks.instagram} target="_blank" rel="noreferrer" className="text-muted hover:text-silver">Instagram</a>}
            {settings?.socialLinks?.facebook && <a href={settings.socialLinks.facebook} target="_blank" rel="noreferrer" className="text-muted hover:text-silver">Facebook</a>}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border text-center text-sm text-muted">
        &copy; {new Date().getFullYear()} {settings?.businessName || 'Atrios Entertainment'}. All rights reserved.
      </div>
    </footer>
  );
}
