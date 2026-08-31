CREATE TABLE `couples` (
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`invite_code` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `couples_invite_code_unique` ON `couples` (`invite_code`);--> statement-breakpoint
CREATE TABLE `events` (
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`all_day` integer DEFAULT false NOT NULL,
	`is_private` integer DEFAULT false NOT NULL,
	`is_sacred` integer DEFAULT false NOT NULL,
	`google_event_id` text,
	`couple_id` text NOT NULL,
	`creator_id` text NOT NULL,
	FOREIGN KEY (`couple_id`) REFERENCES `couples`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`couple_id` text NOT NULL,
	`title` text NOT NULL,
	`date` integer NOT NULL,
	`recurring` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`couple_id`) REFERENCES `couples`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `moods` (
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`mood` text NOT NULL,
	`note` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mood_user_date` ON `moods` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `sacred_times` (
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`couple_id` text NOT NULL,
	`title` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`day_of_week` integer,
	`date` integer,
	FOREIGN KEY (`couple_id`) REFERENCES `couples`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text,
	`avatar` text,
	`google_id` text,
	`google_refresh_token` text,
	`couple_id` text,
	`color` text DEFAULT 'coral' NOT NULL,
	FOREIGN KEY (`couple_id`) REFERENCES `couples`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_id_unique` ON `users` (`google_id`);