CREATE TABLE "coletas_metricas" (
	"id" serial PRIMARY KEY NOT NULL,
	"servidor_id" varchar(100) NOT NULL,
	"codigo_regiao" varchar(50),
	"status" varchar(30) NOT NULL,
	"intervalo_segundos" integer,
	"cpu_percent" numeric,
	"memoria_gb" numeric,
	"disco_gb" numeric,
	"rede_gb" numeric,
	"potencia_watts" numeric,
	"energia_kwh" numeric,
	"carbon_intensity_fator" numeric,
	"emissoes_gco2e" numeric,
	"coletado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regioes" (
	"codigo" varchar(50) PRIMARY KEY NOT NULL,
	"pais" varchar(100) NOT NULL,
	"regiao" varchar(100) NOT NULL,
	"cidade" varchar(100),
	"latitude" numeric,
	"longitude" numeric,
	"carbon_intensity_gco2e_kwh" numeric NOT NULL,
	"renewable_share_percent" numeric NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servidores" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"nome" varchar(150) NOT NULL,
	"codigo_regiao" varchar(50),
	"caminho_metricas" varchar(255),
	"status_atual" varchar(30) DEFAULT 'disponivel' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coletas_metricas" ADD CONSTRAINT "coletas_metricas_servidor_id_servidores_id_fk" FOREIGN KEY ("servidor_id") REFERENCES "public"."servidores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servidores" ADD CONSTRAINT "servidores_codigo_regiao_regioes_codigo_fk" FOREIGN KEY ("codigo_regiao") REFERENCES "public"."regioes"("codigo") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_coletas_servidor_tempo" ON "coletas_metricas" USING btree ("servidor_id","coletado_em");--> statement-breakpoint
CREATE INDEX "idx_coletas_tempo" ON "coletas_metricas" USING btree ("coletado_em");