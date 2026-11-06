# Sprint 2 — preparação da entrega de 10/11/2026

**Situação em 06/11/2026: em andamento.** Na [`main` avaliada (`1e075b9`)](https://github.com/404NotFound-ABP/greener/commit/1e075b9d2d0a0e2b8dbe396c6121a56057cbc4e1), o backend já descobre serviços, coleta métricas, calcula energia e emissão e grava no PostgreSQL. O dashboard React ainda exibe dados fixos. Para o aceite, falta demonstrar a mesma coleta desde a API da UniLaunch até a tela.

## Escopo e data

A PO informou **10/11/2026** para a entrega. O [enunciado](../Desafio%203DSM%20-%202026-2.pdf) prevê a review nesse dia. A [issue #48](https://github.com/404NotFound-ABP/greener/issues/48) menciona 20/11 como encerramento. A equipe deve esclarecer se há dois marcos e alinhar o Project com o prazo da apresentação.

O [plano original](https://github.com/404NotFound-ABP/greener/blob/1e075b9/docs/sprints/sprint-2.md) admitia um contrato real ou um substituto controlado e documentado no frontend. Hoje já existe uma API consultável pelo React. Histórico por período, ranking, comparação e configuração protegida continuam no [horizonte da Sprint 3](sprint-3.md).

## Evidências da versão avaliada

| Verificação | Resultado observado em 06/11 |
|---|---|
| Compilação | Com Node 24.20.0, `npm run build` passou no backend e no frontend. `npm run lint` passou no frontend. O backend ainda carece de scripts de teste e lint. |
| Instalação com banco vazio | `docker compose config` passou. Ao subir os três serviços sem aplicar as migrações, o site e o Swagger responderam HTTP 200, mas `GET /api/servidores/dashboard` retornou 500. O banco estava saudável e sem tabelas. O [guia de instalação](../../README.md) descreve a etapa manual de migração. |
| Validação do novo roteiro de instalação | Repetindo a instalação em outro volume vazio, o comando de migração do README criou as quatro tabelas antes da partida da API. Site, Swagger e endpoint do dashboard responderam HTTP 200 e o coletor gravou oito medições. O procedimento manual permite reproduzir a demonstração da API. |
| Coleta real e persistência | Após aplicar as migrações, a API retornou 7 serviços e o banco gravou 14 medições na janela observada. Uma leitura de 32 s da `billing-api` resultou em **0,0006058 kWh** e **0,0515 gCO₂e**. A medição continuou no banco após reiniciar o PostgreSQL. Quantidade de serviços e leituras varia a cada execução. |
| Falhas e retorno | Com respostas controladas dos provedores, a remoção e o retorno de um serviço preservaram o histórico. Uma falha de métricas gravou `NULL`, mas a consulta usada pelo dashboard apresentou zero. Uma falha na descoberta gerou resposta de “sucesso” na coleta manual, com erro em `detalhes`. |
| Dashboard no navegador | Com o backend desligado apareceram 3 marcadores, 2 cards de 100 kWh e horário fixo de 12:00. A busca manteve os dois cards para um termo inexistente. O filtro “Sem métricas” deixou a lista vazia e manteve um marcador no mapa. |
| Interface e acesso | As [capturas de desktop e celular](../interface.md#capturas-do-dashboard) mostram que, em 360 × 800, a barra lateral corta controles e o seletor de tema cobre o rodapé. Credenciais fictícias abriram o mapa e o painel administrativo no navegador. O backend tem autenticação JWT própria. |

Esses resultados vêm de testes técnicos com banco descartável e navegador. O aceite do cliente, a review e a retrospectiva da Sprint 2 serão registrados quando ocorrerem.

## Prioridades para o aceite

| Ordem | Entrega pendente | Critério observável | Acompanhamento |
|---|---|---|---|
| 1 | Inicialização do ambiente | A partir de um clone e volume novos, outra pessoa segue o README, obtém uma medição e a reencontra após reiniciar o banco. Incorporar a migração à inicialização da stack. | [Configuração das camadas](https://github.com/404NotFound-ABP/greener/issues/154) · [Migrações e persistência](https://github.com/404NotFound-ABP/greener/issues/155) |
| 2 | Dados reais no dashboard | Lista, detalhe e totais usam o mesmo serviço e período da API. A tela atualiza sem recarga, informa a última atualização e distingue carregamento, vazio e falha. Se o mapa for demonstrado, seus filtros acompanham a lista. | [Lista integrada](https://github.com/404NotFound-ABP/greener/issues/91) · [Estados da lista](https://github.com/404NotFound-ABP/greener/issues/94) · [Totais](https://github.com/404NotFound-ABP/greener/issues/126) · [Atualização periódica](https://github.com/404NotFound-ABP/greener/issues/111) |
| 3 | Resultados ambientais e estados confiáveis | Distinguir zero medido, métrica ausente e serviço indisponível. Exibir o período real, indicar total parcial e sinalizar falha de coleta. Comparar respostas com um exemplo conhecido. | [Estados](https://github.com/404NotFound-ABP/greener/issues/119) · [Intervalo real](https://github.com/404NotFound-ABP/greener/issues/121) · [Dados insuficientes](https://github.com/404NotFound-ABP/greener/issues/122) · [Totais parciais](https://github.com/404NotFound-ABP/greener/issues/124) |
| 4 | Evidências de interface e fechamento | Comparar as telas corrigidas com as capturas de 06/11 e vincular avaliação, ajustes e contribuição individual às issues. Na review, registrar data, participantes, retorno e decisões. Na retrospectiva, registrar ações, responsáveis e prazos. | [Usabilidade](https://github.com/404NotFound-ABP/greener/issues/41) · [Ajuste mobile](https://github.com/404NotFound-ABP/greener/issues/146) · [Retrospectiva](https://github.com/404NotFound-ABP/greener/issues/159) |

## Roteiro de demonstração

1. Seguir o [guia da raiz](../../README.md) em um ambiente de teste. Conferir a resposta de `GET /api/coleta/status` e abrir `GET /api/servidores/dashboard` pelo Swagger.
2. Escolher um serviço **retornado nessa execução**. Anotar ID, instante da coleta, intervalo, energia e emissão. Conferir o mesmo registro no PostgreSQL e comparar o resultado com a [fórmula](../calculos.md).
3. Após integrar o frontend, localizar na tela o mesmo ID e horário. Aguardar outra coleta e verificar a atualização dos indicadores. Exercitar uma leitura ausente e uma falha, inclusive em celular. Até essa integração, apresentar separadamente a API com dados reais e o protótipo visual.
4. Na versão candidata, registrar o commit, a evidência por critério e as pendências aceitas pela PO. O [plano de entregas](../plano-de-entregas.md) relaciona os critérios acadêmicos às frentes de trabalho.

A [devolutiva da Sprint 1](sprint-1.md#devolutiva-do-cliente) orientou esse recorte. No [Project](https://github.com/users/404NotFound-ABP/projects/5/views/2), falta identificar os itens da Sprint 2 por iteração ou marco antes de usar os números do quadro para medir o avanço da entrega.
