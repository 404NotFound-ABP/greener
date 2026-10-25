# Backend — GreenER API

Microsserviço em NestJS responsável pelo monitoramento de aplicações, coleta agendada de telemetria, persistência em PostgreSQL (Drizzle ORM) e cálculo de impacto ambiental (consumo em kWh e emissões em gCO₂e).

---

## 🏗️ Estrutura do Projeto

O backend foi construído com base na arquitetura modular do NestJS, separando responsabilidades por módulos de domínio, persistência e agendamento de tarefas em background:

```text
backend/
├── app.module.ts              # Módulo raiz: orquestra Schedule, Database, Servidores, Carbon, Impact e Collector
├── main.ts                    # Ponto de entrada da aplicação (Swagger, CORS e porta HTTP)
├── nest-cli.json              # Configurações do compilador do Nest CLI
├── package.json               # Dependências e scripts do projeto (Drizzle, Schedule, Axios)
├── tsconfig.json              # Configurações do TypeScript e aliases de importação (@/*)
├── drizzle.config.ts          # Configuração do Drizzle Kit (dialect, schema, migrations e credenciais)
├── drizzle/                   # Migrações SQL versionadas geradas pelo Drizzle Kit
│   ├── 0000_short_skullbuster.sql
│   └── 0001_shallow_donald_blake.sql
└── src/
    ├── config/
    │   └── config.ts          # Variáveis globais (URLs de APIs externas e INTERVALO_COLETA_SEGUNDOS)
    │
    ├── database/              # Camada de Persistência (PostgreSQL + Drizzle ORM)
    │   ├── index.ts           # Barrel export da camada de banco
    │   ├── database.module.ts # Módulo @Global() exportando DRIZZLE_PROVIDER
    │   ├── drizzle.provider.ts# Provider Pool node-postgres + Drizzle ORM com tipagem DrizzleDB
    │   └── schema/            # Esquemas relacionais do banco
    │       ├── index.ts
    │       ├── servidores.schema.ts # Tabelas: regioes, servidores e coletas_metricas
    │       └── users.schema.ts      # Tabela: users (autenticação e roles)
    │
    └── module/                # Módulos funcionais da aplicação
        ├── interface/         # Interfaces TypeScript para contratos de dados externos e internos
        │   ├── carbon.interface.ts
        │   ├── impact.interface.ts
        │   └── servidor.interface.ts
        │
        ├── servidores/        # Descoberta de serviços e consumo da Metrics Aggregator API
        │   ├── dto/
        │   ├── servidores.controller.ts  # Endpoints /api/servidores e /api/servidores/:id/metrics
        │   ├── servidores.service.ts
        │   └── servidores.module.ts
        │
        ├── carbon/            # Consulta de fatores de emissão regional
        │   ├── carbon.service.ts         # Consome a Carbon Intensity API (/regions)
        │   └── carbon.module.ts
        │
        ├── impact/            # Motor de Cálculo Ambiental (GreenER Engine)
        │   ├── dto/
        │   │   └── impact.dto.ts         # DTOs documentados no Swagger com nullable fields
        │   ├── impact.controller.ts      # Endpoint /api/impacto/:id
        │   ├── impact.service.ts         # CalculadoraImpacto (fórmulas oficiais: W, kWh e gCO2e)
        │   └── impact.module.ts
        │
        └── collector/         # Coletor Agendado em Background (Cron/Interval)
            ├── collector.controller.ts   # Endpoints de status, histórico e execução manual
            ├── collector.service.ts      # Ciclos periódicos (@Interval) e gravação no banco
            └── collector.module.ts
```

---

## 🗄️ Banco de Dados (PostgreSQL & Drizzle ORM)

A camada de persistência armazena o cadastro de regiões, servidores monitorados e a série temporal de histórico de medições.

### 1. Inicialização do Banco via Docker
O banco de dados roda em um container PostgreSQL isolado:
```bash
# Na raiz do projeto:
docker compose up -d
```
* **Container:** `greener-db`
* **Porta no host:** `5433` (mapeada para `5432` interna do container)
* **Status:** Monitorado via *healthcheck* nativo do PostgreSQL.

