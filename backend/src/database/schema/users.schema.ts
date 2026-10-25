import { pgTable, varchar, timestamp, serial, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('role', ['admin', 'user']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(), 
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), // Tem que ser encriptada 
  name: varchar('name', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  time_updated: timestamp('time_updated').defaultNow().notNull(),
  role: userRoleEnum('role').default('user').notNull(),
});