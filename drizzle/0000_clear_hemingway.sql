CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`hash` text NOT NULL,
	`size` integer NOT NULL,
	`expiry` text,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_documents_order` ON `documents` (`order_id`);--> statement-breakpoint
CREATE TABLE `members` (
	`email` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`role` text NOT NULL,
	`branch` text DEFAULT 'all' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`branch` text NOT NULL,
	`data` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_records_kind_branch` ON `records` (`kind`,`branch`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stock` (
	`id` text PRIMARY KEY NOT NULL,
	`branch` text NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`qty` integer NOT NULL,
	`price` integer NOT NULL,
	`currency` text NOT NULL,
	`minimum` integer NOT NULL,
	`unit` text NOT NULL,
	`expiry` text
);
