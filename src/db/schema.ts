import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

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

export const payment_methods = sqliteTable('payment_methods', {
    id: text('id').primaryKey(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    fee_rate: real('fee_rate').notNull().default(0),
    group_type: text('group_type').notNull(),
    group_label: text('group_label').notNull(),
});

export const orders = sqliteTable('orders', {
    id: text('id').primaryKey(),
    transaction_id: text('transaction_id').notNull(),
    order_type: text('order_type').notNull(),
    table_name: text('table_name'),
    payment_method: text('payment_method').notNull(),
    status: text('status').notNull().default('pending'),
    subtotal: integer('subtotal').notNull(),
    total: integer('total').notNull(),
    total_qty: integer('total_qty').notNull().default(0),
    customer_type: text('customer_type').notNull().default('merchant'),
    customer_name: text('customer_name'),
    notes: text('notes'),
    created_at: text('created_at').notNull(),
    synced_at: integer('synced_at'),
    is_dirty: integer('is_dirty').notNull().default(1),
});

export const order_items = sqliteTable('order_items', {
    id: text('id').primaryKey(),
    order_id: text('order_id').notNull(),
    product_name: text('product_name').notNull(),
    qty: integer('qty').notNull(),
    unit_price: integer('unit_price').notNull(),
});
