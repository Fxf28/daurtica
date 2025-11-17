CREATE TABLE "classification_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"image_url" text,
	"top_label" text NOT NULL,
	"confidence" numeric NOT NULL,
	"all_results" jsonb NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
