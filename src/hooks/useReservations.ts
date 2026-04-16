import { useState, useEffect, useCallback } from 'react';
import { Reservation } from '../types/supabase';
import { 
  fetchReservations,
  createReservation,
  updateReservation,
  deleteReservation
} from '../services/reservationService';
import { supabase } from '../lib/supabase';
import { RESTAURANT_ID } from '../lib/constants';

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchReservations();
      setReservations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();

    // Set up real-time subscription
    const channel = supabase
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `restaurant_id=eq.${RESTAURANT_ID}`,
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          loadReservations();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadReservations]);

  const addReservation = async (newReservation: Omit<Reservation, 'id' | 'created_at'>) => {
    try {
      const created = await createReservation(newReservation);
      if (created) {
        await loadReservations(); // Reload after creation
        return created;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create reservation'));
      throw err;
    }
  };

  const editReservation = async (id: string, updates: Partial<Omit<Reservation, 'id' | 'created_at'>>) => {
    try {
      const updated = await updateReservation(id, updates);
      if (updated) {
        await loadReservations(); // Reload after update
        return updated;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update reservation'));
      throw err;
    }
  };

  const removeReservation = async (id: string) => {
    try {
      await deleteReservation(id);
      await loadReservations(); // Reload after deletion
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete reservation'));
      throw err;
    }
  };

  return {
    reservations,
    loading,
    error,
    addReservation,
    editReservation,
    removeReservation,
    refreshReservations: loadReservations,
  };
};