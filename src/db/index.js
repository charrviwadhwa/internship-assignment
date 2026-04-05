import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;


if (!connectionString) {
  console.error("DATABASE_URL is missing in .env file");
  process.exit(1);
}

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });