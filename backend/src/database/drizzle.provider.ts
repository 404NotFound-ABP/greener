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
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    return drizzle(pool, { schema });
  },
};
