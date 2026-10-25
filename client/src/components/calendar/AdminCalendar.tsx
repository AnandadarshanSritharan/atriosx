import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useCalendarBookings } from '@/hooks/useBookings';
import { useFacilities } from '@/hooks/useFacilities';
import { AdminBookingModal } from './AdminBookingModal';
import { BookingDetailsModal } from './BookingDetailsModal';
import CalendarAlerts from './CalendarAlerts';
import { Zap, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AdminCalendarProps {
  externalOpenModal?: boolean;
  onExternalModalClose?: () => void;
}

export default function AdminCalendar({ externalOpenModal, onExternalModalClose }: AdminCalendarProps) {
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
  });

  const { data: facilities } = useFacilities();
  const { data: bookings } = useCalendarBookings(dateRange.start, dateRange.end);

  const [modalState, setModalState] = useState<{ type: 'none' | 'new' | 'detail'; data?: any }>({ type: 'none' });

  // Sync external open trigger
  useEffect(() => {
    if (externalOpenModal) {
      const nowStr = format(new Date(), 'HH:mm');
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      setModalState({
        type: 'new',
        data: {
          date: todayStr,
          startTime: nowStr,
          facilityId: facilities?.[0]?._id,
        },
      });
      if (onExternalModalClose) onExternalModalClose();
    }
  }, [externalOpenModal]);

  const handleCloseModal = () => {
    setModalState({ type: 'none' });
    if (onExternalModalClose) onExternalModalClose();
  };

  const resources = facilities?.map(f => ({
    id: f._id,
    title: f.name,
    eventColor: f.color || '#3d85c8',
  })) || [];

  // The backend /calendar endpoint already returns FullCalendar formatted event objects
  const events = bookings || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Calendar Card Toolbar */}
      <div style={{
        background: '#111111',
        border: '1px solid #2a2a2a',
        borderRadius: '14px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              const nowStr = format(new Date(), 'HH:mm');
              const todayStr = format(new Date(), 'yyyy-MM-dd');
              setModalState({
                type: 'new',
                data: {
                  date: todayStr,
                  startTime: nowStr,
                  facilityId: facilities?.[0]?._id,
                },
              });
            }}
            style={{
              padding: '9px 18px',
              background: '#c0c0c0',
              border: 'none',
              borderRadius: '8px',
              color: '#000000',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(192,192,192,0.2)',
            }}
          >
            <Zap size={14} />
            Quick Booking
          </button>
          <span style={{ fontSize: '0.78rem', color: '#6b6b6b' }}>
            Click anywhere on the timeline or click Quick Booking to reserve a station.
          </span>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.72rem', color: '#8b8b8b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3d85c8' }} /> Ongoing
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d4a017' }} /> Pending
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2d7a4f' }} /> Completed
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b2020' }} /> No Show
          </span>
        </div>
      </div>

      {/* Main FullCalendar Component */}
      <div style={{
        minHeight: '750px',
        background: '#111111',
        border: '1px solid #2a2a2a',
        borderRadius: '14px',
        padding: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        position: 'relative',
        zIndex: 0,
      }}>
        <FullCalendar
          plugins={[resourceTimelinePlugin, interactionPlugin, timeGridPlugin, dayGridPlugin]}
          initialView="resourceTimelineDay"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimelineDay,timeGridWeek,dayGridMonth',
          }}
          nowIndicator={true}
          scrollTime={format(new Date(), 'HH:00:00')}
          resources={resources}
          events={events}
          editable={false}
          selectable={true}
          slotMinTime="08:00:00"
          slotMaxTime="24:00:00"
          slotDuration="00:15:00"
          slotLabelInterval="01:00:00"
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          height="750px"
          datesSet={(arg: any) => {
            setDateRange({
              start: arg.startStr.split('T')[0],
              end: arg.endStr.split('T')[0],
            });
          }}
          select={(info: any) => {
            const dateStr = info.startStr.split('T')[0];
            const timePart = info.startStr.includes('T') ? info.startStr.split('T')[1]?.substring(0, 5) : format(new Date(), 'HH:mm');
            setModalState({
              type: 'new',
              data: {
                facilityId: info.resource?.id || facilities?.[0]?._id,
                date: dateStr,
                startTime: timePart || '09:00',
              },
            });
          }}
          eventContent={(eventInfo: any) => {
            const ext = eventInfo.event.extendedProps || {};
            const b = ext.booking;
            const timeLabel = ext.timeLabel || `${b?.startTime || ''} – ${b?.endTime || ''}`;
            const name = ext.customerName || ext.customer?.name || b?.customer?.name || 'Walk-in Guest';
            const bookingNum = ext.bookingNumber || b?.bookingNumber || '';
            const status = ext.status || b?.status;

            const now = new Date();
            const nowMs = now.getTime();
            const todayStr = format(now, 'yyyy-MM-dd');
            const dateStr = b?.date || eventInfo.event.startStr?.split('T')[0];
            const isToday = dateStr === todayStr;
            const endTimeStr = b?.endTime || ext.endTime;
            const endMs = isToday && endTimeStr ? new Date(`${dateStr}T${endTimeStr}:00`).getTime() : 0;
            const diffMins = endMs ? (endMs - nowMs) / 60000 : 999;
            const isEndingSoon = isToday && status !== 'cancelled' && status !== 'no_show' && status !== 'completed' && diffMins > 0 && diffMins <= 5;
            const isJustFinished = isToday && status !== 'cancelled' && status !== 'no_show' && diffMins <= 0 && diffMins >= -15;

            return (
              <div style={{
                padding: '3px 8px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                overflow: 'hidden',
                lineHeight: 1.25,
                borderRadius: '4px',
                animation: isEndingSoon ? 'pulseBorderAmber 1.5s infinite' : undefined,
                border: isEndingSoon ? '1px solid #f5b82e' : undefined,
              }}>
                <div style={{
                  fontWeight: 800,
                  fontSize: '0.74rem',
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '4px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                    <Clock size={11} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{timeLabel}</span>
                  </div>
                  {isEndingSoon && (
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      background: '#d4a017',
                      color: '#000000',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      flexShrink: 0,
                    }}>
                      {Math.ceil(diffMins)}m left
                    </span>
                  )}
                  {isJustFinished && (
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      background: '#ff453a',
                      color: '#ffffff',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      flexShrink: 0,
                    }}>
                      Finished
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '0.68rem',
                  color: '#ffffffdd',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: 600,
                }}>
                  {name} {bookingNum ? `· ${bookingNum}` : ''}
                </div>
              </div>
            );
          }}
          eventClick={(info: any) => {
            setModalState({
              type: 'detail',
              data: info.event.extendedProps?.booking || {
                _id: info.event.id,
                bookingNumber: info.event.extendedProps?.bookingNumber,
                status: info.event.extendedProps?.status,
                facility: info.event.extendedProps?.facility,
                customer: info.event.extendedProps?.customer,
                date: info.event.startStr?.split('T')[0],
                startTime: info.event.extendedProps?.startTime,
                endTime: info.event.extendedProps?.endTime,
              },
            });
          }}
        />

        <AdminBookingModal
          isOpen={modalState.type === 'new'}
          onClose={handleCloseModal}
          initialData={modalState.data}
          facilities={facilities || []}
        />

        <BookingDetailsModal
          isOpen={modalState.type === 'detail'}
          onClose={handleCloseModal}
          booking={modalState.data}
        />

        <CalendarAlerts
          events={events}
          onOpenBooking={(bookingData) => setModalState({ type: 'detail', data: bookingData })}
        />
      </div>
    </div>
  );
}
