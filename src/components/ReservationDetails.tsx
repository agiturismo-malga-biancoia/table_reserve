import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Reservation } from '../types/supabase';
import { X } from 'lucide-react';

interface ReservationDetailsProps {
  reservation: Reservation;
  onClose: () => void;
  onEdit: () => void;
}

export default function ReservationDetails({ 
  reservation, 
  onClose, 
  onEdit 
}: ReservationDetailsProps) {
  // Combine date and time strings into a valid datetime string
  const getFormattedDateTime = (date: string, time: string) => {
    try {
      return format(new Date(`${date}T${time}`), 'd MMMM yyyy - HH:mm', { locale: it });
    } catch (error) {
      return 'Data non valida' + (error instanceof Error ? `: ${error.message}` : '');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'confermata':
        return 'Confermata';
      case 'cancelled':
      case 'annullata':
        return 'Annullata';
      case 'completed':
      case 'completata':
        return 'Completata';
      case 'no-show':
      case 'non-presentato':
        return 'Non Presentato';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Dettagli Prenotazione</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Nome Cliente</h3>
            <p className="mt-1 text-lg">{reservation.customer_name}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Prenotato da</h3>
            <p className="mt-1">{reservation.created_by}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Informazioni di Contatto</h3>
            <p className="mt-1">{reservation.contact_info || 'Non fornite'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Numero di Persone</h3>
            <p className="mt-1">{reservation.party_size}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Data e Orario Prenotazione</h3>
            <p className="mt-1">
              {getFormattedDateTime(reservation.reservation_date, reservation.reservation_time)}
            </p>
          </div>

          {reservation.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Note</h3>
              <p className="mt-1">{reservation.notes}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500">Stato</h3>
            <p className="mt-1 capitalize">{getStatusLabel(reservation.status)}</p>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-6">
            <h3 className="text-sm font-medium text-gray-500">Creata il</h3>
            <p className="mt-1 text-sm text-gray-500">
              {format(new Date(reservation.created_at), 'd MMMM yyyy - HH:mm', { locale: it })}
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={onEdit}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Modifica Prenotazione
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}