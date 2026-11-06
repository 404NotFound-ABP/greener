# Sprint 1 — relatório de entrega

O corpo deste relatório retrata o corte de **19/10/2026**. Os estados de issues, branches e componentes descritos a seguir correspondem àquele momento. A [devolutiva do cliente](#devolutiva-do-cliente), acrescentada em 06/11, compara os pedidos recebidos com a versão preparada para a Sprint 2.

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




## Validação técnica

No corte de 19/10, o frontend iniciava em desenvolvimento. Os builds do frontend e do backend, o lint do frontend e a validação do Compose falharam. Os comandos, erros e resultados daquele dia estão no [registro histórico de validação técnica](https://github.com/404NotFound-ABP/greener/blob/79f582ec9658d13affcfde0065e854eb48abb815/docs/sprints/sprint-1.md#validação-técnica).

## Como verificar a entrega

Para reproduzir o protótipo de 19/10, selecionar o commit avaliado. Para executar a versão atual, seguir o [guia do projeto](../../README.md).

```bash
git clone https://github.com/404NotFound-ABP/greener.git
cd greener
git switch --detach 31e7d538f359b30f10e1b6cec803f1533c782e0f
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

## Sprint Review

Em 19/10, a equipe havia registrado o incremento demonstrável e a pendência de documentar a apresentação, o feedback e as decisões. O texto recebido do cliente foi incorporado no adendo de 06/11. [Registro histórico da Sprint Review](https://github.com/404NotFound-ABP/greener/blob/79f582ec9658d13affcfde0065e854eb48abb815/docs/sprints/sprint-1.md#sprint-review) · [Devolutiva do cliente](#devolutiva-do-cliente)

O registro histórico da retrospectiva reúne observações sobre o repositório. A comprovação da retrospectiva da equipe exige data, participantes e ações acordadas. [Retrospectiva documental de 19/10](https://github.com/404NotFound-ABP/greener/blob/79f582ec9658d13affcfde0065e854eb48abb815/docs/sprints/sprint-1.md#retrospectiva-documental)

## Ações para a Sprint 2

As sugestões e os responsáveis abaixo foram registrados no corte de 19/10.

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

## Devolutiva do cliente

Adendo de **06/11/2026**, a partir da [devolutiva original fornecida pela PO](../evidencias/sprint-1/devolutiva-do-cliente.md). O cliente avaliou o protótipo e também examinou código incorporado após 19/10. A coluna da direita registra a verificação posterior da [`main` no commit `1e075b9`](https://github.com/404NotFound-ABP/greener/commit/1e075b9d2d0a0e2b8dbe396c6121a56057cbc4e1).

| Frente | O que o cliente reconheceu e pediu | Situação verificada em 06/11 |
|---|---|---|
| Design | Reconheceu o escopo do Figma e os estados com texto e ícones. Pediu vincular o design ao código por meio de estilos e capturas desktop/mobile. | A documentação identifica os tokens e inclui [capturas reais em desktop e celular](../interface.md#capturas-do-dashboard). Em 360 × 800 px, a barra lateral cortou controles e o seletor de tema cobriu o rodapé. Faltam o comparativo com o frame do Figma e os resultados da avaliação com usuários. |
| Qualidade de código | Destacou os módulos, as migrações, a coleta e a fórmula ambiental. Apontou falhas de build, lacunas de testes e Compose incompleto. | Os dois builds e o lint do frontend passaram. Os três serviços subiram pelo Compose. Em banco novo, o dashboard da API respondeu 500 até aplicar as migrações. Continuam pendentes a suíte de testes versionada, o lint do backend e a integração contínua. [Migrações e persistência](https://github.com/404NotFound-ABP/greener/issues/155) |
| Processo | Pediu integrar a entrega em uma branch estável e usar PRs com revisão, CI e tag para identificar a versão avaliada. | O PR #58 integrou a `dev` à `main` em 05/11. O GitHub registrava zero revisões submetidas nesse PR e nenhuma tag da sprint. [PR de integração](https://github.com/404NotFound-ABP/greener/pull/58) |
| Documentação | Valorizou o backlog, o plano e os critérios de aceite. Pediu datar o estado descrito, corrigir o link de evidências e distinguir código entregue de planejamento. | O corte de 19/10 e seu snapshot podem ser consultados pela versão histórica. A Sprint 2 possui acompanhamento próprio. [Snapshot de evidências](https://github.com/404NotFound-ABP/greener/blob/d69dcf2347bb5962b3ef662b215bdae92de94d16/docs/evidencias/sprint-1/README.md) · [Relatório da Sprint 2](sprint-2.md) |
| Produto | Pediu rodar uma coleta real, conferir o valor no banco e mostrá-lo no dashboard. | Após a migração manual, o teste registrou 14 medições de 7 serviços e confirmou que uma leitura permaneceu no PostgreSQL após o reinício. O frontend ainda apresenta exemplos fixos. [Integração da lista](https://github.com/404NotFound-ABP/greener/issues/91) |

Em 06/11, a issue da apresentação e as tarefas de registro e priorização da devolutiva estavam fechadas. O material fornecido documenta os pedidos do cliente. A data efetiva da reunião, os participantes e as decisões acordadas precisam de confirmação da equipe para compor uma ata. A tarefa de retrospectiva seguia aberta. [Apresentação](https://github.com/404NotFound-ABP/greener/issues/48) · [Feedback recebido](https://github.com/404NotFound-ABP/greener/issues/157) · [Priorização](https://github.com/404NotFound-ABP/greener/issues/158) · [Retrospectiva](https://github.com/404NotFound-ABP/greener/issues/159)
