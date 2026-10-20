# Plano de entregas — GreenER

## Controle do documento

- **Base técnica analisada:** branch `dev`, commit [`31e7d53`](https://github.com/404NotFound-ABP/greener/commit/31e7d538f359b30f10e1b6cec803f1533c782e0f).
- **Consolidação documental:** 19/10/2026.
- **Fonte de acompanhamento:** [GitHub Project #5 — quadro](https://github.com/users/404NotFound-ABP/projects/5/views/2).
- **Observação:** este plano foi consolidado no fechamento da Sprint 1. Ele registra o estado encontrado, mas não substitui evidência histórica de um planejamento feito no início da sprint.

## Legenda

| Situação | Significado |
|---|---|
| Concluída | Entrega e evidência compatíveis com o recorte declarado |
| Parcial | Existe artefato ou implementação, mas a Definition of Done não foi integralmente satisfeita |
| Transferida | Não concluída na Sprint 1 e priorizada para a Sprint 2 |
| Prevista | Planejada para uma sprint futura, sem alegação de implementação |

## Visão das três sprints

| Sprint | Objetivo | Resultado esperado |
|---|---|---|
| Sprint 1 | Estruturar o produto e tornar os principais fluxos visíveis | Backlog rastreável, protótipo no Figma, primeiro incremento frontend e scaffold técnico |
| Sprint 2 | Transformar o protótipo em um fluxo integrado mínimo | API de serviços/métricas, persistência inicial, cálculo documentado, frontend integrado e ambiente reproduzível |
| Sprint 3 | Completar o produto e elevar qualidade/validação | Histórico, comparação, autenticação/configuração, testes, usabilidade e documentação final |

## Sprint 1 — resultado consolidado

**Objetivo:** organizar o problema e o trabalho, prototipar a experiência principal e iniciar a estrutura React/NestJS/PostgreSQL.

| Critério | Requisito relacionado | Entrega concreta | Como verificar | Responsáveis | Evidência no GitHub | Situação |
|---|---|---|---|---|---|---|
| GA01 | RF01–RF16 | Backlog com épicos, histórias e prioridades | Ler backlog e issues #1–#24 | Conta do projeto/equipe | [Backlog](academico/backlog.md), [issues](https://github.com/404NotFound-ABP/greener/issues) | Atendido |
| GA02 | Escopo da Sprint 1 | Project com tarefas, responsáveis e estados | Comparar Project, plano e relatório | `arianaferresan`/equipe | [Project #5](https://github.com/users/404NotFound-ABP/projects/5/views/2) | Parcialmente atendido: objetivo/capacidade não foram registrados no início |
| GA03 | RF01–RF16 | Histórias com DOR, DOD e critérios de aceite | Conferir backlog, #1–#24 e #49–#53 | Equipe | [Backlog](academico/backlog.md) | Parcialmente atendido: #49–#53 têm apenas título/hierarquia incorreta |
| GA04 | Rastreabilidade | Issues, responsáveis, estados e commits | Comparar Project, issues e histórico | Equipe | [Project #5](https://github.com/users/404NotFound-ABP/projects/5/views/2), [commits](https://github.com/404NotFound-ABP/greener/commits/dev/) | Parcialmente atendido: estados divergem e commits não citam issues |
| GA05 | Execução incremental | Scaffold e três incrementos frontend em datas distintas | Inspecionar commits de 14, 16, 17 e 19/10 | William e Eloah | [`4b55032`](https://github.com/404NotFound-ABP/greener/commit/4b55032223ce13f438c603f19936d4f5fa2ff1b1), [`00d200c`](https://github.com/404NotFound-ABP/greener/commit/00d200c1faea3c8835c4e26a98064f48be34256a), [`44b94bb`](https://github.com/404NotFound-ABP/greener/commit/44b94bb06e8114dee01a86357c48db715e59b336), [`31e7d53`](https://github.com/404NotFound-ABP/greener/commit/31e7d538f359b30f10e1b6cec803f1533c782e0f) | Atendido |
| GA06 | Review e retrospectiva | Incremento disponível para demonstração | Procurar participantes, feedback, decisões e ações | Equipe | [#48](https://github.com/404NotFound-ABP/greener/issues/48), [relatório](sprints/sprint-1.md#sprint-review) | Não atendido na evidência histórica; #48 é pendência de fechamento |
| GA07 | Definition of Done | DOD por história/tarefa e definição global | Comparar itens fechados com seus checklists | Equipe | [Definition of Done](definition-of-done.md) | Parcialmente atendido: o estado histórico não corresponde integralmente às evidências |
| GA08 | Documentação e reprodução | READMEs e registro técnico atualizados | Executar os comandos do relatório | Equipe | [Relatório](sprints/sprint-1.md#validação-técnica) | Parcialmente atendido: documentação consolidada; builds/Compose falham |
| GA09 | Colaboração | Contribuições de código, design e gestão mapeadas | Confirmar roster e evidência por integrante | Equipe | [Equipe](academico/equipe.md) | Não avaliável sem confirmar todos os integrantes e suas contribuições |
| DW01 | RP01 | Protótipo React + TypeScript e scaffold NestJS | Executar frontend e inspecionar backend | Eloah e William | Commits [`00d200c`](https://github.com/404NotFound-ABP/greener/commit/00d200c1faea3c8835c4e26a98064f48be34256a) a [`31e7d53`](https://github.com/404NotFound-ABP/greener/commit/31e7d538f359b30f10e1b6cec803f1533c782e0f), [`4b55032`](https://github.com/404NotFound-ABP/greener/commit/4b55032223ce13f438c603f19936d4f5fa2ff1b1) | Parcialmente atendido: React efetivo; NestJS não funcional |
| IHC01 | RF09, RF16 | Usuários/tarefas descritos no backlog | Ler histórias e perfis em `interface.md` | Equipe | [Interface](interface.md#perfis-e-tarefas) | Parcialmente atendido: perfis/contextos ainda genéricos |
| IHC02 | RF09, RF11, RF12 | Figma e incremento visual React | Abrir Figma e executar frontend | `PedroSmp` e Eloah | [Figma](https://www.figma.com/design/zPrdeRlYtzyWwmbuTiwQqE/GeenER?node-id=0-1), [#39](https://github.com/404NotFound-ABP/greener/issues/39) | Parcialmente atendido: login/navegação não funcionais |
| IHC03 | RF05, RF06, RF09 | Estados com texto/ícone e indicadores visuais | Inspecionar cards/modais e dicionário de indicadores | `PedroSmp` e Eloah | [#45](https://github.com/404NotFound-ABP/greener/issues/45), [Interface](interface.md#indicadores) | Parcialmente atendido: valores, períodos e CO₂e são simulados/incompletos |
| IHC04 | RNF01, RP09 | Seção mobile no Figma e feedback de estados | Comparar Figma e código responsivo | `PedroSmp`/equipe | [#40](https://github.com/404NotFound-ABP/greener/issues/40), [#41](https://github.com/404NotFound-ABP/greener/issues/41) | Parcialmente atendido: código mobile/loading/erro não verificados |
| DW04, DW07 (antecipação) | RP02, RP03, RP05, RNF06 | Configuração inicial de Drizzle, PostgreSQL e Docker | Executar validações do relatório | William, Felipe e Eloah | [`4b55032`](https://github.com/404NotFound-ABP/greener/commit/4b55032223ce13f438c603f19936d4f5fa2ff1b1), [#46](https://github.com/404NotFound-ABP/greener/issues/46) | Preparação registrada; critérios não reivindicados na Sprint 1 |

## Sprint 2 — itens transferidos e próximos incrementos

**Objetivo:** obter um caminho mínimo executável, do serviço monitorado à exibição no frontend, sem afirmar escopo além do que for integrado e testado.

| Critério | Requisito relacionado | Entrega concreta | Como verificar | Responsáveis previstos | Issues | Situação |
|---|---|---|---|---|---|---|
| GA01 | Backlog | Repriorizar backlog e registrar o escopo atualizado | Comparar backlog antes/depois e Project | Product Owner/equipe | Issues/Project da Sprint 2 | Prevista |
| GA02 | Planejamento | Registrar objetivo, capacidade, seleção e responsáveis antes da execução | Documento de planning versionado | Equipe | `docs/sprints/sprint-2.md` e Project | Prevista |
| GA03 | Histórias selecionadas | Refinar DOR, DOD, aceite e estimativas das histórias da sprint | Revisão das issues antes de In Progress | Responsáveis das histórias | Issues da Sprint 2 | Prevista |
| GA04 | Rastreabilidade | Relacionar issue, branch, commit, PR, teste e resultado | Matriz e links no Project | Todos | Project/PRs | Prevista |
| GA05 | Incrementos | Entregar mudanças pequenas e verificáveis ao longo da sprint | Histórico de commits/PRs | Todos | Branches e PRs | Prevista |
| GA06 | Review/retrospectiva | Demonstrar incremento, registrar feedback, decisões e ações | Ata com participantes e links | Equipe | Relatório da Sprint 2 | Prevista |
| GA07 | Definition of Done | Aplicar a DoD antes de mover itens para Done | Checklist por item concluído | Responsáveis/revisores | Issues e [DoD](definition-of-done.md) | Prevista |
| GA08 | Documentação | Atualizar execução, API, cálculo e arquitetura junto do código | Reproduzir comandos em ambiente limpo | Equipe | READMEs/docs | Prevista |
| GA09 | Participação | Confirmar roster, tarefas assumidas e contribuição verificável de cada integrante | Matriz integrante → tarefa → evidência | Todos | Commits, PRs, issues e Project | Prevista |
| DW01 | RP01/RP02 | Usar React/TS e NestJS/TS em um fluxo mínimo executável | Build e demonstração integrada | Frontend/backend | #46, #49 e #51 | Prevista |
| DW02, DW03 | RF01, RF03, RF04 | Documentar contratos e consumir `/services` e `/metrics/{id}` no NestJS | Testes de contrato e chamadas reproduzíveis | William/Felipe | [#29](https://github.com/404NotFound-ABP/greener/issues/29), [#30](https://github.com/404NotFound-ABP/greener/issues/30), [#31](https://github.com/404NotFound-ABP/greener/issues/31) | Transferida |
| DW04 | RF03, RF04, RF10 | Modelar e persistir serviço, coleta, estado e métricas com Drizzle/PostgreSQL | Migração versionada, teste de persistência e reinício | Felipe | [#32](https://github.com/404NotFound-ABP/greener/issues/32), [#44](https://github.com/404NotFound-ABP/greener/issues/44) | Transferida |
| DW04, DW07 | RP03, RP05 | Conectar PostgreSQL ao backend com configuração por ambiente | Healthcheck, conexão e reinício verificados | Felipe/William | [#52](https://github.com/404NotFound-ABP/greener/issues/52) | Transferida; dependência compartilhada |
| TP02, TP05 | RF02, RF05, RF06 | Definir inclusão/remoção/retorno e regras de indisponível/sem métricas | Casos de teste e tratamento de erros | Backend + frontend | [#35](https://github.com/404NotFound-ABP/greener/issues/35), [#36](https://github.com/404NotFound-ABP/greener/issues/36), [#37](https://github.com/404NotFound-ABP/greener/issues/37) | Transferida |
| DW05 | RF08, RF09, RF11, RF12 | Integrar o frontend às respostas reais e remover os mocks do fluxo entregue | Demonstração ponta a ponta e estados de carregamento/erro | Eloah + backend | [#40](https://github.com/404NotFound-ABP/greener/issues/40), [#42](https://github.com/404NotFound-ABP/greener/issues/42), [#45](https://github.com/404NotFound-ABP/greener/issues/45) e histórias [#10](https://github.com/404NotFound-ABP/greener/issues/10)/[#13](https://github.com/404NotFound-ABP/greener/issues/13) | Transferida/parcial; #43 e #47 permanecem concluídas como protótipo |
| DW07 | RP01–RP05, RNF06 | Corrigir builds, incluir backend no Compose, substituir o placeholder inválido por variável de ambiente e documentar execução | `build`, `lint` e `docker compose config/up` aprovados | William, Felipe e Eloah | [#46](https://github.com/404NotFound-ABP/greener/issues/46), [#49](https://github.com/404NotFound-ABP/greener/issues/49), [#50](https://github.com/404NotFound-ABP/greener/issues/50), [#51](https://github.com/404NotFound-ABP/greener/issues/51), [#53](https://github.com/404NotFound-ABP/greener/issues/53) | Transferida |
| IHC05, IHC06 | RNF01, RP09 | Avaliar o protótipo e aplicar as melhorias resultantes da Review | Roteiro, participantes, resultados e antes/depois | Pedro/equipe | [#41](https://github.com/404NotFound-ABP/greener/issues/41) | Transferida; #48 deve ser fechada ainda como registro da Sprint 1 |
| Escopo do produto | RF07 | Definir fórmula, fatores, unidades, período e tratamento de ausências antes de exibir resultados | Documento com referências e exemplos conferidos | Backend | [#38](https://github.com/404NotFound-ABP/greener/issues/38) | Transferida |

## Sprint 3 — previsão

**Objetivo:** completar os fluxos de análise e configuração e validar a qualidade do produto integrado.

| Critério | Requisito relacionado | Entrega concreta | Como verificar | Responsáveis | Evidência esperada | Situação |
|---|---|---|---|---|---|---|
| GA01 | Backlog | Revisar prioridades e saldo do produto | Backlog/Project atualizados | Product Owner/equipe | Issues e Project | Prevista |
| GA02 | Planejamento | Registrar objetivo, capacidade, escopo e responsáveis | Planning versionada antes da execução | Equipe | Relatório/Project | Prevista |
| GA03 | Histórias selecionadas | Garantir aceite, DOR, DOD e estimativas testáveis | Revisão das issues selecionadas | Responsáveis | Issues | Prevista |
| GA04 | Rastreabilidade | Manter requisito → issue → PR → teste → release | Auditoria de links | Todos | Project/PRs/tag | Prevista |
| GA05 | Incrementos | Integrar incrementos verificáveis durante a sprint | Histórico e demonstrações intermediárias | Todos | Commits/PRs | Prevista |
| GA06 | Review/retrospectiva | Registrar feedback, decisões e melhoria de processo | Ata e ações com responsáveis | Equipe | Relatório da Sprint 3 | Prevista |
| GA07 | Definition of Done | Aplicar DoD e revisão antes de Done | Checklists e aprovações | Responsáveis/revisores | Issues/PRs | Prevista |
| GA08 | Documentação | Entregar documentação final reproduzível | Verificação limpa da release | Equipe | READMEs/docs/tag | Prevista |
| GA09 | Participação | Demonstrar contribuição relevante de todos os integrantes | Matriz final por integrante | Todos | Commits, PRs, reviews e issues | Prevista |
| DW01 | RP01/RP02 | Manter frontend React/TS e backend NestJS/TS efetivamente integrados | Build, testes e demonstração | Frontend/backend | Release integrada | Prevista |
| DW04, DW05 | RF10, RF14, RF15 | Histórico por período, ranking e comparação | Testes com períodos, lacunas e reinício | A definir na planning | Issues #16–#19 e PRs | Prevista |
| DW06 | RF16 | Login, JWT e alteração protegida dos intervalos | Testes de credenciais, token e autorização | A definir na planning | Issues #21–#22 e PRs | Prevista |
| TP01–TP05 | RNF02–RNF06 | Refatoração, tipagem, validação, tratamento de erros e testes | Pipeline e cobertura acordada pela equipe | Equipe | CI, testes e reviews | Prevista |
| IHC04–IHC06 | RNF01, RP09 | Responsividade, feedback, avaliação e refinamento final | Evidências desktop/mobile e relatório de usabilidade | Equipe | Figma, testes e relatório | Prevista |
| GA01–GA09 | Processo | Release final rastreável e documentação atualizada | Review, retrospectiva, tag e links finais | Equipe | Project, PRs e tag | Prevista |

## Participação na Sprint 1

| Integrante | Tarefas assumidas | Contribuições realizadas | Evidências |
|---|---|---|---|
| `eloahsousaa` | #49 e #50 | Protótipo frontend e Dockerfile do frontend | Três commits em `dev` |
| `WilliamM4x` | #29–#32, #46 e #51 | Scaffold técnico inicial | Commit `4b55032` |
| `PedroSmp` | #39–#43, #45 e #47 | Arquivo Figma e protótipos vinculados às issues | Figma, comentários nas issues #39/#43/#47 e issues fechadas |
| `arianaferresan` | Organização das subtarefas | Criação de #49–#53 e movimentações no Project | Histórico das issues/Project |
| `felipefmac` | Backend, banco e integração | Planejamento e movimentação de #46/#52; entrega técnica não evidenciada | Issues/Project |
| `luiza-manchini` | Backlog/documentação | Backlog, estrutura documental e issues iniciais | Commits da conta do projeto; autoria individual não identificada |

## Ajustes de rastreabilidade necessários

1. Relacionar #49–#53 como subtarefas de #46, não de #48.
2. Reclassificar #45 como parcial/carryover até satisfazer seu DOD.
3. Mover #51 para em andamento, pois há scaffold parcial, sem marcá-la concluída.
4. Preservar o status histórico fechado/Done de #39, #43 e #47, registrar que o DOD não foi integralmente evidenciado e criar novas tarefas para a integração.
5. Fechar #25–#28 e #33–#34 como duplicadas após confirmar a issue canônica.
6. Criar a tag `sprint-1` somente depois de incorporar e validar a documentação na versão que será avaliada.
