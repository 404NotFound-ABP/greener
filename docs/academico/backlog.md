# Backlog — GreenER

Planejamento inicial. As prioridades indicam a ordem sugerida de trabalho.

- **EP:** épico, que reúne histórias com um objetivo comum.
- **US:** história de usuário.
- **RF:** requisito funcional do projeto.
- **DOD:** o que verificar para considerar a entrega concluída.
- **DOR:** o que precisa estar definido para começar.
- **ACEITE:** comportamento esperado da entrega.

---

## ![Prioridade alta](https://img.shields.io/badge/Prioridade-Alta-red) EP01 - Monitorar os serviços

**RF relacionados:** RF01, RF02, RF03, RF04, RF05 e RF06.

### DOD

- US01 a US05 verificadas e integradas ao dashboard.
- Testes dos estados e das mudanças registrados; falhas não interrompem o monitoramento.

### DOR

- Consultas da API e respostas de erro conhecidas.
- Intervalos e regras para identificar os estados definidos; primeiras US refinadas.

### ACEITE

- [ ] Descobrir serviços e coletar suas métricas periodicamente.
- [ ] Reconhecer inclusão, remoção, indisponibilidade e retorno sem reiniciar a aplicação.
- [ ] Distinguir “indisponível” de “sem métricas” e refletir as mudanças na tela.

### US01 - Descobrir os serviços disponíveis | RF01

Como usuário, quero que o sistema encontre os serviços disponíveis para iniciar o monitoramento sem cadastro manual.

**DOD**

- Consulta integrada à API real; lista vazia, falha e duplicação verificadas.

**DOR**

- Consulta `/services` e dados retornados conhecidos.

**ACEITE**

- [ ] Obter os serviços disponíveis, com identificador e nome.
- [ ] Tratar lista vazia sem erro; uma falha na API não deve apagar os serviços já conhecidos.

### US02 - Coletar e atualizar as métricas | RF03, RF04

Como usuário, quero receber métricas recentes para acompanhar o uso dos recursos de cada serviço.

**DOD**

- Coletas repetidas verificadas, com horário registrado e gravação integrada à US11.

**DOR**

- Intervalo de coleta, unidades, período das métricas e tratamento de falhas definidos.

**ACEITE**

- [ ] Consultar periodicamente `/metrics/{id_servico}` para cada serviço disponível.
- [ ] Considerar os novos valores de CPU, memória, disco e rede recebidos em cada consulta.
- [ ] Falha em um serviço não interrompe a coleta dos demais.

### US03 - Acompanhar mudanças nos serviços | RF02

Como usuário, quero que o monitoramento acompanhe as mudanças do ambiente para manter as informações atualizadas.

**DOD**

- Inclusão, remoção, indisponibilidade e retorno testados e refletidos na tela.

**DOR**

- Regras para reconhecer as mudanças definidas; consultas e atualização da tela disponíveis por contrato.

**ACEITE**

- [ ] Novos serviços entram no monitoramento; serviços removidos deixam o acompanhamento atual, preservando seu histórico.
- [ ] Indisponibilidade e retorno aparecem automaticamente na tela, sem reinício.
- [ ] Falha na consulta da lista não é interpretada como remoção de todos os serviços.

### US04 - Identificar serviço indisponível | RF05

Como usuário, quero saber quando um serviço não responde para entender seu estado.

**DOD**

- Classificação testada com falhas e limite de espera; sinalização integrada à tela.

**DOR**

- Respostas que indicam indisponibilidade e limite de espera definidos.

**ACEITE**

- [ ] Sinalizar “indisponível” quando o serviço não responder ou indicar indisponibilidade.
- [ ] Continuar monitorando os demais serviços; identificar leituras antigas como desatualizadas.

### US05 - Identificar serviço sem métricas | RF06

Como usuário, quero distinguir um serviço sem métricas de um serviço indisponível para interpretar corretamente seu estado.

**DOD**

- Distinção entre os dois estados testada e apresentada na tela.

**DOR**

- Resposta da API que distingue serviço indisponível de serviço ativo sem métricas conhecida.

**ACEITE**

