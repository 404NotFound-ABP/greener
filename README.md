# GreenER

Plataforma web para estimar o consumo de energia e as emissões de carbono de aplicações de software. O GreenER usa métricas de CPU, memória, disco e rede do agregador da UniLaunch e o fator de carbono da região de cada serviço.

## Situação para a review de 10/11/2026


| Camada | O que é possível verificar |
|---|---|
| Backend em NestJS e TypeScript | Descobre serviços, coleta métricas, estima energia e CO₂e e oferece consultas HTTP. Com as migrações aplicadas, a coleta real gravou 14 medições de 7 serviços durante o teste. Esses números variam a cada execução. |
| PostgreSQL 16 e Drizzle ORM | Armazena regiões, serviços, medições e usuários. Um registro de coleta foi recuperado após reiniciar o banco. A primeira execução exige a etapa de migração descrita abaixo. |
| Frontend em React e TypeScript | As telas de acesso, cadastro, administração e mapa são demonstrativas. Lista, marcadores, horário de atualização e indicadores ambientais ainda usam exemplos locais. |


## Executar a aplicação com Docker

Use um ambiente local de demonstração com Docker e Compose v2 ou posterior, conexão com a internet para as imagens e APIs da UniLaunch e portas livres. Execute os comandos a partir da raiz deste repositório.

1. Na primeira execução, copie [`.env-example`](.env-example) para `.env` e preencha `DB_PASSWORD` com uma senha local. Para reproduzir as portas abaixo, mantenha os demais valores de banco e portas do exemplo. Em PowerShell, a cópia pode ser feita com `Copy-Item .env-example .env`. Em Linux/macOS, use `cp .env-example .env`.

2. Valide o Compose, construa as imagens e aguarde o PostgreSQL ficar saudável.

   ```sh
   docker compose config --quiet
   docker compose build
   docker compose up -d --wait postgres
   ```

3. Aplique as migrações versionadas. O comando usa o migrador do Drizzle incluído na imagem do backend e as credenciais que o Compose fornece ao container. Execute esta etapa em um banco novo ou quando houver novas migrações. Prossiga após o comando terminar com código zero.

   ```sh
   docker compose run --rm --no-deps backend node -e "
   const { Pool } = require('pg');
   const { drizzle } = require('drizzle-orm/node-postgres');
   const { migrate } = require('drizzle-orm/node-postgres/migrator');
   const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
   const pool = new Pool({
     host: DB_HOST, port: Number(DB_PORT), user: DB_USER,
     password: DB_PASSWORD, database: DB_NAME
   });
   migrate(drizzle(pool), { migrationsFolder: './drizzle' })
     .catch(error => { console.error(error); process.exitCode = 1; })
     .finally(() => pool.end());
   "
   ```

4. Inicie as aplicações e confira o estado dos três serviços.

   ```sh
   docker compose up -d
   docker compose ps
   ```

| Acesso local com o `.env` de exemplo | Resultado esperado |
|---|---|
| [Interface](http://localhost:3000) | Tela de login do protótipo. |
| [Swagger](http://localhost:3001/docs) | Documentação interativa da API. |
| [Dados do dashboard](http://localhost:3001/api/servidores/dashboard) | HTTP 200 e JSON com `resumo` e `servidores`. Com os provedores disponíveis, verifique a última coleta de um serviço. |
| [Estado da coleta](http://localhost:3001/api/coleta/status) | Intervalo do agendador, última execução e quantidade de medições persistidas. |

A porta do PostgreSQL no host é `5433`. Entre containers, a API usa `postgres:5432`. Para encerrar o ambiente e preservar os registros no volume, use `docker compose down`.

**Se o Swagger abrir e o dashboard responder HTTP 500**, confira se as migrações foram aplicadas. Em um volume novo sem tabelas, os três containers chegaram a subir e o PostgreSQL ficou saudável. A consulta do dashboard falhou com `relation "servidores" does not exist`. Nesse caso, execute a etapa 3 e reinicie o backend com `docker compose restart backend`.

O Compose atual ainda usa a configuração JWT padrão do backend, e o código cria um administrador inicial com credencial fixa registrada no log. A demonstração deve ficar em ambiente local controlado enquanto essa pendência estiver aberta. [Issue de segurança #138](https://github.com/404NotFound-ABP/greener/issues/138)

## Documentação

- [Índice da documentação e entregas](docs/README.md)
- [Guia do frontend](frontend/README.md) e [guia do backend](backend/README.md)
- [Backlog do produto](docs/academico/backlog.md) e [quadro do projeto](https://github.com/users/404NotFound-ABP/projects/5)
- [Protótipo no Figma](https://www.figma.com/design/zPrdeRlYtzyWwmbuTiwQqE/GeenER?node-id=0-1)
