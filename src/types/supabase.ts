export type Reservation = {
  id: string;
  restaurant_id: string;
  customer_name: string;
  contact_info: string | null;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  notes: string | null;
  status: string;
  created_at: string;
  created_by: string;
};

export type Database = {
  public: {
    Tables: {
      reservations: {
        Row: Reservation;
        Insert: Omit<Reservation, 'id' | 'created_at'>;
        Update: Partial<Omit<Reservation, 'id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
};