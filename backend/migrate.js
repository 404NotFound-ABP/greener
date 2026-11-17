const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const path = require('path');

async function runMigrations() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  const pool = new Pool({
    host: DB_HOST || 'postgres',
    port: Number(DB_PORT) || 5432,
    user: DB_USER || 'postgres',
    password: DB_PASSWORD,
    database: DB_NAME || 'greener',
  });

  console.log(`[Migrate] Conectando ao PostgreSQL em ${DB_HOST || 'postgres'}:${DB_PORT || 5432}/${DB_NAME || 'greener'}...`);

  try {
    const db = drizzle(pool);
    const migrationsFolder = path.resolve(__dirname, 'drizzle');
    await migrate(db, { migrationsFolder });
    console.log('[Migrate] ✅ Migrações aplicadas com sucesso!');
  } catch (error) {
    console.error('[Migrate] ❌ Erro ao aplicar migrações:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
