import { supabase } from '../lib/supabase';
import type { Reservation } from '../types/supabase';
import { RESTAURANT_ID } from '../lib/constants';

export const fetchReservations = async (): Promise<Reservation[]> => {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .order('reservation_date', { ascending: true });

  if (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }

  return data || [];
};

export const createReservation = async (reservation: Omit<Reservation, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('reservations')
    .insert([{
      ...reservation,
      restaurant_id: RESTAURANT_ID
    }])
    .select();

  if (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }

  return data?.[0];
};

export const updateReservation = async (id: string, updates: Partial<Omit<Reservation, 'id' | 'created_at'>>) => {
  const { data, error } = await supabase
    .from('reservations')
    .update({
      ...updates,
      restaurant_id: RESTAURANT_ID,
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating reservation:', error);
    throw error;
  }

  return data?.[0];
};

export const deleteReservation = async (id: string) => {
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', RESTAURANT_ID);

  if (error) {
    console.error('Error deleting reservation:', error);
    throw error;
  }

  return true;
};