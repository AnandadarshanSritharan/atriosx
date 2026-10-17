import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar } from './AdminSidebar';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingNotificationProvider } from '@/components/shared/BookingNotification';

export function AdminLayout() {
  const { isAuthenticated, loading, logout } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-white">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen flex bg-background text-white">
      <BookingNotificationProvider />
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-surface/50 backdrop-blur-sm flex items-center justify-between px-8">
          <h2 className="text-sm font-medium text-muted">Management Console</h2>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted hover:text-white">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
