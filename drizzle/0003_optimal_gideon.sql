CREATE TABLE "user_generate_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"date" varchar(10) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"last_generated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
