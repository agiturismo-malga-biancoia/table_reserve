import { Calendar, PlusCircle } from 'lucide-react';

interface HeaderProps {
  onCreateReservation: () => void;
}

export default function Header({ onCreateReservation }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-800" />
            <h1 className="ml-2 text-2xl font-semibold text-gray-900">Prenota Tavolo</h1>
          </div>
          <button
            onClick={onCreateReservation}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PlusCircle size={16} className="mr-2" />
            Nuova Prenotazione
          </button>
        </div>
      </div>
    </header>
  );
}