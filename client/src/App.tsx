import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './store/AuthContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import BookingPage from './pages/public/BookingPage';
import ExperiencesPage from './pages/public/ExperiencesPage';
import PublicGamesPage from './pages/public/GamesPage';
import PublicOffersPage from './pages/public/OffersPage';
import PublicNewsPage from './pages/public/NewsPage';
import NewsDetailPage from './pages/public/NewsDetailPage';
import ContactPage from './pages/public/ContactPage';

// Admin Pages
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import CalendarPage from './pages/admin/CalendarPage';
import BookingListPage from './pages/admin/BookingListPage';
import BookingDetailPage from './pages/admin/BookingDetailPage';
import CustomersPage from './pages/admin/CustomersPage';
import CustomerDetailPage from './pages/admin/CustomerDetailPage';
import FacilitiesPage from './pages/admin/FacilitiesPage';
import FacilityFormPage from './pages/admin/FacilityFormPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import AdminGamesPage from './pages/admin/GamesPage';
import AdminOffersPage from './pages/admin/OffersPage';
import AdminNewsPage from './pages/admin/NewsPage';
import AdminGalleryPage from './pages/admin/GalleryPage';
import RevenuePage from './pages/admin/RevenuePage';
import ExpensesPage from './pages/admin/ExpensesPage';
import PartnersPage from './pages/admin/PartnersPage';
import ProfitPage from './pages/admin/ProfitPage';
import ReportsPage from './pages/admin/ReportsPage';
import SettingsPage from './pages/admin/SettingsPage';
import UsersPage from './pages/admin/UsersPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';

import { ScrollToTop } from './components/shared/ScrollToTop';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="experiences" element={<ExperiencesPage />} />
              <Route path="games" element={<PublicGamesPage />} />
              <Route path="offers" element={<PublicOffersPage />} />
              <Route path="news" element={<PublicNewsPage />} />
              <Route path="news/:slug" element={<NewsDetailPage />} />
              <Route path="book" element={<BookingPage />} />
              <Route path="contact" element={<ContactPage />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              
              {/* Dashboard & Bookings */}
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="bookings/calendar" element={<CalendarPage />} />
              <Route path="bookings" element={<BookingListPage />} />
              <Route path="bookings/:id" element={<BookingDetailPage />} />
              
              {/* Customer Base */}
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />

              {/* Facilities & Games */}
              <Route path="facilities" element={<FacilitiesPage />} />
              <Route path="facilities/new" element={<FacilityFormPage />} />
              <Route path="facilities/:id/edit" element={<FacilityFormPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="games" element={<AdminGamesPage />} />
              
              {/* Content Management */}
              <Route path="offers" element={<AdminOffersPage />} />
              <Route path="news" element={<AdminNewsPage />} />
              <Route path="gallery" element={<AdminGalleryPage />} />
              
              {/* Finance Engine */}
              <Route path="finance/revenue" element={<RevenuePage />} />
              <Route path="finance/expenses" element={<ExpensesPage />} />
              <Route path="finance/partners" element={<PartnersPage />} />
              <Route path="finance/profit" element={<ProfitPage />} />
              
              {/* Reports, Settings & Security */}
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="admin/users" element={<UsersPage />} />
              <Route path="admin/audit-logs" element={<AuditLogsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
