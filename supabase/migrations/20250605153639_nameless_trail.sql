/*
  # Create reservations table and security policies

  1. New Tables
    - `reservations` table with fields for managing restaurant bookings
      - Primary key with UUID
      - Required fields: userName, customerName, numberOfPeople, reservationDate
      - Optional fields: contactInfo, notes
      - Timestamps for creation and updates

  2. Security
    - Enable RLS on reservations table
    - Create policies for public access (temporary for development)

  3. Performance
    - Add indexes on frequently queried columns
*/

-- Create the reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  customer_name text NOT NULL,
  contact_info text,
  number_of_people integer NOT NULL CHECK (number_of_people > 0),
  reservation_date timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create policies for all users to access reservations
CREATE POLICY "Allow select for all users" 
  ON reservations 
  FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Allow insert for all users" 
  ON reservations 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "Allow update for all users" 
  ON reservations 
  FOR UPDATE 
  TO public 
  USING (true);

CREATE POLICY "Allow delete for all users" 
  ON reservations 
  FOR DELETE 
  TO public 
  USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS reservations_date_idx ON reservations (reservation_date);
CREATE INDEX IF NOT EXISTS reservations_customer_name_idx ON reservations (customer_name);