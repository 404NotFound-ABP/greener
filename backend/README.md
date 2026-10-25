# Backend — GreenER API

Microsserviço em NestJS responsável pelo monitoramento de aplicações, coleta de métricas de telemetria e cálculo de impacto ambiental (consumo em kWh e emissões em gCO₂e).

---

## 🏗️ Estrutura do Projeto

O backend foi construído com base na arquitetura modular do NestJS, separando responsabilidades por módulos de domínio, serviços e persistência:

```text
backend/
├── app.module.ts              # Módulo raiz que importa e orquestra todos os módulos
├── main.ts                    # Ponto de entrada da aplicação (Inicializar o servidor, Swagger e CORS)
├── nest-cli.json              # Configurações do compilador do Nest CLI
├── package.json               # Dependências e scripts do projeto
├── tsconfig.json              # Configurações do compilador TypeScript
├── assets/                    # Armazenamento de arquivos internos do servidor
├── public/                    # Arquivos estáticos públicos
└── src/
    ├── config/
    │   └── config.ts          # Variáveis e URLs base dos microsserviços externos
    │
    ├── database/              # Camada de persistência e banco de dados
    │   ├── database.module.ts # Módulo de conexão com o banco
    │   ├── database.service.ts# Serviço de acesso ao banco
    │   ├── drizzle.provider.ts# Provedor de injeção da instância do Drizzle ORM
    │   └── schema/            # Esquemas relacionais do PostgreSQL (Drizzle)
    │       ├── index.ts
    │       ├── servidores.schema.ts
    │       └── users.schema.ts
    │
    └── module/                # Módulos funcionais da aplicação
        ├── auth/              # Autenticação, autorização e guardas de rota (JWT)
        ├── interface/         # Interfaces TypeScript para contratos de dados
        │   ├── carbon.interface.ts
        │   ├── impact.interface.ts
        │   └── servidor.interface.ts
        │
        ├── servidores/        # Descoberta de serviços e coleta de métricas brutas
        │   ├── dto/
        │   ├── servidores.controller.ts  # Endpoints /api/servidores e /api/servidores/:id/metrics
        │   ├── servidores.service.ts     # Consome o Metrics Aggregator
        │   └── servidores.module.ts
        │
        ├── carbon/            # Consulta de fatores regionais de carbono
        │   ├── dto/
        │   ├── carbon.controller.ts
        │   ├── carbon.service.ts         # Consome a Carbon Intensity API
        │   └── carbon.module.ts
        │
        └── impact/            # Motor de cálculo ambiental (GreenER Engine)
            ├── dto/
            │   └── impact.dto.ts         # DTOs documentados para Swagger
            ├── impact.controller.ts      # Endpoint /api/impacto/:id
            ├── impact.service.ts         # Calculadora de W, kWh e gCO2e
            └── impact.module.ts
```

---

### 1. Como Consultar `/services`

* **Origem Externa:** `https://metrics.unilaunch.org/services` (Metrics Aggregator API)
* **Endpoint Interno (GreenER):** `GET /api/servidores`
* **Método HTTP:** `GET`
* **Autenticação:** Não requer autenticação.
* **Headers:** `Accept: application/json`

#### Exemplo de Chamada (cURL):
```bash
# Consulta direta ao backend GreenER
curl -X GET http://localhost:3000/api/servidores

# Consulta direta à API externa de métricas
curl -X GET https://metrics.unilaunch.org/services
```

---

### 2. Dados Recebidos (Contrato de Dados)

A API retorna uma lista (`Array`) de objetos contendo identificação, localização geográfica e caminho de métricas:

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

#### Exemplo de Payload de Sucesso (HTTP 200):
```json
[
  {
    "id": "billing-api",
    "name": "Billing API",
    "location": {
      "region_code": "br-sudeste",
      "country": "Brazil",
      "region": "Sudeste",
      "city": "Sao Paulo",
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    "metrics_path": "/metrics/billing-api"
  },
  {
    "id": "checkout-worker",
    "name": "Checkout Worker",
    "location": {
      "region_code": "us-east",
      "country": "United States",
      "region": "Virginia",
      "city": "Ashburn",
      "latitude": 39.0438,
      "longitude": -77.4874
    },
    "metrics_path": "/metrics/checkout-worker"
  }
]
```

---

### 3. Tratamento de Lista Vazia

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

### 2. Apresentação Dinâmica de Status e Ocorrências

Durante a execução ou testes dinâmicos de apresentação, o endpoint responde de forma resiliente para não quebrar a interface do usuário:

| Ocorrência | Status Retornado | `metricas` | `impacto` | Comportamento no GreenER |
|---|:---:|:---:|:---:|---|
| **Serviço respondendo com métricas válidas (HTTP 200)** | **`"disponivel"`** | Preenchido | Preenchido com W, kWh e gCO₂e | Sucesso completo; pronto para exibição no dashboard. |
| **Serviço listado, mas exportador indisponível (HTTP 500 / timeout)** | **`"indisponivel"`** | `null` | `null` | O backend não cai em erro 500; retorna JSON limpo indicando indisponibilidade. |
| **Serviço listado, mas sem telemetria suficiente** | **`"sem_metricas"`** | `null` | `null` | Informa que o serviço existe, mas não há métricas para estimar. |
| **Serviço inexistente na base externa** | *HTTP 404* | — | — | Lança `NotFoundException` indicando que o ID não foi localizado. |
| **Métricas disponíveis, mas API de Carbono indisponível** | **`"disponivel"`** | Preenchido | Potência e Energia calculados; $\text{CO}_2\text{e} = \text{null}$ | Dados ausentes não viram zero: energia fica calculada e emissão marcada como indisponível. |

---

### 3. Exemplos de Payload

#### A. Servidor Disponível (Sucesso completo):
```json
{
  "servidor_id": "billing-api",
  "nome": "Billing API",
  "status": "disponivel",
  "regiao": {
    "codigo": "br-sudeste",
    "pais": "Brazil",
    "cidade": "Sao Paulo",
    "carbon_intensity_gco2e_kwh": 85,
    "renewable_share_percent": 83
  },
  "metricas": {
    "intervalo_segundos": 27,
    "cpu_percent": 62.67,
    "memoria_gb": 3.17,
    "disco_gb": 19.26,
    "rede_gb": 0.45
  },
  "impacto": {
    "potencia_watts": 64.06,
    "energia_kwh": 0.0004804,
    "emissoes_gco2e": 0.0408
  }
}
```

#### B. Servidor Indisponível (API externa retornou HTTP 500):
```json
{
  "servidor_id": "checkout-worker",
  "nome": "Checkout Worker",
  "status": "indisponivel",
  "regiao": {
    "codigo": "us-east",
    "pais": "United States",
    "cidade": "Ashburn",
    "carbon_intensity_gco2e_kwh": 378,
    "renewable_share_percent": 26
  },
  "metricas": null,
  "impacto": null
}
```

---

## 🚀 Como Executar o Backend Localmente

### Pré-requisitos
* Node.js v20+
* TypeScript 6

### Comandos de Execução - Sem Docker
```bash
# 1. Instalar dependências
npm install --legacy-peer-deps

# 2. Iniciar em modo de desenvolvimento (hot-reload)
npm start dev

```

### Documentação Interativa (Swagger)
Com o backend em execução, acesse pelo navegador:
👉 **`http://localhost:3000/docs`**
