# Sprint 1 — relatório de entrega

## Identificação

- **Janela observável no GitHub:** 01/10/2026 a 19/10/2026.
- **Data da consolidação documental:** 19/10/2026.
- **Objetivo reconstruído a partir do backlog e das tarefas:** organizar o produto, prototipar a experiência principal e preparar a base tecnológica.
- **Código analisado:** `dev` no commit [`31e7d53`](https://github.com/404NotFound-ABP/greener/commit/31e7d538f359b30f10e1b6cec803f1533c782e0f).
- **Documentação da entrega:** consolidada na branch `main`; o código do protótipo permanece na `dev`.



## Resumo executivo

A Sprint 1 entregou organização do produto, protótipos no Figma e um primeiro incremento visual em React/TypeScript. O frontend permite demonstrar mapa, lista, filtros e estados com dados simulados. O backend, o banco e o Docker permanecem como estrutura parcial.


## Estado do Project no fechamento

Snapshot do [GitHub Project #5 — quadro](https://github.com/users/404NotFound-ABP/projects/5/views/2) em 19/10/2026, horário de Brasília:

| Estado | Quantidade |
|---|---:|
| Backlog | 36 |
| Ready | 0 |
| In Progress | 8 |
| Done | 3 |
| **Total** | **47** |

Os seis épicos aparecem em Backlog com 0% de progresso mecânico das subissues diretas; isso não significa ausência total de trabalho. Há quatro issues fechadas no repositório, mas somente três itens em Done no Project, o que expõe uma divergência em #45.

## Entregas demonstráveis

1. Backlog com seis épicos, dezoito histórias, prioridades, DOR, DOD e critérios de aceite.
2. Project público com épicos, tarefas, responsáveis e estados.
3. Figma com seções de login, mapas/menus, configurações, estados de exceção e versão mobile.
4. Frontend React/TypeScript com mapa Leaflet, três marcadores simulados, sidebar, cards, filtros e modais.
5. Scaffold e dependências iniciais de NestJS, PostgreSQL, Drizzle e Docker.

## Triagem das tarefas

### Status histórico fechado/Done, com evidência parcial

| Issue | Evidência | Ressalva registrada |
|---|---|---|
| [#39 — protótipo da lista de serviços](https://github.com/404NotFound-ABP/greener/issues/39) | Issue fechada, Project em Done, Figma e componentes de lista/cards | Carregamento e falha real não são demonstrados |
| [#43 — informações de atualização](https://github.com/404NotFound-ABP/greener/issues/43) | Issue fechada, Project em Done e textos de atualização no protótipo | Horário é fixo; intervalos e dados desatualizados não estão completos |
| [#47 — localização no protótipo](https://github.com/404NotFound-ABP/greener/issues/47) | Issue fechada, Project em Done, cards e mapa com localização | Não há evidência suficiente do cenário de localização incompleta |

Essas tarefas foram fechadas e aparecem em Done no Project, mas a evidência encontrada não satisfaz integralmente o DOD atual. O fechamento histórico comprova artefatos de **prototipação**, não a integração dos requisitos funcionais correspondentes.

### Parciais e transferidas para a Sprint 2

| Issues | Trabalho existente | Motivo para não concluir |
|---|---|---|
| [#36](https://github.com/404NotFound-ABP/greener/issues/36), [#37](https://github.com/404NotFound-ABP/greener/issues/37) | Estados indisponível/sem métricas aparecem na interface | Regras baseadas em API, timeout e testes não existem |
| [#40](https://github.com/404NotFound-ABP/greener/issues/40) | Mapa, sidebar e modais no mesmo protótipo | Navegação e adaptação mobile no código não foram comprovadas |
| [#41](https://github.com/404NotFound-ABP/greener/issues/41) | Melhorias visuais ocorreram em commits | Não há avaliação com participantes ou resultados; avaliação/melhorias vão para a Sprint 2 |
| [#48](https://github.com/404NotFound-ABP/greener/issues/48) | Existe incremento demonstrável | Apresentação, feedback e Review são pendências de fechamento da Sprint 1, não uma entrega da Sprint 2 |
| [#44](https://github.com/404NotFound-ABP/greener/issues/44), [#52](https://github.com/404NotFound-ABP/greener/issues/52) | Drizzle e PostgreSQL foram escolhidos/configurados inicialmente | Schemas, provider e conexão estão vazios; não há persistência |
| [#45](https://github.com/404NotFound-ABP/greener/issues/45) | Indicadores ilustrativos aparecem no Figma/modal | Issue fechada, Project em In Progress; faltam valor consistente de CO₂e, período e estados-limite |
| [#46](https://github.com/404NotFound-ABP/greener/issues/46) | Estrutura das camadas e configurações iniciais | React, NestJS e PostgreSQL não funcionam juntos pelo Docker |
| [#49](https://github.com/404NotFound-ABP/greener/issues/49) | Projeto React/TypeScript existe e o Vite inicia | Build TypeScript falha |
| [#50](https://github.com/404NotFound-ABP/greener/issues/50) | Dockerfile multi-stage do frontend existe | Depende do build que falha; Compose é inválido |
| [#51](https://github.com/404NotFound-ABP/greener/issues/51) | Dependências e configuração NestJS existem | `main.ts`, `app.module.ts` e módulos estão vazios; build falha |

### Backlog priorizado para a Sprint 2

- [#29](https://github.com/404NotFound-ABP/greener/issues/29): entender/documentar `/services`;
- [#30](https://github.com/404NotFound-ABP/greener/issues/30): buscar serviços;
- [#31](https://github.com/404NotFound-ABP/greener/issues/31): consultar métricas;
- [#32](https://github.com/404NotFound-ABP/greener/issues/32): persistir dados e métricas;
- [#35](https://github.com/404NotFound-ABP/greener/issues/35): acompanhar mudanças dos serviços;
- [#38](https://github.com/404NotFound-ABP/greener/issues/38): definir o cálculo ambiental;
- [#42](https://github.com/404NotFound-ABP/greener/issues/42): concluir o protótipo dos totais;
- [#53](https://github.com/404NotFound-ABP/greener/issues/53): integrar e testar o ambiente completo.

As issues #25–#28 e #33–#34 são duplicatas fora do Project e devem ser encerradas como duplicadas após confirmação da issue canônica, não carregadas como novo trabalho.

## Autoavaliação orientada pela rubrica

Esta tabela organiza evidências; não substitui a avaliação do professor.

| Critério | Situação | Justificativa verificável |
|---|---|---|
| GA01 — Product Backlog | Atendido | Backlog versionado com épicos, histórias e priorização; issues #1–#24 |
| GA02 — planejamento da sprint | Parcialmente atendido | Project e tarefas existem, mas objetivo, capacidade e seleção inicial não foram documentados no início |
| GA03 — histórias e aceite | Parcialmente atendido | Histórias principais têm aceite/DOR/DOD; #49–#53 têm somente título e hierarquia incorreta |
| GA04 — acompanhamento/rastreabilidade | Parcialmente atendido | Há Project, responsáveis e commits, porém estados divergem e commits não citam issues |
| GA05 — execução incremental | Atendido | Incrementos identificáveis em 14, 16, 17 e 19/10, preservados em commits separados |
| GA06 — review, retrospectiva e adaptação | Não atendido na evidência histórica | Não há ata/evidência de Review ou retrospectiva realizada pela equipe; #48 continua aberta |
| GA07 — Definition of Done | Parcialmente atendido | DOD existe, mas os itens fechados não comprovam todos os seus pontos |
| GA08 — documentação/reprodutibilidade | Parcialmente atendido | Documentação foi consolidada, mas builds e Compose ainda falham |
| GA09 — colaboração/participação | Não avaliável sem confirmação | Há contribuições de código, design e gestão, mas o roster completo não está versionado; parte do histórico usa a conta do projeto sem autoria individual e não há PRs/reviews |
| DW01 — React/TS e NestJS/TS | Parcialmente atendido | React/TS é usado no protótipo; NestJS é apenas scaffold não executável |
| IHC01 — usuários e tarefas | Parcialmente atendido | Histórias descrevem tarefas, mas os perfis e contextos ainda são genéricos |
| IHC02 — fluxos e protótipos | Parcialmente atendido | Figma e frontend demonstram fluxos principais; login/navegação não estão implementados |
| IHC03 — indicadores e estados | Parcialmente atendido | Estados usam texto/ícone além da cor; valores, período e CO₂e são inconsistentes/simulados |
| IHC04 — responsividade e feedback | Parcialmente atendido | Há versão mobile no Figma e alguns estados visuais; código mobile, loading e erro real não foram verificados |




## Como verificar a entrega

```bash
git clone https://github.com/404NotFound-ABP/greener.git
cd greener
git switch dev
cd frontend
npm ci
npm run dev
```

Na interface, verificar:

1. mapa e três marcadores;
2. filtros de ativo, indisponível e sem métricas;
3. cards com estado e localização;
4. modal de cada marcador;
5. alternância entre tema escuro e satélite.

Os dados são simulados e o mapa exige internet.



### Ações para a Sprint 2

| Ação | Responsável sugerido | Evidência de conclusão |
|---|---|---|
| Corrigir hierarquia/status das tarefas e encerrar duplicatas | Ariana/equipe | Project e issues reconciliados |
| Tornar frontend, backend e Compose reproduzíveis | William, Felipe e Eloah | Builds, lint e `docker compose config/up` aprovados |
| Definir contratos das APIs e fórmula ambiental antes da integração | Backend/equipe | `docs/api.md`, `docs/calculos.md` e testes |
| Registrar Review, retrospectiva e decisões durante a sprint | Equipe | Relatório versionado antes do fechamento |
| Relacionar commits/PRs às issues | Todos | Mensagens, branches e PRs com números das issues |

## Participação

O mapeamento individual e seus limites estão em [Equipe e contribuições](../academico/equipe.md). Os commits da conta do projeto `404NotFound-ABP` não foram repartidos entre pessoas sem evidência.

## Inconsistências que devem permanecer visíveis

- #45 está fechada como issue e In Progress no Project;
- #49–#53 estão relacionadas a #48, mas pertencem logicamente a #46;
- #51 possui scaffold parcial, embora esteja em Backlog;
- os épicos aparecem em 0%, apesar dos protótipos concluídos;
- não existem milestone, pull request, release ou tag da Sprint 1.
