# Sprint 2 — plano inicial

## Objetivo

Transformar o protótipo da Sprint 1 em um fluxo mínimo integrado e reproduzível: descobrir serviços, consultar métricas, persistir dados essenciais e apresentar estados reais no frontend.

Este documento é planejamento. Nenhum item abaixo está declarado como entregue.

A issue #48 permanece uma pendência de fechamento da Sprint 1: apresentação, feedback e Review devem ser registrados antes da tag. Somente as melhorias resultantes entram no escopo da Sprint 2.

GA01–GA09 e DW01 serão verificados novamente nesta sprint. O [plano de entregas](../plano-de-entregas.md#sprint-2--itens-transferidos-e-próximos-incrementos) define uma entrega e uma evidência esperada para cada critério obrigatório.

## Carryover da Sprint 1

| Frente | Issues principais | Resultado mínimo esperado |
|---|---|---|
| Contratos externos | #29, #30 e #31 | Formato de `/services` e `/metrics/{id}` documentado, com exemplos e erros |
| Backend NestJS | #35, #36, #37, #46 e #51 | Aplicação inicializável, módulos mínimos e tratamento dos estados |
| Banco | #32, #44 e #52 | Schemas/migrações e persistência verificada no PostgreSQL |
| Cálculo | #38 | Fórmula, fatores, unidades, período, fontes e exemplos validados antes da implementação |
| Frontend integrado | #40, #42, #45 e histórias #10/#13 | Dados vindos do backend, estados de loading/vazio/erro e totais coerentes; #43/#47 permanecem fechadas como protótipos |
| Ambiente | #49, #50 e #53 | Build/lint corrigidos e stack documentada no Docker Compose |
| Interface | #41 e melhorias resultantes da #48 | Avaliação registrada, feedback priorizado e melhorias rastreadas |

## Critérios de saída

- `npm run build` e `npm run lint` aprovados no frontend;
- backend NestJS inicializa e possui pelo menos um endpoint testável;
- `docker compose config` é válido e não contém senha literal;
- frontend consome um contrato real ou stub controlado e documentado;
- banco possui schema e migração versionados quando usado;
- dados ambientais não são exibidos como resultado real sem fórmula/fonte validada;
- tarefas concluídas possuem evidências ligadas à Definition of Done;
- Review e retrospectiva são registradas antes do encerramento.

## Organização recomendada do Project

1. Relacionar #49–#53 a #46.
2. Criar um campo/iteração “Sprint 2” ou milestone equivalente.
3. Mover apenas itens selecionados pela capacidade da equipe para Ready/In Progress.
4. Manter épicos/histórias como backlog de produto até que seus critérios funcionais sejam integrados.
5. Vincular commits e pull requests às issues.

O detalhamento de critérios, responsáveis e evidências está no [plano de entregas](../plano-de-entregas.md#sprint-2--itens-transferidos-e-próximos-incrementos).
