PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`cover_image_url` text,
	`content` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`published_at` integer,
	`author_id` text,
	`category_id` text NOT NULL,
	`is_subscription_only` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`language` text DEFAULT 'zh' NOT NULL,
	`reading_time` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_posts`("id", "slug", "title", "summary", "cover_image_url", "content", "status", "published_at", "author_id", "category_id", "is_subscription_only", "sort_order", "tags", "language", "reading_time", "created_at", "updated_at") SELECT "id", "slug", "title", "summary", "cover_image_url", "content", "status", "published_at", "author_id", "category_id", "is_subscription_only", "sort_order", "tags", "language", "reading_time", "created_at", "updated_at" FROM `posts`;--> statement-breakpoint
DROP TABLE `posts`;--> statement-breakpoint
ALTER TABLE `__new_posts` RENAME TO `posts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);