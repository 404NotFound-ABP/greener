# Backend do GreenER

A API NestJS consulta os serviços auxiliares da UniLaunch, coleta métricas de infraestrutura, estima potência, energia e emissão e grava as leituras no PostgreSQL por meio do Drizzle ORM. A API oferece consultas para o dashboard. No commit `1e075b9`, o frontend ainda apresenta dados demonstrativos.

## Executar e verificar com Docker

Siga o [roteiro da aplicação completa](../README.md#executar-a-aplicação-com-docker) a partir da raiz. Ele inclui o preenchimento do `.env`, a construção das imagens e a aplicação das [migrações versionadas](drizzle/) antes da primeira coleta. Com as portas de exemplo, o Swagger fica em [localhost:3001/docs](http://localhost:3001/docs).

1. Abra [o estado da coleta](http://localhost:3001/api/coleta/status). Com as APIs auxiliares acessíveis, confira `ultimaExecucao`, `totalMedicoesNoBanco` e o intervalo configurado.
2. Abra [os dados do dashboard](http://localhost:3001/api/servidores/dashboard). Escolha um serviço com `ultima_coleta` e anote seu ID e o horário dessa leitura.
3. No Swagger, execute `GET /api/coleta/historico` com o mesmo ID em `servidorId`. Compare o horário e os valores de energia e emissão. A rota do histórico de coleta retorna os campos persistidos, incluindo valores nulos.
4. Para conferir as leituras diretamente no banco, execute na raiz o comando abaixo. Ele usa `DB_USER=postgres` e `DB_NAME=greener`, como no arquivo de exemplo. Ajuste esses dois argumentos se você os alterou.

```sh
docker compose exec postgres psql -U postgres -d greener -c "SELECT servidor_id, coletado_em, intervalo_segundos, energia_kwh, emissoes_gco2e FROM coletas_metricas ORDER BY coletado_em DESC, id DESC LIMIT 10"
```

Compare leituras do mesmo serviço **e do mesmo horário**. Uma nova consulta à rota de métricas da UniLaunch pode retornar outros valores.

## Componentes e dados persistidos

| Componente | Responsabilidade |
|---|---|
| [Servidores](src/module/servidores/) e [carbono](src/module/carbon/) | Descoberta, consulta de métricas e de fatores de emissão regionais. |
| [Cálculo de impacto](src/module/impact/impact.service.ts) | Conversão de CPU, memória, disco, rede, intervalo de coleta e fator regional em W, kWh e gCO₂e. [Fórmulas e limitações](../docs/calculos.md) |
| [Coletor](src/module/collector/collector.service.ts) | Inicia uma coleta no arranque e tenta outra a cada 30 segundos. Uma trava evita sobreposição de ciclos na mesma instância. O intervalo agendado pode diferir do período informado para uma medição específica. |
| [Schemas Drizzle](src/database/schema/) | `regioes` guarda localização e fator de carbono. `servidores` guarda o cadastro e o estado mais recente. `coletas_metricas` preserva horário, intervalo, estado, métricas e impacto de cada leitura. `users` guarda os dados de acesso e o perfil. |
| [Autenticação](src/module/auth/) e [usuários](src/module/users/) | O login confere a senha com bcrypt e emite um JWT. O perfil exige token e a administração de usuários exige o papel de administrador. |

## Rotas que ajudam a demonstrar a entrega

| Consulta | O que retorna |
|---|---|
| `GET /api/servidores?origem=externa` | Cadastro informado pelo agregador naquele momento. O padrão, `GET /api/servidores`, consulta o banco. |
| `GET /api/servidores/:id/metrics` e `GET /api/impacto/:id` | Métricas do provedor e estimativa individual. A rota `GET /api/impacto/:id/discriminado` detalha as parcelas por recurso. |
| `GET /api/carbon/regioes` e `GET /api/carbon/regioes/:code` | Lista de regiões e fator regional consultados no serviço externo de carbono. |
| `GET /api/servidores/dashboard` e `GET /api/servidores/:id/historico` | Resumo consolidado e série recente do serviço lidos do banco. |
| `GET /api/servidores/ranking` e `GET /api/servidores/comparativo` | Ordenação por energia ou emissão e comparação entre serviços. Filtro por período e integração com as telas seguem no planejamento. |
| `POST /api/coleta/executar` | Solicita um ciclo manual. Confira os detalhes e a quantidade de registros persistidos para confirmar o resultado. |

Os contratos atuais, exemplos e limites de cada integração estão na [documentação da API](../docs/api.md). Os endereços das consultas externas estão em [config.ts](src/config/config.ts), com o intervalo do agendador e as variáveis de ambiente explicados no [guia de configuração](src/config/README.md).

## Como interpretar estados e valores

Na coleta, um serviço que sai da lista do agregador recebe o estado `removido`. O histórico anterior é preservado e o cadastro pode ser reativado quando o serviço retorna. Uma leitura completa recebe `disponivel`. A verificação de 06/11/2026 identificou quatro limitações.

- Uma falha ao obter métricas e uma resposta sem o objeto de métricas recebem o mesmo estado, `indisponivel`. A distinção exigida para “sem métricas” segue pendente.
- Dashboard e histórico por servidor convertem campos nulos em zero. Para investigar uma leitura ausente, consulte `/api/coleta/historico` ou a linha original no PostgreSQL. Os totais do dashboard acumulam todas as medições gravadas e ainda precisam indicar período e cobertura.
- O cálculo discriminado pode aplicar 30 segundos ao recorrer à última leitura histórica, mesmo com outro intervalo gravado.
- Se a descoberta falhar, a coleta manual pode devolver HTTP 201 com `status: sucesso`, zero serviços processados e o erro em `detalhes`. [Registro da verificação](../docs/sprints/sprint-2.md)

## Desenvolvimento local da API

Para trabalhar no NestJS fora dos containers, use o PostgreSQL no Compose e execute **somente a API no host**. Na raiz, prepare o `.env` conforme o [roteiro principal](../README.md#executar-a-aplicação-com-docker). Mantenha `DB_HOST=localhost` e `DB_PORT=5433` para o acesso ao banco pelo host e defina um `JWT_SECRET` local. A versão de Node.js usada na verificação do build foi 24.20.0.

```sh
docker compose up -d --build --wait postgres
cd backend
npm ci --legacy-peer-deps
npm run db:migrate
npm run build
npm run start:dev
```

Neste modo, o Nest lê `PORT` e usa a porta `3000` quando ela está ausente. O Swagger fica em `http://localhost:3000/docs`. No modo totalmente containerizado, `PORT_BACK` publica a API em `3001`. Para inspecionar as tabelas durante o desenvolvimento, use `npm run db:studio` na pasta `backend`. O pacote fornece scripts de build e migração. Lint e testes automatizados do backend seguem pendentes.
