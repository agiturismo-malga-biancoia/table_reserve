-- Rename columns to match TypeScript types
ALTER TABLE reservations RENAME COLUMN user_name TO created_by;
ALTER TABLE reservations RENAME COLUMN number_of_people TO party_size;

-- Add missing columns
ALTER TABLE reservations ADD COLUMN reservation_time text NOT NULL DEFAULT '12:00';
ALTER TABLE reservations ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- Remove reservation_date column and replace with separate date field if needed
-- For now, keeping reservation_date as is since it can store the date

-- Update index names
DROP INDEX IF EXISTS reservations_customer_name_idx;
CREATE INDEX IF NOT EXISTS reservations_customer_name_idx ON reservations (customer_name);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON reservations (status);
