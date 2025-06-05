-- Add is_accepted column to event_guests table
ALTER TABLE event_guests
ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN NOT NULL DEFAULT FALSE; 