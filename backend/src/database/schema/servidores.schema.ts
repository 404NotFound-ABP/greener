import { pgTable, varchar, timestamp, numeric, integer, serial, boolean, index } from 'drizzle-orm/pg-core';

// Tabela de Regiões
export const regioes = pgTable('regioes', {
  codigo: varchar('codigo', { length: 50 }).primaryKey(),
  pais: varchar('pais', { length: 100 }).notNull(),
  regiao: varchar('regiao', { length: 100 }).notNull(),
  cidade: varchar('cidade', { length: 100 }),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  carbonIntensityGco2eKwh: numeric('carbon_intensity_gco2e_kwh').notNull(),
  renewableSharePercent: numeric('renewable_share_percent').notNull(),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

// Tabela de Servidores Cadastrados
export const servidores = pgTable('servidores', {
  id: varchar('id', { length: 100 }).primaryKey(),
  nome: varchar('nome', { length: 150 }).notNull(),
  codigoRegiao: varchar('codigo_regiao', { length: 50 }).references(() => regioes.codigo),
  caminhoMetricas: varchar('caminho_metricas', { length: 255 }),
  statusAtual: varchar('status_atual', { length: 30 }).default('disponivel').notNull(),
  ativo: boolean('ativo').default(true).notNull(),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

// 3. Tabela Histórica de Coletas (Série Temporal)
export const coletasMetricas = pgTable('coletas_metricas', {
  id: serial('id').primaryKey(),
  servidorId: varchar('servidor_id', { length: 100 }).references(() => servidores.id).notNull(),
  codigoRegiao: varchar('codigo_regiao', { length: 50 }),
  status: varchar('status', { length: 30 }).notNull(), // 'disponivel', 'indisponivel', 'sem_metricas'
  intervaloSegundos: integer('intervalo_segundos'),
  cpuPercent: numeric('cpu_percent'),
  memoriaGb: numeric('memoria_gb'),
  discoGb: numeric('disco_gb'),
  redeGb: numeric('rede_gb'),
  potenciaWatts: numeric('potencia_watts'),
  energiaKwh: numeric('energia_kwh'),
  carbonIntensityFator: numeric('carbon_intensity_fator'),
  emissoesGco2e: numeric('emissoes_gco2e'),
  coletadoEm: timestamp('coletado_em').defaultNow().notNull(),
}, (table) => ({
  idxServidorTempo: index('idx_coletas_servidor_tempo').on(table.servidorId, table.coletadoEm),
  idxTempo: index('idx_coletas_tempo').on(table.coletadoEm),
}));
