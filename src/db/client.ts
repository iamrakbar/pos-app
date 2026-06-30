import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const sqliteDb = openDatabaseSync('pos.db', { enableChangeListener: true });

export const db = drizzle(sqliteDb, { schema });
