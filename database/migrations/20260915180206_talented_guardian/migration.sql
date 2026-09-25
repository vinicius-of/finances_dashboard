CREATE TABLE `ventures` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`internal_code` text,
	`category` text NOT NULL,
	`type` text NOT NULL,
	`initial_value` integer NOT NULL,
	`bought_at` text NOT NULL,
	`expires_in` text,
	`indexer` text,
	`rate` real,
	`source` text,
	`quantity` real,
	`unit_price` integer,
	`total_price` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `venture_snapshots` (
	`id` text PRIMARY KEY,
	`venture_id` text NOT NULL,
	`reference_date` text NOT NULL,
	`current_unit_price` integer,
	`current_quantity_held` real,
	`current_total_value` integer NOT NULL,
	`total_contributed` integer NOT NULL,
	`gross_profit` integer NOT NULL,
	`profit_percentage` real NOT NULL,
	`type` text NOT NULL,
	`movement_value` integer,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	CONSTRAINT `fk_venture_snapshots_venture_id_ventures_id_fk` FOREIGN KEY (`venture_id`) REFERENCES `ventures`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ventures_internal_code_active_unique` ON `ventures` (`internal_code`) WHERE "ventures"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `venture_snapshots_venture_id_reference_date_idx` ON `venture_snapshots` (`venture_id`,`reference_date`);