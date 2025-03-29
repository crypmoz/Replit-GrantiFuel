CREATE TYPE "public"."document_type" AS ENUM('grant_info', 'artist_guide', 'application_tips', 'admin_knowledge', 'user_upload');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('none', 'pdf', 'docx', 'txt');--> statement-breakpoint
CREATE TYPE "public"."onboarding_task" AS ENUM('profile_completed', 'first_grant_viewed', 'first_artist_created', 'first_application_started', 'ai_assistant_used', 'first_document_uploaded', 'first_template_saved', 'first_application_completed', 'profile_picture_added', 'notification_settings_updated');--> statement-breakpoint
CREATE TYPE "public"."plan_tier" AS ENUM('free', 'basic', 'premium');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer,
	"details" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"grant_id" integer NOT NULL,
	"artist_id" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"answers" json,
	"submitted_at" timestamp,
	"started_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"bio" text,
	"genres" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"type" "document_type" NOT NULL,
	"tags" text[],
	"is_public" boolean DEFAULT false NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"file_name" text,
	"file_type" "file_type" DEFAULT 'none',
	"file_url" text,
	"file_size" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "grants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization" text NOT NULL,
	"amount" text,
	"deadline" timestamp NOT NULL,
	"description" text,
	"requirements" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tier" "plan_tier" NOT NULL,
	"price" integer NOT NULL,
	"description" text NOT NULL,
	"max_applications" integer NOT NULL,
	"max_artists" integer NOT NULL,
	"features" text[],
	"stripe_price_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"canceled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"content" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_onboarding" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"task" "onboarding_task" NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"data" json
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"avatar" text,
	"bio" text,
	"role" text DEFAULT 'user' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verification_token" text,
	"reset_password_token" text,
	"reset_password_expires" timestamp,
	"last_login" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "user_onboarding" ADD CONSTRAINT "user_onboarding_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;