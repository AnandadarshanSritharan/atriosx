import { useState } from 'react';
import AdminCalendar from '@/components/calendar/AdminCalendar';
import { PageHeader } from '@/components/shared/PageHeader';
import { Zap } from 'lucide-react';

export default function CalendarPage() {
  const [openQuickBook, setOpenQuickBook] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader 
        title="Booking Calendar" 
        subtitle="Manage facility schedules and manual walk-in bookings" 
        actions={
          <button
            onClick={() => setOpenQuickBook(true)}
            style={{
              padding: '10px 20px',
              background: '#c0c0c0',
              border: 'none',
              borderRadius: '8px',
              color: '#000000',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(192,192,192,0.2)',
            }}
          >
            <Zap size={16} />
            Quick Booking
          </button>
        }
      />
      <AdminCalendar 
        externalOpenModal={openQuickBook} 
        onExternalModalClose={() => setOpenQuickBook(false)} 
      />
    </div>
  );
}