- [ ] Sinalizar “sem métricas” quando o serviço continuar listado, mas deixar de exportar métricas.
- [ ] Manter as informações disponíveis e indicar que as estimativas sem dados suficientes estão indisponíveis.

---

## ![Prioridade alta](https://img.shields.io/badge/Prioridade-Alta-red) EP02 - Estimar o impacto ambiental

**RF relacionado:** RF07.

### DOD

- US06 integrada ao dashboard; cálculo testado e fórmula, fatores, unidades e período documentados.

### DOR

- Modelo de cálculo validado; métricas necessárias e consulta do fator regional conhecidas.

### ACEITE

- [ ] Calcular energia e emissão estimada de CO₂e por serviço.
- [ ] Informar unidades e período das estimativas.
- [ ] Tratar dados insuficientes e falhas sem apresentar resultados falsos.

### US06 - Calcular energia e emissão por serviço | RF07

Como usuário, quero conhecer a energia e a emissão estimadas de cada serviço para avaliar seu impacto ambiental.

**DOD**

- Cálculo separado dos controllers, integrado às APIs reais e testado com resultados conhecidos e falhas.

**DOR**

- Fórmula, fatores, unidades e duração das métricas definidos; exemplos de cálculo disponíveis.

**ACEITE**

- [ ] Calcular energia em kWh e emissão em gCO₂e usando as métricas e o fator de carbono da região do serviço.
- [ ] Registrar o período e os fatores utilizados no cálculo.
- [ ] Dados ausentes não viram zero; se faltar somente o fator de carbono, manter a energia calculável e indicar emissão indisponível.

---

## ![Prioridade alta](https://img.shields.io/badge/Prioridade-Alta-red) EP03 - Acompanhar o ambiente no dashboard

**RF relacionados:** RF08, RF09, RF11 e RF12.

### DOD

- US07, US08, US09, US10 e US18 integradas.
- Telas verificadas em computador e celular, incluindo carregamento, ausência de dados e falhas.

### DOR

- Protótipo das telas, dados do backend e regras dos indicadores definidos para as primeiras US.

### ACEITE

- [ ] Mostrar estado, localização, métricas, energia e emissão por serviço.
- [ ] Mostrar consumo total, emissão total e contagens de serviços ativos e indisponíveis.
- [ ] Atualizar automaticamente e informar intervalos e data/hora da última atualização.

### US07 - Visualizar estados e métricas | RF09 — estados e métricas

Como usuário, quero visualizar os serviços e suas métricas em uma tela para acompanhar o ambiente.

**DOD**

- Tela integrada ao backend e verificada com dados reais, diferentes estados e tamanhos de tela.

**DOR**

- Protótipo e formato dos dados de serviços, estados e métricas definidos.

**ACEITE**

- [ ] Mostrar nome, estado e métricas disponíveis de CPU, memória, disco e rede, com unidades.
- [ ] Identificar carregamento, lista vazia e falhas; os estados devem ser compreensíveis sem depender apenas de cores.

### US08 - Visualizar indicadores consolidados | RF08

Como usuário, quero ver os totais do ambiente para compreender seu impacto e disponibilidade.

**DOD**

- Contagens e somas testadas com resultados conhecidos e integradas ao dashboard.

**DOR**

- Regras de contagem, período dos totais e tratamento de dados incompletos definidos.

**ACEITE**

- [ ] Mostrar energia total, emissão total e quantidades de serviços ativos e indisponíveis.
- [ ] Usar o mesmo período nos totais e informar quais serviços possuem dados válidos.
- [ ] Identificar totais parciais; dados ausentes não contam como zero.

### US09 - Atualizar o dashboard automaticamente | RF11

Como usuário, quero receber atualizações automáticas para acompanhar mudanças sem recarregar a página.

**DOD**

- Atualização, falha e recuperação verificadas na tela.

**DOR**

- Intervalo de atualização, horário exibido e comportamento em falhas definidos.

**ACEITE**

- [ ] Atualizar os dados no intervalo definido, sem recarga manual.
- [ ] Mostrar os intervalos de coleta e atualização, além da data/hora da última atualização bem-sucedida.
- [ ] Em falha, identificar os dados anteriores como desatualizados e retomar após recuperação.

