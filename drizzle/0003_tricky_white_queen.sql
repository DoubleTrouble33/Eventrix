ALTER TABLE "users" ALTER COLUMN "calendars" SET DEFAULT '[{"id":"personal","name":"Personal","color":"#3B82F6"},{"id":"work","name":"Work","color":"#10B981"}]'::jsonb;--> statement-breakpoint
ALTER TABLE "event_guests" ADD COLUMN "viewed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event_guests" ADD COLUMN "is_accepted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "calendar_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar" text DEFAULT '/img/avatar-demo.png';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_blocked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "contacts" jsonb DEFAULT '{"organized":{"work":{"name":"Work","color":"#10B981","memberIds":[]},"personal":{"name":"Personal","color":"#3B82F6","memberIds":[]}},"unorganized":{}}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notifications" jsonb DEFAULT '[]'::jsonb;