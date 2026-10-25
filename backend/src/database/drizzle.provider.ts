import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carrega .env da raiz do projeto ou da pasta backend
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

export const DRIZZLE_PROVIDER = 'DRIZZLE_DATABASE';
export type DrizzleDB = NodePgDatabase<typeof schema>;

export const DrizzleProvider = {
  provide: DRIZZLE_PROVIDER,
  useFactory: (): DrizzleDB => {
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5433,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '123',
      database: process.env.DB_NAME || 'greener',
    });
    return drizzle(pool, { schema });
  },
};
