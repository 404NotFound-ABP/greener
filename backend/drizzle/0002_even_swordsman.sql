CREATE TABLE "configuracoes_sistema" (
	"chave" varchar(50) PRIMARY KEY NOT NULL,
	"intervalo_coleta_segundos" integer DEFAULT 300 NOT NULL,
	"intervalo_atualizacao_segundos" integer DEFAULT 300 NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
