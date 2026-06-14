import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg, DayCellContentArg } from '@fullcalendar/core';
import { Reservation } from '../types/supabase';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Download, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users } from 'lucide-react';
import ExcelJS from 'exceljs';

interface CalendarViewProps {
  reservations: Reservation[];
  onReservationClick: (reservation: Reservation) => void;
  onDateClick: (date: Date) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  extendedProps: {
    reservation: Reservation;
  };
}

interface DayTotal {
  [key: string]: number;
}

type ViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

export default function CalendarView({ 
  reservations, 
  onReservationClick, 
  onDateClick 
}: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [, setDayTotals] = useState<DayTotal>({});
  const [currentView, setCurrentView] = useState<ViewType>('timeGridDay');
  const [currentDate, setCurrentDate] = useState(new Date());
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    // Convert reservations to calendar events
    const calendarEvents = reservations
      .filter((reservation) => {
        // Filter out reservations with invalid dates
        const dateOnly = reservation.reservation_date.split('T')[0]; // Extract YYYY-MM-DD
        const startDateTime = `${dateOnly}T${reservation.reservation_time}`;
        const startDate = new Date(startDateTime);
        return !isNaN(startDate.getTime());
      })
      .map((reservation) => {
        // Extract date part and combine with time
        const dateOnly = reservation.reservation_date.split('T')[0]; // Extract YYYY-MM-DD
        const startDateTime = `${dateOnly}T${reservation.reservation_time}`;
        const startDate = new Date(startDateTime);

        // Calculate end time (2 hours after start)
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

        return {
          id: reservation.id,
          title: `${reservation.customer_name} (${reservation.party_size})`,
          start: startDateTime,
          end: endDate.toISOString(),
          extendedProps: {
            reservation,
          },
        };
      });
    
    // Calculate totals for each day
    const totals: DayTotal = {};
    reservations.forEach((reservation) => {
      const dateOnly = reservation.reservation_date.split('T')[0]; // Extract YYYY-MM-DD
      totals[dateOnly] = (totals[dateOnly] || 0) + reservation.party_size;
    });

    setDayTotals(totals);
    setEvents(calendarEvents);
  }, [reservations]);

  const handleEventClick = (info: EventClickArg) => {
    const reservation = info.event.extendedProps.reservation as Reservation;
    onReservationClick(reservation);
  };

  const handleDateClick = (info: DateClickArg) => {
    onDateClick(new Date(info.date));
  };

  const exportDayToExcel = async (date: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    const dayReservations = reservations.filter((r) => {
      const dateOnly = r.reservation_date.split('T')[0];
      return dateOnly === date;
    });

    if (dayReservations.length === 0) {
      return;
    }

    const totalGuests = dayReservations.reduce((sum, r) => sum + r.party_size, 0);
    const sheetName = `${format(new Date(date), 'dd-MM', { locale: it })} (${dayReservations.length}pren-${totalGuests}osp)`;
    const formattedDate = format(new Date(date), 'dd-MM-yyyy', { locale: it });
    const fileName = `Prenotazioni_${formattedDate}_${dayReservations.length}pren_${totalGuests}osp.xlsx`;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = [
      { header: 'Nome Cliente', key: 'nome', width: 25 },
      { header: 'Numero Persone', key: 'persone', width: 12 },
      { header: 'Orario Prenotazione', key: 'orario', width: 15 },
      { header: 'Contatto', key: 'contatto', width: 20 },
      { header: 'Creato da', key: 'creatoDa', width: 20 },
      { header: 'Note', key: 'note', width: 30 },
    ];

    const sorted = [...dayReservations].sort((a, b) =>
      a.reservation_time.localeCompare(b.reservation_time)
    );

    sorted.forEach((r) => {
      worksheet.addRow({
        nome: r.customer_name,
        persone: r.party_size,
        orario: r.reservation_time,
        contatto: r.contact_info || '',
        creatoDa: r.created_by,
        note: r.notes || '',
      });
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const isEven = rowNumber % 2 === 0;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderDayCellContent = (arg: DayCellContentArg) => {
    // For all views, just show the day number without totals or download buttons
    // The totals and download will only appear above the calendar in day view
    return (
      <div className="relative h-full p-1">
        <span className="text-lg font-medium text-gray-900">{arg.dayNumberText}</span>
      </div>
    );
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
    }
  };

  const handleNavigation = (direction: 'prev' | 'next' | 'today') => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      
      switch (direction) {
        case 'prev':
          calendarApi.prev();
          break;
        case 'next':
          calendarApi.next();
          break;
        case 'today':
          calendarApi.today();
          break;
      }
      
      setCurrentDate(calendarApi.getDate());
    }
  };

  const getViewLabel = (view: ViewType) => {
    switch (view) {
      case 'dayGridMonth':
        return 'Mese';
      case 'timeGridWeek':
        return 'Settimana';
      case 'timeGridDay':
        return 'Giorno';
      default:
        return 'Mese';
    }
  };

  const formatCurrentDate = () => {
    switch (currentView) {
      case 'dayGridMonth':
        return format(currentDate, 'MMMM yyyy', { locale: it });
      case 'timeGridWeek':
        return format(currentDate, 'MMM d, yyyy', { locale: it });
      case 'timeGridDay':
        return format(currentDate, 'EEEE, d MMMM yyyy', { locale: it });
      default:
        return format(currentDate, 'MMMM yyyy', { locale: it });
    }
  };

  // Get current day data for day view
  const getCurrentDayData = () => {
    if (currentView !== 'timeGridDay') return null;

    const currentDateStr = format(currentDate, 'yyyy-MM-dd');
    const dayReservations = reservations.filter(r => {
      const dateOnly = r.reservation_date.split('T')[0];
      return dateOnly === currentDateStr;
    });
    const totalGuests = dayReservations.reduce((sum, r) => sum + r.party_size, 0);
    
    return {
      date: currentDateStr,
      reservations: dayReservations,
      totalGuests,
      reservationCount: dayReservations.length
    };
  };

  const currentDayData = getCurrentDayData();

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      {/* Enhanced Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigation('prev')}
              className="p-2.5 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 border border-gray-200"
              title="Precedente"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            
            <button
              onClick={() => handleNavigation('today')}
              className="px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300"
            >
              Oggi
            </button>
            
            <button
              onClick={() => handleNavigation('next')}
              className="p-2.5 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 border border-gray-200"
              title="Successivo"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
            
            <div className="ml-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarIcon size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {formatCurrentDate()}
              </h2>
            </div>
          </div>

          {/* Enhanced View Switcher */}
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            {(['dayGridMonth', 'timeGridWeek', 'timeGridDay'] as ViewType[]).map((view) => (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  currentView === view
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {getViewLabel(view)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Day View Controls - Only visible in day view */}
      {currentView === 'timeGridDay' && currentDayData && (
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Day Summary */}
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <Users size={18} />
                  <div>
                    <div className="font-semibold text-lg">{currentDayData.totalGuests} Ospiti</div>
                    <div className="text-sm opacity-90">
                      {currentDayData.reservationCount} prenotazioni
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional day info */}
              <div className="text-gray-600">
                <div className="text-sm font-medium">
                  {format(new Date(currentDayData.date), 'EEEE, d MMMM yyyy', { locale: it })}
                </div>
              </div>
            </div>

            {/* Download Button */}
            {currentDayData.totalGuests > 0 && (
              <button
                onClick={() => exportDayToExcel(currentDayData.date)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Download size={16} />
                <span className="font-medium">Scarica Excel</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Calendar with enhanced styling */}
      <div className="p-6">
        <div className="calendar-container" style={{ height: '650px' }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={currentView}
            initialDate={new Date()}
            headerToolbar={false}
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            height="100%"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            eventClassNames="cursor-pointer hover:opacity-90 transition-opacity rounded-md shadow-sm"
            dayMaxEvents={3}
            dayCellContent={renderDayCellContent}
            slotMinTime="06:00:00"
            slotMaxTime="24:00:00"
            allDaySlot={false}
            nowIndicator={true}
            scrollTime="12:00:00"
            datesSet={(dateInfo) => {
              setCurrentDate(dateInfo.start);
            }}
            locale="it"
            buttonText={{
              today: 'Oggi',
              month: 'Mese',
              week: 'Settimana',
              day: 'Giorno'
            }}
            dayHeaderFormat={{
              weekday: 'short'
            }}
            eventDisplay="block"
            dayHeaderClassNames="bg-gray-50 text-gray-700 font-medium py-3"
            dayCellClassNames="border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
          />
        </div>
      </div>

      {/* Legend - Only show for month/week views */}
      {currentView !== 'timeGridDay' && (
        <div className="px-6 pb-6">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Prenotazioni programmate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>Giorno corrente</span>
            </div>
            <div className="text-gray-500">
              <span>Clicca su una data per vedere i dettagli e scaricare le prenotazioni</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}