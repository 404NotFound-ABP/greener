import { pgTable, integer, timestamp, varchar } from 'drizzle-orm/pg-core';

// Tabela de Configurações Dinâmicas do Sistema (ex: intervalos de coleta e atualização)
export const configuracoesSistema = pgTable('configuracoes_sistema', {
  chave: varchar('chave', { length: 50 }).primaryKey(),
  intervaloColetaSegundos: integer('intervalo_coleta_segundos').notNull().default(300),
  intervaloAtualizacaoSegundos: integer('intervalo_atualizacao_segundos').notNull().default(300),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

