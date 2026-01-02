import { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, SlotInfo } from 'react-big-calendar';
import { useQuery } from '@tanstack/react-query';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import { appointmentService } from '@/services/appointments';
import { CalendarEvent, Appointment } from '@/types';
import AppointmentModal from '@/components/appointments/AppointmentModal';
import AppointmentDetailModal from '@/components/appointments/AppointmentDetailModal';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay citas en este rango.',
  showMore: (total: number) => `+ ${total} más`,
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<typeof Views[keyof typeof Views]>(Views.WEEK);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Calculate date range for fetching appointments
  const dateRange = useMemo(() => {
    const start = startOfMonth(subMonths(currentDate, 1));
    const end = endOfMonth(addMonths(currentDate, 1));
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    };
  }, [currentDate]);

  // Fetch appointments
  const { data: appointmentsData, refetch } = useQuery({
    queryKey: ['calendar-appointments', dateRange],
    queryFn: () => appointmentService.getCalendarEvents(dateRange.startDate, dateRange.endDate),
  });

  // Transform appointments to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    if (!appointmentsData || !Array.isArray(appointmentsData)) return [];
    return appointmentsData.map((appointment: Appointment) => ({
      id: appointment.id,
      title: `${appointment.client?.firstName || ''} ${appointment.client?.lastName || ''} - ${appointment.service?.name || ''}`,
      start: new Date(`${appointment.date}T${appointment.startTime}`),
      end: new Date(`${appointment.date}T${appointment.endTime}`),
      resource: appointment,
    }));
  }, [appointmentsData]);

  // Handle slot selection (creating new appointment)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
    setIsCreateModalOpen(true);
  }, []);

  // Handle event selection (viewing appointment details)
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedAppointment(event.resource);
    setIsDetailModalOpen(true);
  }, []);

  // Handle navigation
  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  // Handle view change
  const handleViewChange = useCallback((newView: typeof Views[keyof typeof Views]) => {
    setView(newView);
  }, []);

  // Event style getter
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const appointment = event.resource;
    let backgroundColor = '#3B82F6'; // Default blue

    switch (appointment.status) {
      case 'PENDING':
        backgroundColor = '#F59E0B'; // Yellow
        break;
      case 'CONFIRMED':
        backgroundColor = '#3B82F6'; // Blue
        break;
      case 'COMPLETED':
        backgroundColor = '#10B981'; // Green
        break;
      case 'CANCELED':
        backgroundColor = '#EF4444'; // Red
        break;
      case 'NO_SHOW':
        backgroundColor = '#6B7280'; // Gray
        break;
      case 'RESCHEDULED':
        backgroundColor = '#8B5CF6'; // Purple
        break;
    }

    // Use service color if available
    if (appointment.service?.color) {
      backgroundColor = appointment.service.color;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
      },
    };
  }, []);

  // Custom toolbar
  const CustomToolbar = ({ onNavigate, label }: any) => (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('PREV')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Hoy
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
        <h2 className="ml-4 text-lg font-semibold text-gray-900 dark:text-white capitalize">
          {label}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
          {[
            { key: Views.MONTH, label: 'Mes' },
            { key: Views.WEEK, label: 'Semana' },
            { key: Views.DAY, label: 'Día' },
            { key: Views.AGENDA, label: 'Agenda' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleViewChange(key)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setSelectedSlot({ start: new Date(), end: new Date() });
            setIsCreateModalOpen(true);
          }}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nueva Cita
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-10rem)]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        view={view}
        onView={handleViewChange}
        date={currentDate}
        onNavigate={handleNavigate}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable
        eventPropGetter={eventStyleGetter}
        messages={messages}
        culture="es"
        components={{
          toolbar: CustomToolbar,
        }}
        min={new Date(0, 0, 0, 7, 0, 0)} // 7:00 AM
        max={new Date(0, 0, 0, 21, 0, 0)} // 9:00 PM
        step={15}
        timeslots={4}
      />

      {/* Create Appointment Modal */}
      {isCreateModalOpen && (
        <AppointmentModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedSlot(null);
          }}
          initialDate={selectedSlot?.start}
          onSuccess={() => {
            refetch();
            setIsCreateModalOpen(false);
            setSelectedSlot(null);
          }}
        />
      )}

      {/* Appointment Detail Modal */}
      {isDetailModalOpen && selectedAppointment && (
        <AppointmentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onUpdate={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
