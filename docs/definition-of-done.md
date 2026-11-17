# Definition of Done

Esta definição orienta o encerramento das tarefas a partir da consolidação da Sprint 1. Ela não altera retroativamente o histórico do Project.

## Para qualquer tarefa

Uma tarefa só pode ser marcada como concluída quando:

- seu resultado corresponde ao título e ao escopo descritos na issue;
- os critérios de aceite e o DOD da issue foram verificados;
- a evidência está ligada à issue: commit, pull request, documento, Figma ou teste;
- limitações conhecidas estão registradas;
- documentação afetada foi atualizada;
- o estado da issue e o estado no Project são coerentes.

## Para protótipos de interface

- telas/estados previstos estão identificáveis no Figma ou no artefato entregue;
- textos, unidades, ícones e cores são compreensíveis;
- estados ausente, indisponível e erro não dependem apenas de cor;
- desktop/mobile e exceções exigidos pela issue possuem evidência;
- a tarefa é chamada de “protótipo”, sem alegar integração.

## Para código

- código está na branch de integração acordada;
- build e lint passam, salvo exceção aceita e documentada;
- comportamento é verificável por teste ou roteiro reproduzível;
- não existem segredos versionados;
- erros relevantes e dados ausentes são tratados;
- mocks são identificados e não apresentados como dados reais.

## Para integração/Docker

- serviços necessários constam no Compose;
- configuração é validada por `docker compose config`;
- a stack inicia a partir de instruções versionadas;
- healthchecks e dependências essenciais são verificáveis;
- credenciais são recebidas por ambiente e há exemplo sem segredo real.

## Para documentação

- descreve o estado atual, não apenas o estado desejado;
- contém pré-requisitos, comandos e resultado esperado;
- diferencia implementado, prototipado, scaffold e planejado;
- possui links estáveis para a evidência;
- foi revisada junto da versão que será marcada pela tag.

## Aplicação na Sprint 1

| Item | Resultado da checagem |
|---|---|
| #39 | Fechada/Done no histórico; a evidência de protótipo é parcial e não satisfaz integralmente o DOD atual porque loading/falha não estão completos |
| #43 | Fechada/Done no histórico; a evidência de protótipo é parcial e não satisfaz integralmente o DOD atual porque intervalos e atualização real não existem |
| #47 | Fechada/Done no histórico; a evidência de protótipo é parcial e não satisfaz integralmente o DOD atual porque localização incompleta não está comprovada |
| #45 | Não satisfaz integralmente o DOD; classificado como parcial/carryover |
| #49–#53 | Não concluídos; builds, backend, banco e integração ainda falham ou estão vazios |