### 2. Variáveis de Ambiente (`.env`)
Configuradas na raiz do projeto e em `backend/.env`:
```env
PORT=3000

DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=123
DB_NAME=greener
```

### 3. Tabelas Criadas
1. **`regioes`**: Dados geográficos e fatores dinâmicos de intensidade de carbono (`carbon_intensity_gco2e_kwh`, `renewable_share_percent`).
2. **`servidores`**: Cadastro dos servidores descobertos e status atual oficial (`disponivel`, `indisponivel`, `removido`).
3. **`coletas_metricas`**: Série temporal histórica contendo todas as medições coletadas a cada ciclo:
   * Recursos: `cpu_percent`, `memoria_gb`, `disco_gb`, `rede_gb`.
   * Impacto calculado: `potencia_watts`, `energia_kwh`, `carbon_intensity_fator`, `emissoes_gco2e`.
   * Índices b-tree para consultas rápidas: `idx_coletas_servidor_tempo` e `idx_coletas_tempo`.
4. **`users`**: Usuários da aplicação com controle de papéis (`userRoleEnum: 'admin' | 'user'`).

### 4. Scripts de Migração (Drizzle Kit)
```bash
# Gera os arquivos SQL de migração com base nas alterações dos schemas TypeScript
npm run db:generate

# Executa as migrações no banco PostgreSQL
npm run db:migrate

# Abre a interface visual do Drizzle Studio no navegador
npm run db:studio
```

---

## ⏱️ Coleta Agendada de Telemetria (Schedule)

O monitoramento contínuo é orquestrado pelo módulo `@nestjs/schedule` em conjunto com o `CollectorService`.

