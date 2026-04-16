import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import CalendarView from './components/CalendarView';
import ReservationForm from './components/ReservationForm';
import ReservationDetails from './components/ReservationDetails';
import Header from './components/Header';
import { useReservations } from './hooks/useReservations';
import { Reservation } from './types/supabase';
import { Calendar, Loader } from 'lucide-react';
import { RESTAURANT_ID } from './lib/constants';

function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const { 
    reservations, 
    loading, 
    error, 
    addReservation, 
    editReservation, 
    removeReservation 
  } = useReservations();

  const handleCreateReservation = async (data: Omit<Reservation, 'id' | 'created_at'>) => {
    try {
      await addReservation({
        ...data,
        restaurant_id: RESTAURANT_ID
      });
      setIsCreateModalOpen(false);
      toast.success('Prenotazione creata con successo!');
    } catch (error) {
      toast.error('Errore nella creazione della prenotazione');
    }
  };

  const handleUpdateReservation = async (data: Omit<Reservation, 'id' | 'created_at'>) => {
    if (!selectedReservation) return;
    
    try {
      await editReservation(selectedReservation.id, {
        ...data,
        restaurant_id: RESTAURANT_ID
      });
      setIsEditModalOpen(false);
      setSelectedReservation(null);
      toast.success('Prenotazione aggiornata con successo!');
    } catch (error) {
      toast.error('Errore nell\'aggiornamento della prenotazione');
    }
  };

  const handleDeleteReservation = async () => {
    if (!selectedReservation) return;
    
    try {
      await removeReservation(selectedReservation.id);
      setIsEditModalOpen(false);
      setSelectedReservation(null);
      toast.success('Prenotazione eliminata con successo!');
    } catch (error) {
      toast.error('Errore nell\'eliminazione della prenotazione');
    }
  };

  const openCreateModal = (date?: Date) => {
    if (date) {
      // Convert the date to local timezone and format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;
      setSelectedDate(localDateString);
    } else {
      setSelectedDate(null);
    }
    setIsCreateModalOpen(true);
  };

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsViewModalOpen(true);
  };

  const handleEditClick = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      <Header onCreateReservation={() => openCreateModal()} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 text-blue-800 animate-spin" />
            <span className="ml-2 text-lg text-gray-600">Caricamento prenotazioni...</span>
          </div>
        ) : error ? (
          <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-600">Errore nel caricamento delle prenotazioni. Riprova più tardi.</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Nessuna prenotazione ancora</h3>
            <p className="mt-1 text-gray-500">Crea la tua prima prenotazione per iniziare.</p>
            <button
              onClick={() => openCreateModal()}
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Crea Prenotazione
            </button>
          </div>
        ) : (
          <CalendarView 
            reservations={reservations} 
            onReservationClick={handleReservationClick}
            onDateClick={(date) => openCreateModal(date)}
          />
        )}
      </main>

      {isCreateModalOpen && (
        <ReservationForm
          title="Crea Nuova Prenotazione"
          initialData={
            selectedDate
              ? { reservation_date: selectedDate }
              : undefined
          }
          onSubmit={handleCreateReservation}
          onCancel={() => setIsCreateModalOpen(false)}
          restaurantId={RESTAURANT_ID}
        />
      )}

      {isViewModalOpen && selectedReservation && (
        <ReservationDetails
          reservation={selectedReservation}
          onClose={() => setIsViewModalOpen(false)}
          onEdit={handleEditClick}
        />
      )}

      {isEditModalOpen && selectedReservation && (
        <ReservationForm
          title="Modifica Prenotazione"
          initialData={selectedReservation}
          onSubmit={handleUpdateReservation}
          onCancel={() => setIsEditModalOpen(false)}
          onDelete={handleDeleteReservation}
          restaurantId={RESTAURANT_ID}
        />
      )}
    </div>
  );
}

export default App;