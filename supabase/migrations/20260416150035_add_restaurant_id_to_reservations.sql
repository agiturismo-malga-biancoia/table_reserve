-- Add restaurant_id column to reservations table
ALTER TABLE reservations
ADD COLUMN restaurant_id uuid NOT NULL DEFAULT 'c6d7a0a6-b9c3-4bc6-8b5d-4aef7a0e9e1f';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS reservations_restaurant_id_idx ON reservations (restaurant_id);