### 1. Como Funciona o Ciclo de Coleta
* **Gatilho Inicial (`OnApplicationBootstrap`):** Assim que a aplicação sobe, uma rodada de coleta é disparada imediatamente, sem precisar aguardar o intervalo.
* **Agendamento Recorrente (`@Interval`):** Executa periodicamente a cada `INTERVALO_COLETA_SEGUNDOS` (configurado como **30 segundos** em [config.ts](file:///home/william/Desktop/manager/ativFatec/20262/ABP/backend/src/config/config.ts)).
* **Controle de Concorrência:** Possui trava interna para evitar que um ciclo sobreponha o outro caso a rede externa esteja lenta.

### 2. Etapas Executadas a Cada Ciclo
1. **Sincronização de Regiões:** Consulta `GET /regions` na Carbon API e realiza *upsert* na tabela `regioes`.
2. **Descoberta de Serviços:** Consulta `GET /services` no Metrics Aggregator.
3. **Reconhecimento de Serviços Removidos (Regra Oficial Greener.html):**
   * Conforme definido no desafio, serviços que deixam de ser listados em `/services` assumem o status **`removido`**.
   * Eles **NÃO** são apagados do banco de dados, preservando todo o histórico de medições passadas.
   * Se um serviço removido voltar a aparecer na lista externa em um ciclo futuro, seu status volta a ser atualizado normalmente (`disponivel` ou `indisponivel`).
4. **Cálculo e Gravação Histórica:**
   * Para cada servidor ativo no agregador, calcula Potência, Energia e Emissões.
   * Grava um novo snapshot na tabela `coletas_metricas`.

### 3. Endpoints da Coleta Agendada (`/api/coleta`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/coleta/status` | Exibe o total de registros no banco, intervalo ativo e data da última execução. |
| `GET` | `/api/coleta/historico` | Lista as últimas medições salvas (suporta filtros `?limite=20&servidorId=...`). |
| `POST` | `/api/coleta/executar` | Dispara manualmente uma rodada de coleta imediata. |

---

---

## 🌐 Endpoints Disponíveis para o Frontend

Abaixo estão todos os endpoints implementados e prontos para consumo da aplicação:

### 1. Servidores e Métricas (`/api/servidores`)

| Método | Rota | Descrição | Parâmetros / Query |
|---|---|---|---|
| `GET` | `/api/servidores/dashboard` | Visão consolidada para o Dashboard principal: contadores de status (disponíveis, indisponíveis, removidos), totais acumulados de energia e emissões, potência instantânea total e lista completa de servidores com última telemetria. | N/A |
| `GET` | `/api/servidores/ranking` | **Ranking de servidores** por maiores emissões ou consumo elétrico (**US13 / RF14**). | `?ordenarPor=emissoes` ou `energia`<br>`?criterio=acumulado` (histórico no banco) ou `instantaneo` (última coleta)<br>`?ordem=desc` ou `asc`<br>`?limite=10` |
| `GET` | `/api/servidores/comparativo` | Comparativo lado a lado de consumo e impacto entre serviços. | `?ids=billing-api,checkout-worker` (opcional; padrão compara todos) |
| `GET` | `/api/servidores/:id/historico` | **Série temporal histórica** de medições de um servidor específico para alimentar gráficos de linha (W, kWh, gCO₂e, CPU, RAM, Disco, Rede). | `:id` (ID do servidor)<br>`?limite=30` (padrão: 30 pontos cronológicos) |
| `GET` | `/api/servidores` | Lista cadastral de servidores salvos no banco ou direto da API externa. | `?origem=banco` (padrão) ou `?origem=externa` |
| `GET` | `/api/servidores/:id` | Consulta dados cadastrais de um servidor específico. | `:id` (ID do servidor) |
| `GET` | `/api/servidores/:id/metrics` | Consulta métricas brutas em tempo real direto da API externa. | `:id` (ID do servidor) |

### 2. Impacto Ambiental e Pegada de Carbono (`/api/impacto`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/impacto` | Calcula o impacto ambiental instantâneo de **todos os servidores** em lote. |
| `GET` | `/api/impacto/:id` | Calcula o impacto ambiental consolidado de um servidor específico (Potência em Watts, Energia em kWh e Emissões em gCO₂e). |
| `GET` | `/api/impacto/:id/discriminado` | **Detalhamento do impacto discriminado por métrica** (CPU, Memória, Disco, Rede): calcula individualmente para cada recurso seus Watts, kWh consumidos, gCO₂e emitidos e **% de participação no impacto total**. Suporta `?criterio=instantaneo` (medição atual) ou `?criterio=acumulado` (soma de todas as coletas salvas no banco de dados com total de coletas agregadas). |


### 3. Fatores de Carbono Regionais (`/api/carbon`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/carbon/regioes` | Lista as 5 regiões mundiais sincronizadas no banco com intensidade de carbono (`gCO2e/kWh`) e percentual de energia renovável. |
| `GET` | `/api/carbon/regioes/:code` | Consulta os fatores de carbono de uma região específica (ex: `br-sudeste`, `us-east`). |

---

### 2. Dados Recebidos (Contrato de Dados)

#### Schema TypeScript (`ServidorResponse[]`):
```typescript
interface Location {
  region_code: string;  // Código regional (ex: "br-sudeste", "us-east")
  country: string;      // País (ex: "Brazil")
  region: string;       // Estado/Província (ex: "Sudeste")
  city: string | null;  // Cidade aproximada
  latitude: number;     // Latitude decimal
  longitude: number;    // Longitude decimal
}

interface ServidorResponse {
  id: string;           // Identificador único (ex: "billing-api")
  name: string;         // Nome legível do serviço
  location: Location;   // Metadados de localização
  metrics_path: string; // Rota relativa das métricas (ex: "/metrics/billing-api")
}
```

---

### 3. Tratamento de Lista Vazia e Falhas

* **Cenário:** Quando nenhum serviço estiver cadastrado ou ativo no Agregador de Métricas.
* **Comportamento da API Externa:** Retorna código HTTP **`200 OK`** com corpo `[]` (array vazio).
* **Regra de Negócio do GreenER:**
  * O backend repassa o status **`200 OK`** com `[]` para o consumidor (sem disparar erro 404 ou 500).
  * A lista vazia **NÃO** deve apagar serviços já descobertos no banco de dados; apenas marca os serviços ausentes como inativos/removidos, preservando o histórico de medições passadas.

---

### 4. Tratamento de Falhas e Erros

| Cenário de Falha | Código HTTP Externo | Tratamento no Backend GreenER | Comportamento para o Usuário |
|---|---|---|---|
| **API Externa Indisponível / Timeout** | `ECONNREFUSED` / `ETIMEDOUT` | Capturado no bloco `catch` do Axios; lança `InternalServerErrorException`. | Retorna `500` com a mensagem `"Erro ao buscar servidores na API de métricas"`. |
| **Erro Interno no Agregador** | `500 Internal Server Error` | O Axios rejeita a Promise; o serviço registra o log e retorna erro 500 padronizado. | Retorna erro controlado sem derrubar o processo do NestJS. |
| **Rota inexistente na API externa** | `404 Not Found` | Lança exceção de servidor indicando inconsistência no endpoint externo configurado. | Retorna erro 500 informando falha de consulta externa. |


### 1. Modelo de Cálculo Oficial

O cálculo segue rigorosamente as constantes padronizadas do desafio:

$$\text{Potência CPU (W)} = \left(\frac{\text{CPU\%}}{100}\right) \times 100\text{ W}$$
$$\text{Potência Memória (W)} = \text{RAM (GB)} \times 0{,}375\text{ W/GB}$$
$$\text{Potência Disco (W)} = \text{Disco (GB)} \times 0{,}01\text{ W/GB}$$
$$\text{Potência Rede (W)} = \text{Rede (GB)} \times 0{,}02\text{ W/GB}$$

$$\text{Potência Estimada (W)} = P_{\text{CPU}} + P_{\text{RAM}} + P_{\text{Disco}} + P_{\text{Rede}}$$
$$\text{Tempo (h)} = \frac{\text{collection\_interval\_seconds}}{3600}$$
$$\text{Energia (kWh)} = \frac{\text{Potência (W)} \times \text{Tempo (h)}}{1000}$$
$$\text{CO}_2\text{e (g)} = \text{Energia (kWh)} \times \text{carbon\_intensity\_gco2e\_per\_kwh}$$

---

### 2. Status Operacionais Oficiais

Durante a execução do desafio, serviços podem ser adicionados, removidos ou tornar-se indisponíveis dinamicamente. O backend identifica e apresenta exatamente os 3 status oficiais da especificação:

| Status | Indicador | `metricas` | `impacto` | Comportamento no GreenER |
|---|---|:---:|:---:|---|
| **`disponivel`** | Listado em `/services` + Produzindo métricas (HTTP 200) | Preenchido | Preenchido com W, kWh e gCO₂e | Sucesso completo; pronto para exibição no dashboard. |
| **`indisponivel`** | Listado em `/services` + Não produzindo métricas (HTTP 500 / timeout) | `null` | `null` | Retorna JSON limpo com status indisponível sem derrubar a aplicação. |
| **`removido`** | Não listado em `/services` + Não produzindo métricas (HTTP 404 em métricas) | `null` | `null` | Serviço descomissionado ou removido; preserva todo o histórico no banco de dados. |

---

## 🚀 Como Executar o Backend Localmente

### Pré-requisitos
* Node.js v20+
* Docker & Docker Compose

### Passo a Passo

```bash
# 1. Subir o container do banco PostgreSQL
docker compose up -d

# 2. Instalar dependências da aplicação
cd backend
npm install --legacy-peer-deps

# 3. Rodar as migrações do banco (Drizzle ORM)
npm run db:migrate

# 4. Iniciar o servidor em modo de desenvolvimento (hot-reload)
npm run start:dev
```

### Documentação Interativa (Swagger)
Com o backend em execução, acesse pelo navegador:
👉 **`http://localhost:3000/docs`**
