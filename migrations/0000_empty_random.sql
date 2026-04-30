CREATE TABLE "assignment_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"assignment_id" integer NOT NULL,
	"question" text NOT NULL,
	"ideal_answer" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"classroom_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" text,
	"ai_strictness" text DEFAULT 'standard' NOT NULL,
	"adaptive_deadlines" boolean DEFAULT false NOT NULL,
	"created_at" text DEFAULT 'now' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classroom_students" (
	"id" serial PRIMARY KEY NOT NULL,
	"classroom_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"joined_at" text DEFAULT 'now' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classrooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"teacher_id" integer NOT NULL,
	"code" text NOT NULL,
	"created_at" text DEFAULT 'now' NOT NULL,
	CONSTRAINT "classrooms_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "concepts" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"prerequisites" text DEFAULT '[]' NOT NULL,
	"ideal_explanation" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "earned_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"badge_type" text NOT NULL,
	"concept_id" integer,
	"earned_at" text DEFAULT 'now' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"content" text NOT NULL,
	"is_ai_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"is_ai_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"concept_id" integer NOT NULL,
	"student_response" text NOT NULL,
	"score" real,
	"feedback" text,
	"misconception_type" text,
	"misconception_detail" text,
	"blooms_level" text,
	"created_at" text DEFAULT 'now' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mastery_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"concept_id" integer NOT NULL,
	"score" real DEFAULT 0 NOT NULL,
	"ease_factor" real DEFAULT 2.5 NOT NULL,
	"interval" integer DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"next_review_at" text,
	"updated_at" text DEFAULT 'now' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reflections" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"concept_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" text DEFAULT 'now' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"subject" text NOT NULL,
	"topic" text,
	"started_at" text DEFAULT 'now' NOT NULL,
	"ended_at" text
);
--> statement-breakpoint
CREATE TABLE "student_assignment_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_assignment_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"answer" text NOT NULL,
	"ai_score" real,
	"ai_feedback" text
);
--> statement-breakpoint
CREATE TABLE "student_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"assignment_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"score" real,
	"feedback" text,
	"submitted_at" text
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"created_at" text DEFAULT 'now' NOT NULL,
	CONSTRAINT "students_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "study_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"title" text NOT NULL,
	"subject" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"type" text NOT NULL,
	"priority" text NOT NULL,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
