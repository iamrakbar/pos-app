CREATE TABLE `areas` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`synced_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_name` text NOT NULL,
	`qty` integer NOT NULL,
	`unit_price` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`order_type` text NOT NULL,
	`table_name` text,
	`payment_method` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`subtotal` integer NOT NULL,
	`total` integer NOT NULL,
	`total_qty` integer DEFAULT 0 NOT NULL,
	`customer_type` text DEFAULT 'merchant' NOT NULL,
	`customer_name` text,
	`notes` text,
	`created_at` text NOT NULL,
	`synced_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`fee_rate` real DEFAULT 0 NOT NULL,
	`group_type` text NOT NULL,
	`group_label` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price` integer NOT NULL,
	`original_price` integer,
	`image_url` text,
	`thumbnail_url` text,
	`category_id` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`add_ons_json` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`synced_at` integer,
	`is_dirty` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tables` (
	`id` text PRIMARY KEY NOT NULL,
	`area_id` text NOT NULL,
	`area_name` text NOT NULL,
	`name` text NOT NULL,
	`pax` integer NOT NULL
);
