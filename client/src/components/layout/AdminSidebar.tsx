import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, CalendarDays, ClipboardList, Users, 
  Building2, Gamepad2, Tag, Newspaper, Image, 
  TrendingUp, Receipt, Users2, PieChart, BarChart2, 
  Settings, Shield, ScrollText, Layers 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function AdminSidebar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const navItems = [
    { section: 'Main', items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    ]},
    { section: 'Bookings', items: [
      { name: 'Calendar', path: '/admin/bookings/calendar', icon: CalendarDays },
      { name: 'Booking List', path: '/admin/bookings', icon: ClipboardList },
    ]},
    { section: 'Management', items: [
      { name: 'Customers', path: '/admin/customers', icon: Users },
      { name: 'Facilities', path: '/admin/facilities', icon: Building2 },
      { name: 'Categories', path: '/admin/categories', icon: Layers },
      { name: 'Games', path: '/admin/games', icon: Gamepad2 },
    ]},
    { section: 'Content', items: [
      { name: 'Offers', path: '/admin/offers', icon: Tag },
      { name: 'News', path: '/admin/news', icon: Newspaper },
      { name: 'Gallery', path: '/admin/gallery', icon: Image },
    ]},
    { section: 'Finance', items: [
      { name: 'Revenue', path: '/admin/finance/revenue', icon: TrendingUp },
      { name: 'Expenses', path: '/admin/finance/expenses', icon: Receipt },
      { name: 'Partners', path: '/admin/finance/partners', icon: Users2 },
      { name: 'Profit', path: '/admin/finance/profit', icon: PieChart },
    ]},
    { section: 'System', items: [
      { name: 'Reports', path: '/admin/reports', icon: BarChart2 },
      { name: 'Settings', path: '/admin/settings', icon: Settings },
      ...(user?.role === 'superadmin' ? [
        { name: 'Users', path: '/admin/admin/users', icon: Shield },
        { name: 'Audit Logs', path: '/admin/admin/audit-logs', icon: ScrollText },
      ] : []),
    ]},
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-surface border-r border-border h-screen flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full" />
          <span className="font-bold tracking-tight text-white">ATRIOS ADMIN</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navItems.map((group, i) => (
          <div key={i}>
            <h4 className="px-3 text-xs font-semibold text-muted uppercase tracking-wider mb-2">{group.section}</h4>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                return (
                  <Link key={item.path} to={item.path} className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", isActive ? "bg-silver/10 text-silver" : "text-muted hover:bg-surface-2 hover:text-white")}>
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-silver font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
            <p className="text-xs text-muted capitalize">{user?.role || 'Staff'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
