-- Add missing avatar column to users table
ALTER TABLE "users" ADD COLUMN "avatar" text DEFAULT '/img/avatar-demo.png';

-- Add missing admin and blocked columns if they don't exist
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN "is_blocked" boolean DEFAULT false NOT NULL;

-- Add missing contacts column if it doesn't exist
ALTER TABLE "users" ADD COLUMN "contacts" jsonb DEFAULT '{"organized":{},"unorganized":{}}'::jsonb;

-- Add missing notifications column if it doesn't exist
ALTER TABLE "users" ADD COLUMN "notifications" jsonb DEFAULT '[]'::jsonb;

-- Add missing viewed and is_accepted columns to event_guests if they don't exist
ALTER TABLE "event_guests" ADD COLUMN "viewed" boolean DEFAULT false NOT NULL;
ALTER TABLE "event_guests" ADD COLUMN "is_accepted" boolean DEFAULT false NOT NULL; 