### US10 - Visualizar a localização dos serviços | RF12, RF09 — localização

Como usuário, quero conhecer a localização dos serviços para entender onde estão hospedados.

**DOD**

- Localização integrada à lista; casos com dados completos e ausentes verificados.

**DOR**

- Campos de país, região e cidade conhecidos; apresentação definida.

**ACEITE**

- [ ] Mostrar país e região; mostrar cidade quando disponível.
- [ ] Ausência de cidade ou coordenadas não impede a exibição das demais informações.

### US18 - Visualizar energia e emissão por serviço | RF09 — indicadores ambientais

Como usuário, quero ver as estimativas ambientais junto de cada serviço para compreender seu impacto.

**DOD**

- Estimativas reais da US06 integradas à tela; unidades, período e falhas verificados.

**DOR**

- Dados de energia e emissão, unidades e apresentação dos valores definidos.

**ACEITE**

- [ ] Mostrar energia em kWh e emissão em gCO₂e por serviço, com período identificado.
- [ ] Valores pequenos devem continuar distinguíveis de zero.
- [ ] Indicar quando não houver dados suficientes para calcular energia ou emissão.

> RF09 estará completo com US07, US10 e US18 integradas.

---

## ![Prioridade alta](https://img.shields.io/badge/Prioridade-Alta-red) EP04 - Consultar histórico e comparar serviços

**RF relacionados:** RF10, RF14 e RF15.

**Ordem sugerida:** salvar coletas primeiro; ranking e comparação têm prioridade baixa na sequência.

### DOD

- US11 a US14 integradas; persistência e consultas verificadas.
- Ranking e comparação testados com período comum e dados incompletos.

### DOR

- Modelo de armazenamento e primeiras US refinadas; regras temporais definidas antes das consultas e comparações.

### ACEITE

- [ ] Preservar as coletas e permitir consulta por período.
- [ ] Ordenar serviços por energia ou emissão, informando o período.
- [ ] Comparar dois ou mais serviços por métricas e indicadores ambientais do mesmo período.

### US11 - Salvar o histórico das coletas | RF10 — armazenamento

Como usuário, quero preservar as coletas para analisar o comportamento dos serviços ao longo do tempo.

**DOD**

- Gravação integrada ao coletor; migrações e recuperação após reinício verificadas.

**DOR**

- ORM, modelo dos dados, identificação da coleta e registro de data/hora definidos.

**ACEITE**

- [ ] Salvar serviço, data/hora, período, estado e métricas disponíveis no PostgreSQL com ORM.
- [ ] Preservar resultados e fatores ambientais quando disponíveis.
- [ ] Manter o histórico após reiniciar os containers ou remover um serviço do monitoramento.

### US12 - Consultar o histórico por período | RF10 — consulta

Como usuário, quero consultar as coletas de um período para analisar a evolução de um serviço.

**DOD**

- Consulta integrada aos dados persistidos; filtros, período inválido e ausência de registros verificados.

**DOR**

- Dados da US11, filtros, limites de consulta e apresentação definidos.

**ACEITE**

- [ ] Selecionar serviço e período e visualizar suas coletas em ordem temporal.
- [ ] Mostrar métricas, estados e indicadores disponíveis, com data/hora e unidades.
- [ ] Recusar período inválido e indicar ausência ou lacunas de dados.

### US13 - Ordenar serviços por impacto | RF14

Como usuário, quero ordenar serviços por energia ou emissão para identificar os maiores impactos.

**DOD**

- Ordenação testada com valores conhecidos, empates e dados ausentes.

**DOR**

- Período, regra de cálculo dos valores e tratamento de empates e lacunas definidos.

**ACEITE**

- [ ] Permitir ordenar por consumo energético estimado ou emissão estimada de CO₂e.
- [ ] Mostrar o período e a direção da ordenação; usar o mesmo período para todos.
- [ ] Serviço sem resultado válido não aparece como consumo zero.

### US14 - Comparar serviços | RF15

Como usuário, quero comparar serviços para avaliar diferenças no uso de recursos e no impacto ambiental.

**DOD**

