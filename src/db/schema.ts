import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const meta = sqliteTable('meta', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
});

export const categories = sqliteTable('categories', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    synced_at: integer('synced_at'),
    is_dirty: integer('is_dirty').notNull().default(1),
});

export const products = sqliteTable('products', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    price: integer('price').notNull(),
    original_price: integer('original_price'),
    image_url: text('image_url'),
    thumbnail_url: text('thumbnail_url'),
    category_id: text('category_id'),
    is_active: integer('is_active').notNull().default(1),
    add_ons_json: text('add_ons_json').notNull().default('[]'),
    created_at: integer('created_at').notNull(),
    updated_at: integer('updated_at').notNull(),
    synced_at: integer('synced_at'),
    is_dirty: integer('is_dirty').notNull().default(1),
});

export const areas = sqliteTable('areas', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
});

export const tables = sqliteTable('tables', {
    id: text('id').primaryKey(),
    area_id: text('area_id').notNull(),
    area_name: text('area_name').notNull(),
    name: text('name').notNull(),
    pax: integer('pax').notNull(),
});

