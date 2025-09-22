CREATE TABLE `bookmark` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`image` text,
	`user_id` text NOT NULL,
	`collection_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`is_main_bookmark` integer GENERATED ALWAYS AS ((
		CASE
			WHEN collection_id IS NULL THEN 1
			ELSE 0
		END
	)) VIRTUAL NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `bookmark_collection`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bookmark_collection` (
	`id` text PRIMARY KEY DEFAULT (uuid()) NOT NULL,
	`title` text NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`is_main_bookmark_collection` integer GENERATED ALWAYS AS ((
		CASE
			WHEN parent_id IS NULL THEN 1
			ELSE 0
		END
	)) VIRTUAL NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `bookmark_collection`(`id`) ON UPDATE no action ON DELETE cascade
);