- Comparação integrada ao histórico e verificada com dados completos e incompletos.

**DOR**

- Métricas comparáveis, período comum, forma de resumir os dados e tela definidos.

**ACEITE**

- [ ] Selecionar dois ou mais serviços e um período comum.
- [ ] Mostrar suas métricas, energia e emissão lado a lado, com unidades.
- [ ] Indicar dados ausentes e orientar quando houver menos de dois serviços selecionados.

---

## ![Prioridade média](https://img.shields.io/badge/Prioridade-M%C3%A9dia-yellow) EP05 - Configurar o monitoramento com segurança

**RF relacionado:** RF16.

**Escopo inicial proposto:** configurar os intervalos de coleta e atualização do dashboard.

### DOD

- US15 e US16 integradas; autenticação e alterações verificadas pela tela e diretamente no backend.
- Senhas protegidas e configurações persistidas.

### DOR

- Usuário inicial, fluxo de login, parâmetros configuráveis e regras de validação definidos.

### ACEITE

- [ ] Autenticar o responsável pela configuração utilizando JWT.
- [ ] Exigir JWT válido no backend para alterar os parâmetros.
- [ ] Validar, salvar e aplicar alterações autorizadas.

### US15 - Autenticar o responsável pela configuração | RF16 — autenticação

Como responsável pelo monitoramento, quero entrar com minhas credenciais para acessar a configuração.

**DOD**

- Login e validação do JWT testados; senhas armazenadas com hash e segredos fora do repositório.

**DOR**

- Criação do usuário inicial, duração da sessão e fluxo de login definidos.

**ACEITE**

- [ ] Credenciais válidas geram JWT; credenciais inválidas não autenticam.
- [ ] Rotas protegidas recusam token ausente, inválido ou expirado.
- [ ] Sair encerra a sessão na interface.

### US16 - Alterar os intervalos do monitoramento | RF16 — configuração protegida

Como responsável autenticado, quero alterar os intervalos para ajustar a frequência do monitoramento.

**DOD**

- Alteração, validação, persistência e aplicação testadas; chamadas sem JWT válido recusadas no backend.

**DOR**

- Valores padrão, unidades, limites e momento de aplicação dos dois intervalos definidos.

**ACEITE**

- [ ] Permitir alterar os intervalos de coleta e atualização da tela com JWT válido.
- [ ] Validar no backend, salvar e aplicar os valores sem reinício manual.
- [ ] Recusar valores inválidos ou chamadas sem autenticação, mantendo a configuração anterior.
- [ ] A mudança de frequência não altera o período das métricas recebidas nem os registros históricos.

> RF16 estará completo com US15 e US16 integradas.

---

## ![Prioridade média](https://img.shields.io/badge/Prioridade-M%C3%A9dia-yellow) EP06 - Visualizar serviços no mapa

**RF relacionado:** RF13.

**Escopo a confirmar:** o requisito usa “poderá”; confirmar a inclusão do mapa antes de assumir a entrega.

### DOD

- US17 integrada e verificada com e sem coordenadas.
- Falhas do mapa não impedem o uso das demais informações.

### DOR

- Inclusão no escopo confirmada; coordenadas e solução do mapa conhecidas.

### ACEITE

- [ ] Mostrar a posição aproximada dos serviços com latitude e longitude válidas.
- [ ] Manter os serviços sem coordenadas acessíveis na lista.
- [ ] Preservar o funcionamento do dashboard quando o mapa falhar.

### US17 - Localizar serviços no mapa | RF13

Como usuário, quero visualizar a posição aproximada dos serviços para entender sua distribuição geográfica.

**DOD**

- Mapa integrado; coordenadas válidas, ausentes e falhas de carregamento verificadas.

**DOR**

- Escopo confirmado; formato das coordenadas e identificação dos serviços no mapa definidos.

**ACEITE**

- [ ] Exibir marcadores para serviços com latitude e longitude válidas.
- [ ] Permitir identificar o serviço pelo marcador.
- [ ] Ausência de coordenadas não impede visualizar localização textual, métricas e indicadores.

---

US18 mantém seu identificador para preservar os vínculos com o planejamento existente.
