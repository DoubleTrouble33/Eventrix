-- Add calendarId column to events table
ALTER TABLE events ADD COLUMN calendar_id TEXT NOT NULL DEFAULT 'personal';

-- Update existing events to use their categoryId as calendarId
UPDATE events SET calendar_id = category_id;

-- Remove the default value constraint
ALTER TABLE events ALTER COLUMN calendar_id DROP DEFAULT; 