const m0000 = `
CREATE TABLE \`areas\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`name\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`categories\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`name\` text NOT NULL,
\t\`synced_at\` integer,
\t\`is_dirty\` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`meta\` (
\t\`key\` text PRIMARY KEY NOT NULL,
\t\`value\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`order_items\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`order_id\` text NOT NULL,
\t\`product_name\` text NOT NULL,
\t\`qty\` integer NOT NULL,
\t\`unit_price\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`orders\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`transaction_id\` text NOT NULL,
\t\`order_type\` text NOT NULL,
\t\`table_name\` text,
\t\`payment_method\` text NOT NULL,
\t\`status\` text DEFAULT 'pending' NOT NULL,
\t\`subtotal\` integer NOT NULL,
\t\`total\` integer NOT NULL,
\t\`total_qty\` integer DEFAULT 0 NOT NULL,
\t\`customer_type\` text DEFAULT 'merchant' NOT NULL,
\t\`customer_name\` text,
\t\`notes\` text,
\t\`created_at\` text NOT NULL,
\t\`synced_at\` integer,
\t\`is_dirty\` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`payment_methods\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`code\` text NOT NULL,
\t\`name\` text NOT NULL,
\t\`fee_rate\` real DEFAULT 0 NOT NULL,
\t\`group_type\` text NOT NULL,
\t\`group_label\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`products\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`name\` text NOT NULL,
\t\`price\` integer NOT NULL,
\t\`original_price\` integer,
\t\`image_url\` text,
\t\`thumbnail_url\` text,
\t\`category_id\` text,
\t\`is_active\` integer DEFAULT 1 NOT NULL,
\t\`add_ons_json\` text DEFAULT '[]' NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL,
\t\`synced_at\` integer,
\t\`is_dirty\` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`tables\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`area_id\` text NOT NULL,
\t\`area_name\` text NOT NULL,
\t\`name\` text NOT NULL,
\t\`pax\` integer NOT NULL
);
`;

export default {
    journal: {
        entries: [
            {
                idx: 0,
                when: 1782804247242,
                tag: '0000_futuristic_siren',
                breakpoints: true,
            },
        ],
    },
    migrations: {
        m0000,
    },
};
