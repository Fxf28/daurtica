CREATE TABLE "education_personal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"prompt" text NOT NULL,
	"generated_content" jsonb NOT NULL,
	"title" varchar(255) NOT NULL,
	"tags" jsonb DEFAULT '[]',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "education_public" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"thumbnail_url" varchar(500),
	"author_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tags" jsonb DEFAULT '[]',
	"is_published" boolean DEFAULT false,
	"excerpt" text,
	"reading_time" integer,
	CONSTRAINT "education_public_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "classification_history" ALTER COLUMN "confidence" SET DATA TYPE numeric(5, 4);