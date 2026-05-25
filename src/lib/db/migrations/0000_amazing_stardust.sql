CREATE TABLE "ai_conversations" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"child_id" varchar(128),
	"role" varchar(10) NOT NULL,
	"content" text NOT NULL,
	"session_id" varchar(128),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "children" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"name" text NOT NULL,
	"nickname" text,
	"gender" varchar(10),
	"birth_date" date,
	"avatar_emoji" text DEFAULT '🌱',
	"notes" text,
	"parent_wish" text,
	"traits" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "growth_records" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"child_id" varchar(128),
	"user_id" varchar(128) NOT NULL,
	"category" varchar(30) DEFAULT 'other' NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"mood" varchar(20),
	"photo_url" text,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "heart_letters" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"child_id" varchar(128),
	"emotion" varchar(30) DEFAULT 'joy' NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"is_time_capsule" boolean DEFAULT false NOT NULL,
	"reveal_at_age" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"email" varchar(256),
	"name" text,
	"avatar_url" text,
	"role" varchar(20),
	"bio" text,
	"family_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"child_id" varchar(128) NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"milestone_type" varchar(30) DEFAULT 'custom',
	"emoji" text DEFAULT '⭐',
	"photo_url" text,
	"occurred_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parent_mood_logs" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"mood" varchar(30) NOT NULL,
	"note" text,
	"child_id" varchar(128),
	"logged_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ai_conv_user_id_idx" ON "ai_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_conv_session_id_idx" ON "ai_conversations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "ai_conv_created_at_idx" ON "ai_conversations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "children_user_id_idx" ON "children" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "growth_records_child_id_idx" ON "growth_records" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "growth_records_user_id_idx" ON "growth_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "growth_records_recorded_at_idx" ON "growth_records" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "heart_letters_user_id_idx" ON "heart_letters" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "heart_letters_child_id_idx" ON "heart_letters" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "heart_letters_created_at_idx" ON "heart_letters" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "milestones_child_id_idx" ON "milestones" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "milestones_occurred_at_idx" ON "milestones" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "parent_mood_logs_user_id_idx" ON "parent_mood_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "parent_mood_logs_logged_at_idx" ON "parent_mood_logs" USING btree ("logged_at");