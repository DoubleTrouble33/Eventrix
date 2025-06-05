ALTER TABLE "event_guests" ADD COLUMN "viewed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event_guests" ADD COLUMN "is_accepted" boolean DEFAULT false NOT NULL;