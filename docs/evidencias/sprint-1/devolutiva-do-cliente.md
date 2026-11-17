# 404NotFound - Sprint 1

## 1. Design

Gostei bastante do escopo do Figma de vocês: login, mapas/menus, configurações, estados de exceção e uma seção específica para mobile. Também é positivo o protótipo em React da branch dev já ter mapa com Leaflet, marcadores, sidebar, cards, filtros e modais, e a documentação mostrar preocupação em comunicar estado com texto e ícone, não só com cor.

O que não consegui verificar foi a ligação entre o design e o código. Não encontrei no repositório um guia de estilo com cores, tipografia, espaçamentos e estados dos componentes, nem capturas versionadas das telas em desktop e mobile. O próprio docs/interface.md registra que a sidebar tem largura fixa, que não há breakpoints específicos e que a responsividade não foi comprovada. Fiquei com a dúvida se o Figma foi usado como fonte de verdade durante a implementação ou se ficou mais como uma peça de apresentação. Se existir um guia visual, vale versioná-lo junto dos tokens e de capturas; se ainda não existir, vale criar antes de ampliar as telas.

## 2. Qualidade de Código

O backend que está na main surpreendeu positivamente: a organização em módulos está clara, o Drizzle aparece com migrations versionadas, o coletor tem controle para não sobrepor ciclos, a classificação de disponivel/indisponivel/removido está implementada e a fórmula de energia e CO₂e segue exatamente as constantes do desafio (100 W de CPU, 0,375 W/GB de RAM, 0,01 W/GB de disco e 0,02 W/GB de rede). O Swagger e os endpoints de dashboard, ranking, histórico e impacto discriminado também mostram que vocês foram além do scaffold.

O problema é que a versão entregue não compila. Executando npm run build no backend, aparecem quatro erros de TypeScript em backend/src/module/impact/impact.service.ts (linhas 361–364): o código acessa CalculadoraImpacto.CPU_MAX_WATTS, RAM_WATTS_PER_GB, DISK_WATTS_PER_GB e NETWORK_WATTS_PER_GB, mas essas constantes são private. O frontend React está apenas na branch dev, e lá o npm run build também falha: App.tsx importa React sem usar e DashboardPage.tsx passa props incompletas para a Sidebar. Na main, o frontend é só README e arquivos vazios em frontend/public.

Também não há testes, lint nem CI no projeto. O package.json do backend não tem scripts de test ou lint, e não existe configuração de ESLint. Há arquivos vazios que parecem ter ficado de uma estrutura planejada, como auth.controller.ts, auth.service.ts, auth.module.ts, database.service.ts e impact.interface.ts. O docker-compose.yml não valida por causa de POSTGRES_PASSWORD: [PASSWORD] e, além disso, só declara o PostgreSQL: backend e frontend não estão no Compose. Mesmo com o backend atual tendo bastante coisa, hoje não existe um caminho reproduzível para subir e demonstrar a entrega.

## 3. Processos

Vocês não abriram nenhum pull request no período. O histórico mostra commits diretos na main e na dev, e o próprio relatório da sprint reconhece que não houve review nem retrospectiva registrados. Isso é honesto, mas significa que o processo de colaboração não foi exercitado: não há um momento em que outra pessoa lê a mudança antes de ela entrar, nem um histórico de discussão que ajude a entender decisões e regressões.

A divisão entre branches também dificulta a avaliação. A documentação e o backend ficaram na main, o protótipo React ficou na dev, e o README orienta a pessoa a trocar para a dev para ver o frontend. Ou seja, nenhuma branch sozinha contém a entrega completa. O ideal é seguir o fluxo que vocês já conhecem: feature/* saindo da develop, PRs pequenos com review e CI, integração na develop e só então a versão estável na main, identificada por uma tag sprint-1. A referência do [Atlassian sobre Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) e a documentação do GitHub sobre [revisão de pull requests](https://docs.github.com/en/pull-requests/get-started/reviewing-pull-requests-quickstart) ajudam a estruturar isso.

## 4. Documentação

A documentação é, de longe, o ponto mais forte de vocês. O índice em docs/README.md, o relatório da sprint, o plano de entregas, o backlog com DOR/DOD/aceite, a interface, a arquitetura, os cálculos e a Definition of Done formam um conjunto maduro. Mais do que isso: vocês foram honestos ao registrar que o build falhava, que o Compose era inválido, que o backend era scaffold e que review/retrospectiva não tinham acontecido. Isso é raro e mostra maturidade para diagnosticar o próprio trabalho.

Só que a documentação ficou desatualizada em relação ao código. A main recebeu commits de backend até 25/10, mas o relatório ainda descreve o estado de 19/10 e diz que os módulos estão vazios. O README principal continua dizendo que o projeto está em “fase de planejamento, organização inicial e protótipos”, embora o backend já tenha um fluxo implementado. Há também um link quebrado em docs/README.md para docs/evidencias/sprint-1/README.md, diretório que foi removido. Documentação não substitui software funcionando, mas a de vocês é boa o suficiente para merecer uma atualização: registrem o que já está implementado, o que ainda não está e qual é a versão exata avaliada.

## 5. Produto

No recorte da Sprint 1, o produto era essencialmente um protótipo: mapa, filtros, estados e modais com dados simulados, enquanto backend, banco e Docker eram estrutura inicial. Hoje a main já tem um fluxo de backend bem mais completo do que o relatório descreve: descoberta de serviços, coleta de métricas, consulta de carbono, cálculo de potência/energia/emissão, persistência e endpoints de consulta. A fórmula está correta e o tratamento de serviço removido e indisponível está pensado.

O que falta é fechar a ponta. O frontend não roda na main, o build do backend falha e o Compose não sobe a aplicação inteira, então ainda não existe um caminho ponta a ponta que uma pessoa consiga executar. Minha recomendação é priorizar exatamente isso: corrigir o build dos dois lados, incluir backend e frontend no Compose, rodar uma coleta real, conferir o valor calculado no banco e exibir esse valor no dashboard. Quando esse caminho funcionar, a base que vocês construíram vai aparecer de verdade. O trabalho de documentação e a honestidade de vocês são um ativo; agora precisam estar acompanhados de uma versão executável.
